package auth

import (
	"bytes"
	"testing"
)

func TestNewCredential(t *testing.T) {
	first, firstDigest, err := NewCredential()
	if err != nil {
		t.Fatal(err)
	}
	second, _, err := NewCredential()
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("credentials must be random")
	}
	if bytes.Equal([]byte(first), firstDigest) {
		t.Fatal("digest must not contain credential")
	}
	if !bytes.Equal(firstDigest, Digest(first)) {
		t.Fatal("digest does not match credential")
	}
}
