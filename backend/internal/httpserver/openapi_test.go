package httpserver

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestOpenAPI_ServesEmbeddedDocument(t *testing.T) {
	doc := []byte("openapi: 3.1.0\ninfo:\n  title: test\n")
	mux := NewMux(fakePinger{}, doc, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/openapi.yaml", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if !bytes.Equal(rec.Body.Bytes(), doc) {
		t.Fatalf("body = %q, want %q", rec.Body.Bytes(), doc)
	}
}
