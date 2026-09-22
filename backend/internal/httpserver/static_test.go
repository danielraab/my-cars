package httpserver

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func testStaticFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":    &fstest.MapFile{Data: []byte("<html>spa shell</html>")},
		"assets/app.js": &fstest.MapFile{Data: []byte("console.log('app')")},
	}
}

func TestStatic_KnownAsset(t *testing.T) {
	mux := NewMux(fakePinger{}, nil, testStaticFS())

	req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if rec.Body.String() != "console.log('app')" {
		t.Fatalf("body = %q, want the asset's contents", rec.Body.String())
	}
}

func TestStatic_UnmatchedPathFallsBackToIndex(t *testing.T) {
	mux := NewMux(fakePinger{}, nil, testStaticFS())

	req := httptest.NewRequest(http.MethodGet, "/cars/42", nil)
	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}
	if rec.Body.String() != "<html>spa shell</html>" {
		t.Fatalf("body = %q, want index.html's contents", rec.Body.String())
	}
}
