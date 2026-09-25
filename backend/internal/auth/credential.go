// Package auth provides server-side passwordless authentication primitives.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
)

// NewCredential creates an opaque URL-safe bearer value and its database-safe
// SHA-256 digest. Callers must send only value to the browser or email and
// persist only digest.
func NewCredential() (value string, digest []byte, err error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", nil, fmt.Errorf("read credential entropy: %w", err)
	}
	value = base64.RawURLEncoding.EncodeToString(raw)
	sum := sha256.Sum256([]byte(value))
	return value, sum[:], nil
}

// Digest returns the representation used to look up an opaque credential.
func Digest(value string) []byte {
	sum := sha256.Sum256([]byte(value))
	return sum[:]
}
