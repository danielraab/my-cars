package auth

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-webauthn/webauthn/protocol/webauthncbor"
)

const testOrigin = "https://cars.example"

var b64 = base64.RawURLEncoding

// softAuthenticator is a minimal software WebAuthn authenticator producing
// "none"-attested ES256 discoverable credentials.
type softAuthenticator struct {
	key          *ecdsa.PrivateKey
	credentialID []byte
	userHandle   []byte
	aaguid       []byte
	signCount    uint32
	origin       string
}

func newSoftAuthenticator(t *testing.T) *softAuthenticator {
	t.Helper()
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	id := make([]byte, 16)
	_, _ = rand.Read(id)
	google, _ := hex.DecodeString("ea9b8d664d011d213ce4b6b48cb575d4")
	return &softAuthenticator{key: key, credentialID: id, aaguid: google, origin: testOrigin}
}

func (a *softAuthenticator) authData(withCredential bool) []byte {
	rpIDHash := sha256.Sum256([]byte("cars.example"))
	flags := byte(0x01 | 0x04 | 0x08 | 0x10) // UP, UV, BE, BS
	if withCredential {
		flags |= 0x40 // AT
	}
	out := append(rpIDHash[:], flags)
	out = binary.BigEndian.AppendUint32(out, a.signCount)
	if withCredential {
		x, y := make([]byte, 32), make([]byte, 32)
		a.key.PublicKey.X.FillBytes(x)
		a.key.PublicKey.Y.FillBytes(y)
		cose, _ := webauthncbor.Marshal(map[int]any{1: 2, 3: -7, -1: 1, -2: x, -3: y})
		out = append(out, a.aaguid...)
		out = binary.BigEndian.AppendUint16(out, uint16(len(a.credentialID)))
		out = append(out, a.credentialID...)
		out = append(out, cose...)
	}
	return out
}

func (a *softAuthenticator) clientData(kind, challenge string) []byte {
	data, _ := json.Marshal(map[string]any{"type": kind, "challenge": challenge, "origin": a.origin, "crossOrigin": false})
	return data
}

// create answers registration options with an attestation response.
func (a *softAuthenticator) create(t *testing.T, options map[string]any) json.RawMessage {
	t.Helper()
	publicKey := options["publicKey"].(map[string]any)
	a.userHandle, _ = b64.DecodeString(publicKey["user"].(map[string]any)["id"].(string))
	attestation, err := webauthncbor.Marshal(map[string]any{"fmt": "none", "attStmt": map[string]any{}, "authData": a.authData(true)})
	if err != nil {
		t.Fatal(err)
	}
	out, _ := json.Marshal(map[string]any{
		"id": b64.EncodeToString(a.credentialID), "rawId": b64.EncodeToString(a.credentialID), "type": "public-key",
		"response": map[string]any{
			"clientDataJSON":    b64.EncodeToString(a.clientData("webauthn.create", publicKey["challenge"].(string))),
			"attestationObject": b64.EncodeToString(attestation),
			"transports":        []string{"internal", "hybrid"},
		},
		"clientExtensionResults": map[string]any{},
	})
	return out
}

