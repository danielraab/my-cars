package auth

import (
	"context"
	"errors"
	"testing"
	"time"
)

func testAccount(t *testing.T, s *Store) Account {
	t.Helper()
	email := uniqueTestEmail()
	a, err := s.ResolveOIDCIdentity(context.Background(), "https://issuer.example", email, email)
	if err != nil {
		t.Fatal(err)
	}
	return a
}

func testPasskey(accountID, credentialID string) Passkey {
	return Passkey{AccountID: accountID, CredentialID: []byte(credentialID), PublicKey: []byte("key"), AAGUID: make([]byte, 16), SignCount: 1, Transports: []string{"internal"}, AttestationFormat: "none", UserVerified: true, BackupEligible: true, BackupState: true, Name: "Laptop"}
}

func TestStorePasskeyChallengesAreSingleUseExpiringAndAccountBound(t *testing.T) {
	s, cleanup := testStore(t)
	defer cleanup()
	ctx := context.Background()
	now := time.Now()
	a, b := testAccount(t, s), testAccount(t, s)
	data := []byte(`{"test":"auth-test","challenge":"c"}`)

	registration := Digest("registration-" + a.Email)
	if err := s.CreatePasskeyChallenge(ctx, registration, ceremonyRegistration, a.ID, data, now.Add(time.Minute)); err != nil {
		t.Fatal(err)
	}
	if _, err := s.ConsumePasskeyChallenge(ctx, registration, ceremonyRegistration, b.ID, now); !errors.Is(err, ErrInvalidCredential) {
		t.Fatalf("other account error=%v", err)
	}
	if _, err := s.ConsumePasskeyChallenge(ctx, registration, ceremonyLogin, "", now); !errors.Is(err, ErrInvalidCredential) {
		t.Fatalf("other kind error=%v", err)
	}
	got, err := s.ConsumePasskeyChallenge(ctx, registration, ceremonyRegistration, a.ID, now)
	if err != nil || len(got) == 0 {
		t.Fatalf("consume=%q err=%v", got, err)
	}
	if _, err = s.ConsumePasskeyChallenge(ctx, registration, ceremonyRegistration, a.ID, now); !errors.Is(err, ErrInvalidCredential) {
		t.Fatalf("replay error=%v", err)
	}

	expired := Digest("login-expired-" + a.Email)
	if err = s.CreatePasskeyChallenge(ctx, expired, ceremonyLogin, "", data, now.Add(-time.Second)); err != nil {
		t.Fatal(err)
	}
	if _, err = s.ConsumePasskeyChallenge(ctx, expired, ceremonyLogin, "", now); !errors.Is(err, ErrInvalidCredential) {
		t.Fatalf("expired error=%v", err)
	}
	pending := Digest("login-pending-" + a.Email)
	if err = s.CreatePasskeyChallenge(ctx, pending, ceremonyLogin, "", data, now.Add(time.Minute)); err != nil {
		t.Fatal(err)
	}
	if err = s.Prune(ctx, now); err != nil {
		t.Fatal(err)
	}
	var remaining int
	if err = s.pool.QueryRow(ctx, `SELECT count(*) FROM webauthn_challenges WHERE ceremony_digest = ANY($1)`, [][]byte{expired, pending}).Scan(&remaining); err != nil || remaining != 1 {
		t.Fatalf("after prune remaining=%d err=%v, want only the unexpired challenge", remaining, err)
	}
	if _, err = s.ConsumePasskeyChallenge(ctx, pending, ceremonyLogin, "", now); err != nil {
		t.Fatalf("unexpired challenge pruned: %v", err)
	}
}

