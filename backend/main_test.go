package main

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSeedEmails(t *testing.T) {
	for _, args := range [][]string{nil, {"bad"}, {"ok@example.com", "Bad <bad@example.com>"}, {"ok@example.com", "no@"}} {
		if _, err := seedEmails(args); err == nil {
			t.Errorf("seedEmails(%v) accepted invalid input", args)
		}
	}
	got, err := seedEmails([]string{" TEST@Example.com ", "test@example.com", "other@example.org"})
	if err != nil || len(got) != 2 || got[0] != "test@example.com" || got[1] != "other@example.org" {
		t.Fatalf("seedEmails normalized: %v, %v", got, err)
	}
}

func TestIsHealthcheckCommand(t *testing.T) {
	tests := []struct {
		name string
		args []string
		want bool
	}{
		{"no arguments", []string{"server"}, false},
		{"healthcheck subcommand", []string{"server", "healthcheck"}, true},
		{"other argument", []string{"server", "serve"}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isHealthcheckCommand(tt.args); got != tt.want {
				t.Errorf("isHealthcheckCommand(%v) = %v, want %v", tt.args, got, tt.want)
			}
		})
	}
}

func TestImportLegacyArgs(t *testing.T) {
	for _, args := range [][]string{nil, {"--dry-run"}, {"a.sql", "b.sql"}, {"a.sql", "--force"}} {
		if _, _, err := importLegacyArgs(args); err == nil {
			t.Errorf("importLegacyArgs(%v) accepted invalid input", args)
		}
	}
	path, dryRun, err := importLegacyArgs([]string{"--dry-run", "dump.sql"})
	if err != nil || path != "dump.sql" || !dryRun {
		t.Fatalf("importLegacyArgs = %q, %v, %v", path, dryRun, err)
	}
	if _, dryRun, _ := importLegacyArgs([]string{"dump.sql"}); dryRun {
		t.Fatal("dry run without the flag")
	}
}

func TestImportLegacyDryRun(t *testing.T) {
	fixture := filepath.Join("internal", "legacyimport", "testdata", "dump.sql")
	var stdout, stderr bytes.Buffer
	if code := runImportLegacy([]string{fixture, "--dry-run"}, &stdout, &stderr); code != 0 || stdout.String() != "no problems found\n" {
		t.Fatalf("clean dump: code %d, stdout %q, stderr %q", code, stdout.String(), stderr.String())
	}

	raw, err := os.ReadFile(fixture)
	if err != nil {
		t.Fatal(err)
	}
	broken := strings.Replace(strings.Replace(string(raw), "'Special'", "'Premium'", 1), "'Velocity'", "'Toll'", 1)
	path := filepath.Join(t.TempDir(), "dump.sql")
	if err := os.WriteFile(path, []byte(broken), 0o600); err != nil {
		t.Fatal(err)
	}
	stdout.Reset()
	code := runImportLegacy([]string{path, "--dry-run"}, &stdout, &stderr)
	want := "Refuels id=2 fuel=\"Premium\": unknown category\nTickets id=1 type=\"Toll\": unknown category\n"
	if code != 1 || stdout.String() != want {
		t.Fatalf("broken dump: code %d, stdout %q", code, stdout.String())
	}

	stdout.Reset()
	if code := runImportLegacy([]string{filepath.Join(t.TempDir(), "missing.sql"), "--dry-run"}, &stdout, &stderr); code != 1 || !strings.HasPrefix(stdout.String(), "dump: ") {
		t.Fatalf("missing file: code %d, stdout %q", code, stdout.String())
	}
}