// get answers login options with an assertion response.
func (a *softAuthenticator) get(t *testing.T, options map[string]any) []byte {
	t.Helper()
	a.signCount++
	challenge := options["publicKey"].(map[string]any)["challenge"].(string)
	authData := a.authData(false)
	clientData := a.clientData("webauthn.get", challenge)
	clientHash := sha256.Sum256(clientData)
	digest := sha256.Sum256(append(append([]byte{}, authData...), clientHash[:]...))
	signature, err := ecdsa.SignASN1(rand.Reader, a.key, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	out, _ := json.Marshal(map[string]any{
		"id": b64.EncodeToString(a.credentialID), "rawId": b64.EncodeToString(a.credentialID), "type": "public-key",
		"response": map[string]any{
			"clientDataJSON":    b64.EncodeToString(clientData),
			"authenticatorData": b64.EncodeToString(authData),
			"signature":         b64.EncodeToString(signature),
			"userHandle":        b64.EncodeToString(a.userHandle),
		},
		"clientExtensionResults": map[string]any{},
	})
	return out
}

type passkeyHarness struct {
	t       *testing.T
	store   *Store
	service *Service
	mux     *http.ServeMux
}

func newPasskeyHarness(t *testing.T) (*passkeyHarness, func()) {
	s, cleanup := testStore(t)
	svc := NewService(s, &fakeMailer{}, nil, testOrigin)
	mux := http.NewServeMux()
	svc.RegisterRoutes(mux)
	return &passkeyHarness{t: t, store: s, service: svc, mux: mux}, cleanup
}

func (h *passkeyHarness) do(method, target, body string, cookies ...*http.Cookie) *httptest.ResponseRecorder {
	r := httptest.NewRequest(method, target, strings.NewReader(body))
	for _, c := range cookies {
		if c != nil {
			r.AddCookie(c)
		}
	}
	w := httptest.NewRecorder()
	h.mux.ServeHTTP(w, r)
	return w
}

// login creates an account with a fresh magic-link style session.
func (h *passkeyHarness) login() (Account, *http.Cookie) {
	h.t.Helper()
	a := testAccount(h.t, h.store)
	return a, h.sessionFor(a)
}

func (h *passkeyHarness) sessionFor(a Account) *http.Cookie {
	h.t.Helper()
	token, digest, _ := NewCredential()
	if err := h.store.CreateSession(context.Background(), digest, a.ID, time.Now().Add(time.Hour)); err != nil {
		h.t.Fatal(err)
	}
	return &http.Cookie{Name: SessionCookieName, Value: token}
}

func cookieNamed(w *httptest.ResponseRecorder, name string) *http.Cookie {
	for _, c := range w.Result().Cookies() {
		if c.Name == name {
			return c
		}
	}
	return nil
}

func decodeJSON(t *testing.T, w *httptest.ResponseRecorder) map[string]any {
	t.Helper()
	var out map[string]any
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatalf("decode %q: %v", w.Body.String(), err)
	}
	return out
}

// register runs a full registration ceremony and returns the summary.
func (h *passkeyHarness) register(a *softAuthenticator, session *http.Cookie, name string) map[string]any {
	h.t.Helper()
	w := h.do("POST", "/api/v1/passkeys/registration-options", "", session)
	if w.Code != http.StatusOK {
		h.t.Fatalf("registration options=%d %s", w.Code, w.Body.String())
	}
	ceremony := cookieNamed(w, passkeyRegistrationCookie)
	body, _ := json.Marshal(map[string]any{"name": name, "credential": a.create(h.t, decodeJSON(h.t, w))})
	w = h.do("POST", "/api/v1/passkeys", string(body), session, ceremony)
	if w.Code != http.StatusCreated {
		h.t.Fatalf("register=%d %s", w.Code, w.Body.String())
	}
	return decodeJSON(h.t, w)
}

// loginWith runs a passkey login ceremony and returns the final response.
func (h *passkeyHarness) loginWith(a *softAuthenticator) *httptest.ResponseRecorder {
	h.t.Helper()
	w := h.do("POST", "/api/v1/auth/passkey/options", "")
	if w.Code != http.StatusOK {
		h.t.Fatalf("login options=%d %s", w.Code, w.Body.String())
	}
	return h.do("POST", "/api/v1/auth/passkey", string(a.get(h.t, decodeJSON(h.t, w))), cookieNamed(w, passkeyLoginCookie))
}