func TestStorePasskeyCredentialsAreScopedToTheirAccount(t *testing.T) {
	s, cleanup := testStore(t)
	defer cleanup()
	ctx := context.Background()
	a, b := testAccount(t, s), testAccount(t, s)

	first, err := s.CreatePasskey(ctx, testPasskey(a.ID, "cred-a1-"+a.Email))
	if err != nil {
		t.Fatal(err)
	}
	if first.ID == "" || first.Name != "Laptop" || first.LastUsedAt != nil || !first.BackupState || first.SignCount != 1 {
		t.Fatalf("created=%+v", first)
	}
	second := testPasskey(a.ID, "cred-a2-"+a.Email)
	second.Name = "Phone"
	if _, err = s.CreatePasskey(ctx, second); err != nil {
		t.Fatal(err)
	}
	if _, err = s.CreatePasskey(ctx, testPasskey(b.ID, "cred-a1-"+a.Email)); !errors.Is(err, ErrDuplicatePasskey) {
		t.Fatalf("duplicate credential ID error=%v", err)
	}

	list, err := s.ListPasskeys(ctx, a.ID)
	if err != nil || len(list) != 2 || list[0].Name != "Laptop" || list[1].Name != "Phone" {
		t.Fatalf("list=%+v err=%v", list, err)
	}
	if others, _ := s.ListPasskeys(ctx, b.ID); len(others) != 0 {
		t.Fatalf("other account sees %d passkeys", len(others))
	}
	account, passkeys, err := s.AccountPasskeys(ctx, a.ID)
	if err != nil || account.Email != a.Email || len(passkeys) != 2 {
		t.Fatalf("account passkeys=%v %d err=%v", account, len(passkeys), err)
	}

	if _, err = s.RenamePasskey(ctx, b.ID, first.ID, "Stolen"); !errors.Is(err, ErrPasskeyNotFound) {
		t.Fatalf("foreign rename error=%v", err)
	}
	renamed, err := s.RenamePasskey(ctx, a.ID, first.ID, "Work laptop")
	if err != nil || renamed.Name != "Work laptop" {
		t.Fatalf("rename=%+v err=%v", renamed, err)
	}
	if err = s.DeletePasskey(ctx, b.ID, first.ID, time.Now()); !errors.Is(err, ErrPasskeyNotFound) {
		t.Fatalf("foreign delete error=%v", err)
	}
}

func TestStorePasskeyLoginSessionsAndDeletion(t *testing.T) {
	s, cleanup := testStore(t)
	defer cleanup()
	ctx := context.Background()
	now := time.Now()
	a := testAccount(t, s)
	used, err := s.CreatePasskey(ctx, testPasskey(a.ID, "cred-used-"+a.Email))
	if err != nil {
		t.Fatal(err)
	}
	other, err := s.CreatePasskey(ctx, testPasskey(a.ID, "cred-other-"+a.Email))
	if err != nil {
		t.Fatal(err)
	}

	magic := Digest("magic-session-" + a.Email)
	if err = s.CreateSession(ctx, magic, a.ID, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if session, err := s.Session(ctx, magic, now); err != nil || session.PasskeyID != "" || session.CreatedAt.IsZero() {
		t.Fatalf("magic session=%+v err=%v", session, err)
	}
	viaUsed := []([]byte){Digest("passkey-session-1-" + a.Email), Digest("passkey-session-2-" + a.Email)}
	for _, digest := range viaUsed {
		if err = s.CompletePasskeyLogin(ctx, used.CredentialID, 7, false, now, digest, now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
	}
	viaOther := Digest("passkey-session-other-" + a.Email)
	if err = s.CompletePasskeyLogin(ctx, other.CredentialID, 0, true, now, viaOther, now.Add(time.Hour)); err != nil {
		t.Fatal(err)
	}
	if err = s.CompletePasskeyLogin(ctx, []byte("unknown"), 0, true, now, Digest("unknown-"+a.Email), now.Add(time.Hour)); !errors.Is(err, ErrInvalidCredential) {
		t.Fatalf("unknown credential error=%v", err)
	}
	session, err := s.Session(ctx, viaUsed[0], now)
	if err != nil || session.PasskeyID != used.ID || session.Email != a.Email {
		t.Fatalf("passkey session=%+v err=%v", session, err)
	}
	_, passkeys, _ := s.AccountPasskeys(ctx, a.ID)
	for _, p := range passkeys {
		if p.ID == used.ID && (p.SignCount != 7 || p.BackupState || p.LastUsedAt == nil) {
			t.Fatalf("login not recorded: %+v", p)
		}
	}

	if err = s.DeletePasskey(ctx, a.ID, used.ID, now); err != nil {
		t.Fatal(err)
	}
	for _, digest := range viaUsed {
		if _, err = s.Session(ctx, digest, now); !errors.Is(err, ErrInvalidCredential) {
			t.Fatalf("session of deleted passkey still active: %v", err)
		}
	}
	for _, digest := range [][]byte{magic, viaOther} {
		if _, err = s.Session(ctx, digest, now); err != nil {
			t.Fatalf("unrelated session revoked: %v", err)
		}
	}
	if err = s.DeletePasskey(ctx, a.ID, other.ID, now); err != nil {
		t.Fatalf("delete last passkey: %v", err)
	}
	if list, _ := s.ListPasskeys(ctx, a.ID); len(list) != 0 {
		t.Fatalf("passkeys remain: %d", len(list))
	}
}
