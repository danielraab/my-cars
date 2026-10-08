package auth

import "testing"

func TestNewRelyingPartyDerivesIDAndOriginFromBaseURL(t *testing.T) {
	for _, tc := range []struct{ baseURL, id, origin string }{
		{"https://cars.example", "cars.example", "https://cars.example"},
		{"https://cars.example/", "cars.example", "https://cars.example"},
		{"https://cars.example:8443", "cars.example", "https://cars.example:8443"},
		{"http://localhost:8080", "localhost", "http://localhost:8080"},
	} {
		rp, err := NewRelyingParty(tc.baseURL)
		if err != nil {
			t.Fatalf("%s: %v", tc.baseURL, err)
		}
		if rp.Config.RPID != tc.id || len(rp.Config.RPOrigins) != 1 || rp.Config.RPOrigins[0] != tc.origin {
			t.Errorf("%s: id=%q origins=%v", tc.baseURL, rp.Config.RPID, rp.Config.RPOrigins)
		}
	}
	for _, bad := range []string{"", "cars.example", "ftp://cars.example"} {
		if _, err := NewRelyingParty(bad); err == nil {
			t.Errorf("%q accepted", bad)
		}
	}
}