func TestPasskeyRegistrationOptionsAndLogin(t *testing.T) {
	h, cleanup := newPasskeyHarness(t)
	defer cleanup()
	account, session := h.login()
	authenticator := newSoftAuthenticator(t)

	w := h.do("POST", "/api/v1/passkeys/registration-options", "", session)
	options := decodeJSON(t, w)["publicKey"].(map[string]any)
	selection := options["authenticatorSelection"].(map[string]any)
	if options["rp"].(map[string]any)["id"] != "cars.example" || selection["residentKey"] != "required" || selection["userVerification"] != "required" {
		t.Fatalf("registration options=%v", options)
	}
	if a, ok := options["attestation"]; ok && a != "none" {
		t.Fatalf("attestation=%v", a)
	}
	ceremony := cookieNamed(w, passkeyRegistrationCookie)
	if ceremony == nil || !ceremony.HttpOnly || !ceremony.Secure || ceremony.SameSite != http.SameSiteStrictMode {
		t.Fatalf("ceremony cookie=%#v", ceremony)
	}
	credential := authenticator.create(t, map[string]any{"publicKey": options})
	body, _ := json.Marshal(map[string]any{"name": "  Laptop  ", "credential": credential})
	w = h.do("POST", "/api/v1/passkeys", string(body), session, ceremony)
	if w.Code != http.StatusCreated {
		t.Fatalf("register=%d %s", w.Code, w.Body.String())
	}
	summary := decodeJSON(t, w)
	if summary["name"] != "Laptop" || summary["authenticatorName"] != "Google Password Manager" || summary["backedUp"] != true || summary["lastUsedAt"] != nil {
		t.Fatalf("summary=%v", summary)
	}
	if w = h.do("POST", "/api/v1/passkeys", string(body), session, ceremony); w.Code != http.StatusBadRequest {
		t.Fatalf("replayed registration=%d %s", w.Code, w.Body.String())
	}

	w = h.do("POST", "/api/v1/passkeys/registration-options", "", session)
	excluded := decodeJSON(t, w)["publicKey"].(map[string]any)["excludeCredentials"].([]any)
	if len(excluded) != 1 || excluded[0].(map[string]any)["id"] != b64.EncodeToString(authenticator.credentialID) {
		t.Fatalf("excludeCredentials=%v", excluded)
	}

	w = h.do("POST", "/api/v1/auth/passkey/options", "")
	loginOptions := decodeJSON(t, w)
	publicKey := loginOptions["publicKey"].(map[string]any)
	if _, ok := publicKey["allowCredentials"]; ok || publicKey["userVerification"] != "required" || publicKey["rpId"] != "cars.example" {
		t.Fatalf("login options=%v", publicKey)
	}
	assertion := authenticator.get(t, loginOptions)
	loginCeremony := cookieNamed(w, passkeyLoginCookie)
	w = h.do("POST", "/api/v1/auth/passkey", string(assertion), loginCeremony)
	if w.Code != http.StatusNoContent {
		t.Fatalf("login=%d %s", w.Code, w.Body.String())
	}
	passkeySession := cookieNamed(w, SessionCookieName)
	if passkeySession == nil || !passkeySession.HttpOnly {
		t.Fatalf("session cookie=%#v", passkeySession)
	}
	if w = h.do("GET", "/api/v1/session", "", passkeySession); w.Code != http.StatusOK || !strings.Contains(w.Body.String(), account.Email) {
		t.Fatalf("passkey session=%d %s", w.Code, w.Body.String())
	}
	if w = h.do("POST", "/api/v1/auth/passkey", string(assertion), loginCeremony); w.Code != http.StatusUnauthorized {
		t.Fatalf("replayed assertion=%d", w.Code)
	}

	w = h.do("GET", "/api/v1/passkeys", "", session)
	items := decodeJSON(t, w)["items"].([]any)
	if len(items) != 1 || items[0].(map[string]any)["lastUsedAt"] == nil || strings.Contains(w.Body.String(), "publicKey") {
		t.Fatalf("list=%s", w.Body.String())
	}
}

