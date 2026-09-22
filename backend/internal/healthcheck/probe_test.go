package healthcheck

import (
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
)

func portOf(t *testing.T, addr string) string {
	t.Helper()
	_, port, err := net.SplitHostPort(addr)
	if err != nil {
		t.Fatalf("SplitHostPort(%q): %v", addr, err)
	}
	return port
}

func TestProbe_Healthy(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	if err := Probe(portOf(t, srv.Listener.Addr().String())); err != nil {
		t.Fatalf("Probe() error: %v", err)
	}
}

func TestProbe_UnhealthyResponse(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer srv.Close()

	if err := Probe(portOf(t, srv.Listener.Addr().String())); err == nil {
		t.Fatal("Probe() with a 503 target: expected error, got nil")
	}
}

func TestProbe_Unreachable(t *testing.T) {
	// Open a listener to claim a free port, then close it immediately so
	// nothing is listening there.
	l, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("net.Listen: %v", err)
	}
	port := portOf(t, l.Addr().String())
	l.Close()

	if err := Probe(port); err == nil {
		t.Fatal("Probe() against an unreachable port: expected error, got nil")
	}
}
