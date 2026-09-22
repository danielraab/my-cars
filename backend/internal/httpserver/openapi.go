package httpserver

import "net/http"

// openapiHandler serves the OpenAPI document embedded in the binary at
// build time, byte for byte, per specs/platform/http-server.
func openapiHandler(doc []byte) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/yaml")
		w.Write(doc)
	})
}
