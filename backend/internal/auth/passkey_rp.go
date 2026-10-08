package auth

import (
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
)

// passkeyCeremonyTTL bounds both the browser prompt timeout and the lifetime
// of the server-side challenge.
const passkeyCeremonyTTL = 5 * time.Minute

// NewRelyingParty configures WebAuthn for the application origin. The
// relying-party ID is the base URL's host without port, and the base URL's
// origin is the only accepted client origin.
func NewRelyingParty(baseURL string) (*webauthn.WebAuthn, error) {
	origin := strings.TrimRight(baseURL, "/")
	u, err := url.Parse(origin)
	if err != nil || u.Hostname() == "" || (u.Scheme != "https" && u.Scheme != "http") {
		return nil, fmt.Errorf("passkey relying party: invalid base URL %q", baseURL)
	}
	timeout := webauthn.TimeoutConfig{Enforce: true, Timeout: passkeyCeremonyTTL, TimeoutUVD: passkeyCeremonyTTL}
	rp, err := webauthn.New(&webauthn.Config{
		RPID:          u.Hostname(),
		RPDisplayName: "my-car",
		RPOrigins:     []string{u.Scheme + "://" + u.Host},
		Timeouts:      webauthn.TimeoutsConfig{Login: timeout, Registration: timeout},
	})
	if err != nil {
		return nil, fmt.Errorf("passkey relying party: %w", err)
	}
	return rp, nil
}