func TestPasskeyLoginRejectsInvalidAssertions(t *testing.T) {
	h, cleanup := newPasskeyHarness(t)
	defer cleanup()
	_, session := h.login()
	authenticator := newSoftAuthenticator(t)
	h.register(authenticator, session, "Laptop")
	if w := h.loginWith(authenticator); w.Code != http.StatusNoContent {
		t.Fatalf("valid login=%d %s", w.Code, w.Body.String())
	}

	authenticator.origin = "https://evil.example"
	if w := h.loginWith(authenticator); w.Code != http.StatusUnauthorized || cookieNamed(w, SessionCookieName) != nil {
		t.Fatalf("wrong origin=%d", w.Code)
	}
	authenticator.origin = testOrigin

	forged := newSoftAuthenticator(t)
	forged.credentialID, forged.userHandle = authenticator.credentialID, authenticator.userHandle
	if w := h.loginWith(forged); w.Code != http.StatusUnauthorized {
		t.Fatalf("bad signature=%d", w.Code)
	}

	unknown := newSoftAuthenticator(t)
	unknown.userHandle = authenticator.userHandle
	if w := h.loginWith(unknown); w.Code != http.StatusUnauthorized {
		t.Fatalf("unknown credential=%d", w.Code)
	}
	unknown.userHandle = make([]byte, 16)
	if w := h.loginWith(unknown); w.Code != http.StatusUnauthorized {
		t.Fatalf("unknown account=%d", w.Code)
	}

	authenticator.signCount = 0 // the next assertion reports 1, below the stored counter
	if w := h.loginWith(authenticator); w.Code != http.StatusUnauthorized {
		t.Fatalf("counter regression=%d", w.Code)
	}
	if w := h.do("POST", "/api/v1/auth/passkey", "{}"); w.Code != http.StatusUnauthorized {
		t.Fatalf("missing ceremony=%d", w.Code)
	}
}

func TestPasskeyRegistrationRequiresFreshLoginAndValidInput(t *testing.T) {
	h, cleanup := newPasskeyHarness(t)
	defer cleanup()
	account, session := h.login()
	authenticator := newSoftAuthenticator(t)

	h.service.now = func() time.Time { return time.Now().Add(10 * time.Minute) }
	w := h.do("POST", "/api/v1/passkeys/registration-options", "", session)
	if w.Code != http.StatusForbidden || decodeJSON(t, w)["code"] != codeReauthenticationRequired || cookieNamed(w, passkeyRegistrationCookie) != nil {
		t.Fatalf("stale options=%d %s", w.Code, w.Body.String())
	}

	h.service.now = time.Now
	w = h.do("POST", "/api/v1/passkeys/registration-options", "", session)
	ceremony := cookieNamed(w, passkeyRegistrationCookie)
	credential := authenticator.create(t, decodeJSON(t, w))
	valid, _ := json.Marshal(map[string]any{"name": "Laptop", "credential": credential})

	h.service.now = func() time.Time { return time.Now().Add(6 * time.Minute) }
	if w = h.do("POST", "/api/v1/passkeys", string(valid), session, ceremony); w.Code != http.StatusForbidden {
		t.Fatalf("stale finish=%d %s", w.Code, w.Body.String())
	}
	h.service.now = time.Now

	for body, field := range map[string]string{
		`{"name":"   ","credential":` + string(credential) + `}`:                              "name",
		`{"name":"` + strings.Repeat("x", 101) + `","credential":` + string(credential) + `}`: "name",
		`{"credential":` + string(credential) + `}`:                                           "name",
		`{"name":"Laptop"}`: "credential",
		`{"name":"Laptop","credential":` + string(credential) + `,"extra":1}`: "extra",
	} {
		w = h.do("POST", "/api/v1/passkeys", body, session, ceremony)
		if w.Code != http.StatusBadRequest || decodeJSON(t, w)["fields"].(map[string]any)[field] == nil {
			t.Fatalf("body %.40s… =%d %s", body, w.Code, w.Body.String())
		}
	}

	if _, err := h.store.pool.Exec(context.Background(), `UPDATE webauthn_challenges SET expires_at = now() - interval '1 second' WHERE account_id = $1`, account.ID); err != nil {
		t.Fatal(err)
	}
	if w = h.do("POST", "/api/v1/passkeys", string(valid), session, ceremony); w.Code != http.StatusBadRequest || decodeJSON(t, w)["code"] != codePasskeyRejected {
		t.Fatalf("expired ceremony=%d %s", w.Code, w.Body.String())
	}
	if list, _ := h.store.ListPasskeys(context.Background(), account.ID); len(list) != 0 {
		t.Fatalf("stored %d passkeys from rejected registrations", len(list))
	}
}

