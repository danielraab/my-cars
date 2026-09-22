// Package httpserver builds the backend's HTTP request router: the /api/
// namespace (health check, OpenAPI document) and the frontend static/SPA
// fallback for everything else, per specs/platform/healthcheck and
// specs/platform/http-server.
package httpserver

import (
	"io/fs"
	"net/http"
)

// NewMux builds the backend's top-level router.
//
//   - /api/healthz (any method) -> healthzHandler (405s non-GET itself)
//   - GET /api/openapi.yaml     -> openapiHandler
//   - /api/*                    -> 404 for anything else under the API namespace
//   - /*                        -> staticHandler (embedded frontend, SPA fallback)
func NewMux(db Pinger, openapiDoc []byte, staticFS fs.FS) *http.ServeMux {
	mux := http.NewServeMux()

	mux.Handle("/api/healthz", healthzHandler(db))
	mux.Handle("GET /api/openapi.yaml", openapiHandler(openapiDoc))
	// Reserves the whole /api/ subtree for API routes: without this, an
	// unmatched /api/* path would fall through to the "/" pattern below
	// and be served (incorrectly) as a frontend route.
	mux.HandleFunc("/api/", http.NotFound)

	mux.Handle("/", staticHandler(staticFS))

	return mux
}
