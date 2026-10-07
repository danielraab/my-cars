package httpserver

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"testing/fstest"
)

func testStaticFS() fstest.MapFS {
	return fstest.MapFS{
		"index.html":           &fstest.MapFile{Data: []byte("<html>spa shell</html>")},
		"assets/app.js":        &fstest.MapFile{Data: []byte("console.log('app')")},
		"manifest.webmanifest": &fstest.MapFile{Data: []byte(`{"name":"My cars"}`)},
		"favicon.ico":          &fstest.MapFile{Data: icoHeader},
	}
}

// The first bytes of an ICO file, enough for content sniffing to recognise it.
var icoHeader = []byte{0, 0, 1, 0, 1, 0, 16, 16, 0, 0, 1, 0, 32, 0}

func TestStatic_ContentTypes(t *testing.T) {
	mux := NewMux(fakePinger{}, nil, testStaticFS())

	for path, want := range map[string]string{
		// Not in Go's built-in MIME table nor guaranteed in the runtime
		// image's, so static.go registers it.
		"/manifest.webmanifest": "application/manifest+json",
		// Browsers probe this path; it must be the icon, not the SPA shell.
		"/favicon.ico": "image/vnd.microsoft.icon",
	} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
			}
			if got := rec.Header().Get("Content-Type"); got != want {
				t.Fatalf("Content-Type = %q, want %q", got, want)
			}
		})
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

	for _, path := range []string{"/", "/auth/login", "/home", "/cars", "/refuels", "/repairs", "/tickets", "/profile"} {
		t.Run(path, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, req)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
			}
			if rec.Body.String() != "<html>spa shell</html>" {
				t.Fatalf("body = %q, want index.html's contents", rec.Body.String())
			}
		})
	}
}
