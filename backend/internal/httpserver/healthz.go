package httpserver

import (
	"context"
	"net/http"
	"time"
)

// Pinger reports whether the database is currently reachable. *pgxpool.Pool
// satisfies this.
type Pinger interface {
	Ping(ctx context.Context) error
}

// healthzHandler implements the /api/healthz contract from
// specs/platform/healthcheck: 200 when the database is reachable, 503
// otherwise, 405 for any method other than GET.
//
// The method check happens here rather than via a "GET /api/healthz"
// ServeMux pattern: with only one method registered for that path, an
// unmatched method falls through to the "/api/" catch-all (404) instead of
// the 405 ServeMux only synthesizes when another pattern shares the exact
// same path with a different method.
func healthzHandler(db Pinger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := db.Ping(ctx); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	})
}
