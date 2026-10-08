package httpserver

import (
	"bytes"
	"errors"
	"fmt"
	"io/fs"
	"time"
)

// WithAnalyticsSnippet returns staticFS with its index.html replaced by a copy
// that has snippet inserted immediately before the first </head>, per
// specs/platform/http-server. The copy is built once here, so every path that
// serves index.html (/, /index.html, the SPA fallback) gets the same bytes.
// An empty snippet returns staticFS unchanged.
//
// Errors never include the snippet itself, so they are safe to log.
func WithAnalyticsSnippet(staticFS fs.FS, snippet string) (fs.FS, error) {
	if snippet == "" {
		return staticFS, nil
	}
	original, err := fs.ReadFile(staticFS, "index.html")
	if err != nil {
		return nil, fmt.Errorf("ANALYTICS_SNIPPET is set but the embedded frontend has no readable index.html: %w", err)
	}
	info, err := fs.Stat(staticFS, "index.html")
	if err != nil {
		return nil, fmt.Errorf("ANALYTICS_SNIPPET is set but index.html cannot be inspected: %w", err)
	}
	doc, err := injectBeforeHeadEnd(original, snippet)
	if err != nil {
		return nil, err
	}
	return &indexOverlayFS{FS: staticFS, index: doc, modTime: info.ModTime()}, nil
}

var errNoHeadEnd = errors.New("ANALYTICS_SNIPPET is set but the embedded index.html has no </head> to insert it before")

func injectBeforeHeadEnd(doc []byte, snippet string) ([]byte, error) {
	i := bytes.Index(bytes.ToLower(doc), []byte("</head>"))
	if i < 0 {
		return nil, errNoHeadEnd
	}
	out := make([]byte, 0, len(doc)+len(snippet))
	out = append(out, doc[:i]...)
	out = append(out, snippet...)
	return append(out, doc[i:]...), nil
}

// indexOverlayFS serves index from memory in place of the wrapped FS's
// index.html and delegates every other name.
type indexOverlayFS struct {
	fs.FS
	index   []byte
	modTime time.Time
}

func (o *indexOverlayFS) Open(name string) (fs.File, error) {
	if name != "index.html" {
		return o.FS.Open(name)
	}
	return &memFile{Reader: bytes.NewReader(o.index), info: memFileInfo{size: int64(len(o.index)), modTime: o.modTime}}, nil
}

// memFile implements fs.File and io.ReadSeeker, so serveFile streams it
// through http.ServeContent without buffering it again.
type memFile struct {
	*bytes.Reader
	info memFileInfo
}

func (f *memFile) Stat() (fs.FileInfo, error) { return f.info, nil }
func (f *memFile) Close() error               { return nil }

type memFileInfo struct {
	size    int64
	modTime time.Time
}

func (i memFileInfo) Name() string       { return "index.html" }
func (i memFileInfo) Size() int64        { return i.size }
func (i memFileInfo) Mode() fs.FileMode  { return 0o444 }
func (i memFileInfo) ModTime() time.Time { return i.modTime }
func (i memFileInfo) IsDir() bool        { return false }
func (i memFileInfo) Sys() any           { return nil }
