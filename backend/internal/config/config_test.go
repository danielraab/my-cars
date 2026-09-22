package config

import (
	"strings"
	"testing"
)

func setAllEnv(t *testing.T) {
	t.Helper()
	values := map[string]string{
		"PORT":          "8080",
		"DATABASE_URL":  "postgres://mycars:mycars@localhost:5432/mycars?sslmode=disable",
		"SMTP_FROM":     "admin@example.com",
		"SMTP_HOST":     "localhost",
		"SMTP_PORT":     "1025",
		"SMTP_TLS":      "none",
		"AUTH_BASE_URL": "http://localhost:8080",
	}
	for key, value := range values {
		t.Setenv(key, value)
	}
}

func TestLoad_AllPresent(t *testing.T) {
	setAllEnv(t)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}

	want := &Config{
		Port:        "8080",
		DatabaseURL: "postgres://mycars:mycars@localhost:5432/mycars?sslmode=disable",
		SMTPFrom:    "admin@example.com",
		SMTPHost:    "localhost",
		SMTPPort:    "1025",
		SMTPTLS:     "none",
		AuthBaseURL: "http://localhost:8080",
	}
	if *cfg != *want {
		t.Fatalf("Load() = %+v, want %+v", *cfg, *want)
	}
}

func TestLoad_MissingVariable(t *testing.T) {
	for _, missingKey := range EnvKeys {
		t.Run(missingKey, func(t *testing.T) {
			setAllEnv(t)
			t.Setenv(missingKey, "")

			_, err := Load()
			if err == nil {
				t.Fatalf("Load() with %s unset: expected error, got nil", missingKey)
			}
			if !strings.Contains(err.Error(), missingKey) {
				t.Fatalf("Load() error %q does not mention missing key %s", err.Error(), missingKey)
			}
		})
	}
}
