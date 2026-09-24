package main

import (
	"bytes"
	"os"
	"path/filepath"
	"testing"
)

func TestEmbeddedOpenAPICopyMatchesSource(t *testing.T) {
	source, err := os.ReadFile(filepath.Join("..", "openapi", "openapi.yaml"))
	if err != nil {
		t.Fatalf("read root OpenAPI source: %v", err)
	}
	copy, err := os.ReadFile("openapi.yaml")
	if err != nil {
		t.Fatalf("read backend OpenAPI copy: %v", err)
	}
	if !bytes.Equal(source, copy) {
		t.Fatal("backend/openapi.yaml must match openapi/openapi.yaml")
	}
}
