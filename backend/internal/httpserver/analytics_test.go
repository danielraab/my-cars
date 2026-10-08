package httpserver

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"strconv"
	"strings"
	"testing"
	"testing/fstest"
)

const testSnippet = `<script defer src="https://stats.example/script.js" data-website-id="abc"></script>`

func TestInjectBeforeHeadEnd(t *testing.T) {
	for _, tc := range []struct{ name, doc, want string }{
		{"lowercase", "<html><head><title>x</title></head><body></body></html>", "<html><head><title>x</title>S</head><body></body></html>"},
		{"uppercase", "<HTML><HEAD></HEAD></HTML>", "<HTML><HEAD>S</HEAD></HTML>"},
		{"first occurrence", "<head></head><template></head></template>", "<head>S</head><template></head></template>"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			got, err := injectBeforeHeadEnd([]byte(tc.doc), "S")
			if err != nil || string(got) != tc.want {
				t.Fatalf("injectBeforeHeadEnd() = %q, %v; want %q", got, err, tc.want)
			}
		})
	}
}

func TestWithAnalyticsSnippet_Errors(t *testing.T) {
	_, err := WithAnalyticsSnippet(fstest.MapFS{"index.html": {Data: []byte("<html><body></body></html>")}}, testSnippet)
	if !errors.Is(err, errNoHeadEnd) {
		t.Fatalf("missing </head>: err = %v, want errNoHeadEnd", err)
	}
	_, err = WithAnalyticsSnippet(fstest.MapFS{"placeholder": {Data: []byte("x")}}, testSnippet)
	if err == nil || !strings.Contains(err.Error(), "ANALYTICS_SNIPPET") {
		t.Fatalf("missing index.html: err = %v, want one naming ANALYTICS_SNIPPET", err)
	}
	for _, err := range []error{errNoHeadEnd, err} {
		if strings.Contains(err.Error(), "stats.example") {
			t.Fatalf("error %q leaks the snippet", err)
		}
	}
}

func analyticsStaticFS() fstest.MapFS {
	fsys := testStaticFS()
	fsys["index.html"] = &fstest.MapFile{Data: []byte("<html><head><title>My cars</title></head><body>spa shell</body></html>")}
	return fsys
}

func TestStatic_AnalyticsSnippetOnEveryIndexResponse(t *testing.T) {
	staticFS, err := WithAnalyticsSnippet(analyticsStaticFS(), testSnippet)
	if err != nil {
		t.Fatalf("WithAnalyticsSnippet() error = %v", err)
	}
	mux := NewMux(fakePinger{}, nil, staticFS)
	want := "<html><head><title>My cars</title>" + testSnippet + "</head><body>spa shell</body></html>"

	for _, path := range []string{"/", "/index.html", "/cars/1"} {
		t.Run(path, func(t *testing.T) {
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
			}
			if rec.Body.String() != want {
				t.Fatalf("body = %q, want %q", rec.Body.String(), want)
			}
			if got := rec.Header().Get("Content-Length"); got != strconv.Itoa(len(want)) {
				t.Fatalf("Content-Length = %q, want %d", got, len(want))
			}
			if got := rec.Header().Get("Content-Type"); !strings.HasPrefix(got, "text/html") {
				t.Fatalf("Content-Type = %q, want text/html", got)
			}
		})
	}

	for _, path := range []string{"/assets/app.js", "/manifest.webmanifest", "/api/does-not-exist", "/api/healthz"} {
		t.Run(path, func(t *testing.T) {
			rec := httptest.NewRecorder()
			mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, path, nil))
			if strings.Contains(rec.Body.String(), testSnippet) {
				t.Fatalf("body = %q, must not contain the snippet", rec.Body.String())
			}
		})
	}
}

func TestStatic_NoAnalyticsSnippetServesIndexUnchanged(t *testing.T) {
	original := analyticsStaticFS()
	staticFS, err := WithAnalyticsSnippet(original, "")
	if err != nil {
		t.Fatalf("WithAnalyticsSnippet() error = %v", err)
	}
	mux := NewMux(fakePinger{}, nil, staticFS)

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/", nil))
	if got, want := rec.Body.String(), string(original["index.html"].Data); got != want {
		t.Fatalf("body = %q, want the embedded index.html %q", got, want)
	}
}
