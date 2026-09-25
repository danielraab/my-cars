package auth

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestSessionCookie(t *testing.T) {
	r := httptest.NewRecorder()
	SetSessionCookie(r, "opaque", time.Now().Add(time.Hour))
	c := r.Result().Cookies()[0]
	if !c.HttpOnly || !c.Secure || c.SameSite != 2 || c.Path != "/" {
		t.Fatalf("insecure cookie: %#v", c)
	}
}
