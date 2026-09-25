package auth

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-jose/go-jose/v4"
)

func TestOIDCClientVerifiesProviderAndClaims(t *testing.T) {
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	signer, err := jose.NewSigner(jose.SigningKey{Algorithm: jose.RS256, Key: key}, (&jose.SignerOptions{}).WithType("JWT").WithHeader("kid", "test"))
	if err != nil {
		t.Fatal(err)
	}
	var server *httptest.Server
	verified := true
	server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.URL.Path {
		case "/.well-known/openid-configuration":
			json.NewEncoder(w).Encode(map[string]any{"issuer": server.URL, "authorization_endpoint": server.URL + "/authorize", "token_endpoint": server.URL + "/token", "jwks_uri": server.URL + "/jwks", "response_types_supported": []string{"code"}, "subject_types_supported": []string{"public"}, "id_token_signing_alg_values_supported": []string{"RS256"}})
		case "/jwks":
			json.NewEncoder(w).Encode(jose.JSONWebKeySet{Keys: []jose.JSONWebKey{{Key: &key.PublicKey, KeyID: "test", Algorithm: "RS256", Use: "sig"}}})
		case "/token":
			claims := map[string]any{"iss": server.URL, "sub": "subject", "aud": "client", "exp": time.Now().Add(time.Hour).Unix(), "iat": time.Now().Unix(), "nonce": "nonce", "email": "Driver@Example.com", "email_verified": verified}
			payload, _ := json.Marshal(claims)
			signed, signErr := signer.Sign(payload)
			if signErr != nil {
				t.Error(signErr)
				w.WriteHeader(500)
				return
			}
			raw, compactErr := signed.CompactSerialize()
			if compactErr != nil {
				t.Error(compactErr)
				w.WriteHeader(500)
				return
			}
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]any{"access_token": "access", "token_type": "Bearer", "expires_in": 3600, "id_token": raw})
		default:
			http.NotFound(w, r)
		}
	}))
	defer server.Close()
	client, err := NewOIDCClient(context.Background(), server.URL, "client", "secret", "https://cars.example/api/v1/auth/oidc/callback")
	if err != nil {
		t.Fatal(err)
	}
	identity, err := client.Verify(context.Background(), "code", "verifier", "nonce")
	if err != nil {
		t.Fatal(err)
	}
	if identity.Issuer != server.URL || identity.Subject != "subject" || identity.Email != "Driver@Example.com" {
		t.Fatalf("identity=%+v", identity)
	}
	verified = false
	if _, err = client.Verify(context.Background(), "code", "verifier", "nonce"); err == nil {
		t.Fatal("unverified email accepted")
	}
	verified = true
	if _, err = client.Verify(context.Background(), "code", "verifier", "wrong-nonce"); err == nil {
		t.Fatal("wrong nonce accepted")
	}
}
