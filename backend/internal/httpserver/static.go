package httpserver

import (
	"bytes"
	"io"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// staticHandler serves the embedded frontend build for any request outside
// /api/: the matching file if the request path corresponds to one, or
// index.html otherwise (SPA fallback), per specs/platform/http-server.
//
// This serves files itself rather than delegating to http.FileServerFS:
// that handler 301-redirects any request for a path literally named
// "index.html" (its own anti-ambiguity special case), which would break
// exactly the fallback this handler exists to provide.
func staticHandler(staticFS fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rel := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if rel == "" || rel == "." {
			rel = "index.html"
		}

		if info, err := fs.Stat(staticFS, rel); err != nil || info.IsDir() {
			rel = "index.html"
		}

		serveFile(w, r, staticFS, rel)
	})
}

func serveFile(w http.ResponseWriter, r *http.Request, staticFS fs.FS, name string) {
	f, err := staticFS.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()

	stat, err := f.Stat()
	if err != nil {
		http.Error(w, "internal error", http.StatusInternalServerError)
		return
	}

	// embed.FS files implement io.ReadSeeker; fall back to buffering for
	// any fs.FS that doesn't (e.g. some test doubles).
	rs, ok := f.(io.ReadSeeker)
	if !ok {
		data, err := io.ReadAll(f)
		if err != nil {
			http.Error(w, "internal error", http.StatusInternalServerError)
			return
		}
		rs = bytes.NewReader(data)
	}

	http.ServeContent(w, r, name, stat.ModTime(), rs)
}
