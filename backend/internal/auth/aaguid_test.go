package auth

import (
	"encoding/hex"
	"strings"
	"testing"
)

func TestAuthenticatorName(t *testing.T) {
	google, _ := hex.DecodeString(strings.ReplaceAll("ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4", "-", ""))
	if name := AuthenticatorName(google); name == nil || *name != "Google Password Manager" {
		t.Fatalf("known AAGUID name=%v", name)
	}
	unknown, _ := hex.DecodeString("0123456789abcdef0123456789abcdef")
	for _, aaguid := range [][]byte{nil, make([]byte, 16), unknown, google[:8]} {
		if name := AuthenticatorName(aaguid); name != nil {
			t.Errorf("AAGUID %x name=%q, want nil", aaguid, *name)
		}
	}
}