func TestPasskeyManagementRenameAndDelete(t *testing.T) {
	h, cleanup := newPasskeyHarness(t)
	defer cleanup()
	owner, session := h.login()
	_, otherSession := h.login()
	used, spare := newSoftAuthenticator(t), newSoftAuthenticator(t)
	usedID := h.register(used, session, "Laptop")["id"].(string)
	spareID := h.register(spare, session, "Phone")["id"].(string)

	if w := h.do("PATCH", "/api/v1/passkeys/"+usedID, `{"name":"Stolen"}`, otherSession); w.Code != http.StatusNotFound {
		t.Fatalf("foreign rename=%d", w.Code)
	}
	if w := h.do("DELETE", "/api/v1/passkeys/"+usedID, "", otherSession); w.Code != http.StatusNotFound {
		t.Fatalf("foreign delete=%d", w.Code)
	}
	if w := h.do("PATCH", "/api/v1/passkeys/not-a-uuid", `{"name":"x"}`, session); w.Code != http.StatusNotFound {
		t.Fatalf("invalid id=%d", w.Code)
	}
	if w := h.do("PATCH", "/api/v1/passkeys/"+usedID, `{"name":""}`, session); w.Code != http.StatusBadRequest {
		t.Fatalf("empty rename=%d", w.Code)
	}
	w := h.do("PATCH", "/api/v1/passkeys/"+usedID, `{"name":"Work laptop"}`, session)
	if w.Code != http.StatusOK || decodeJSON(t, w)["name"] != "Work laptop" {
		t.Fatalf("rename=%d %s", w.Code, w.Body.String())
	}

	viaUsed := cookieNamed(h.loginWith(used), SessionCookieName)
	viaSpare := cookieNamed(h.loginWith(spare), SessionCookieName)
	w = h.do("DELETE", "/api/v1/passkeys/"+usedID, "", viaUsed)
	if w.Code != http.StatusNoContent || cookieNamed(w, SessionCookieName) == nil || cookieNamed(w, SessionCookieName).MaxAge != -1 {
		t.Fatalf("delete own-session passkey=%d cookies=%v", w.Code, w.Result().Cookies())
	}
	if w = h.do("GET", "/api/v1/session", "", viaUsed); w.Code != http.StatusUnauthorized {
		t.Fatalf("session of deleted passkey=%d", w.Code)
	}
	for _, c := range []*http.Cookie{session, viaSpare} {
		if w = h.do("GET", "/api/v1/session", "", c); w.Code != http.StatusOK {
			t.Fatalf("unrelated session revoked: %d", w.Code)
		}
	}
	w = h.do("DELETE", "/api/v1/passkeys/"+spareID, "", session)
	if w.Code != http.StatusNoContent || cookieNamed(w, SessionCookieName) != nil {
		t.Fatalf("delete last passkey=%d cookies=%v", w.Code, w.Result().Cookies())
	}
	if list, _ := h.store.ListPasskeys(context.Background(), owner.ID); len(list) != 0 {
		t.Fatalf("passkeys remain: %d", len(list))
	}
}
