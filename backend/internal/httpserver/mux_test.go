package httpserver

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMux_UnknownAPIPathIs404NotFrontend(t *testing.T) {
	mux := NewMux(fakePinger{}, nil, testStaticFS())

	req := httptest.NewRequest(http.MethodGet, "/api/does-not-exist", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNotFound)
	}
	if strings.Contains(rec.Body.String(), "spa shell") {
		t.Fatalf("body = %q, must not be the frontend's index.html", rec.Body.String())
	}
}
