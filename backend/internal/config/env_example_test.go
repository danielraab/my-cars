package config

import (
	"bufio"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"testing"
)

var envLineRE = regexp.MustCompile(`^([A-Z][A-Z0-9_]*)=`)

// parseEnvExampleKeys returns every uncommented KEY=... variable name in
// backend/.env.example. Commented-out lines are intentionally excluded.
func parseEnvExampleKeys(t *testing.T) []string {
	t.Helper()

	path := filepath.Join("..", "..", ".env.example")
	f, err := os.Open(path)
	if err != nil {
		t.Fatalf("open %s: %v", path, err)
	}
	defer f.Close()

	var keys []string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		if m := envLineRE.FindStringSubmatch(line); m != nil {
			keys = append(keys, m[1])
		}
	}
	if err := scanner.Err(); err != nil {
		t.Fatalf("scan %s: %v", path, err)
	}
	return keys
}

// TestEnvKeysMatchEnvExample keeps Config.EnvKeys and backend/.env.example
// from drifting apart: every variable one declares, the other must too.
func TestEnvKeysMatchEnvExample(t *testing.T) {
	documented := parseEnvExampleKeys(t)

	want := append([]string(nil), EnvKeys...)
	sort.Strings(want)
	got := append([]string(nil), documented...)
	sort.Strings(got)

	if len(want) != len(got) {
		t.Fatalf("EnvKeys has %d entries, .env.example documents %d uncommented variables\nEnvKeys: %v\n.env.example: %v", len(want), len(got), want, got)
	}
	for i := range want {
		if want[i] != got[i] {
			t.Fatalf("EnvKeys and .env.example disagree at position %d: %q vs %q\nEnvKeys: %v\n.env.example: %v", i, want[i], got[i], want, got)
		}
	}
}
