// Package healthcheck implements the server's "healthcheck" CLI subcommand:
// a self-probe of its own /api/healthz, used by the container HEALTHCHECK
// since the distroless runtime image has no curl.
package healthcheck

import (
	"fmt"
	"net/http"
	"time"
)

// Probe requests GET /api/healthz on localhost:port and returns nil if it
// responded 200. Any other response, or a failure to connect at all, is
// returned as an error, per specs/platform/healthcheck.
func Probe(port string) error {
	url := fmt.Sprintf("http://localhost:%s/api/healthz", port)
	client := &http.Client{Timeout: 5 * time.Second}

	resp, err := client.Get(url)
	if err != nil {
		return fmt.Errorf("probe %s: %w", url, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("probe %s: status %d", url, resp.StatusCode)
	}
	return nil
}
