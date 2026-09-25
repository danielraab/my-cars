package config

import (
	"strings"
	"testing"
)

func setAllEnv(t *testing.T) {
	t.Helper()
	values := map[string]string{
		"PORT":               "8080",
		"DATABASE_URL":       "postgres://mycars:mycars@localhost:5432/mycars?sslmode=disable",
		"SMTP_FROM":          "admin@example.com",
		"SMTP_HOST":          "localhost",
		"SMTP_PORT":          "1025",
		"SMTP_TLS":           "none",
		"SMTP_USER":          "",
		"SMTP_PASSWORD":      "",
		"AUTH_BASE_URL":      "http://localhost:8080",
		"OIDC_ISSUER_URL":    "https://id.example.com",
		"OIDC_CLIENT_ID":     "my-car",
		"OIDC_CLIENT_SECRET": "secret",
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
		Port:             "8080",
		DatabaseURL:      "postgres://mycars:mycars@localhost:5432/mycars?sslmode=disable",
		SMTPFrom:         "admin@example.com",
		SMTPHost:         "localhost",
		SMTPPort:         "1025",
		SMTPTLS:          "none",
		SMTPUser:         "",
		SMTPPassword:     "",
		AuthBaseURL:      "http://localhost:8080",
		OIDCIssuerURL:    "https://id.example.com",
		OIDCClientID:     "my-car",
		OIDCClientSecret: "secret",
	}
	if *cfg != *want {
		t.Fatalf("Load() = %+v, want %+v", *cfg, *want)
	}
}

func TestLoad_MissingVariable(t *testing.T) {
	for _, missingKey := range requiredEnvKeys {
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

func TestLoad_OptionalSMTPAuthentication(t *testing.T) {
	setAllEnv(t)
	t.Setenv("SMTP_USER", "mailer")
	t.Setenv("SMTP_PASSWORD", "secret")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}
	if cfg.SMTPUser != "mailer" || cfg.SMTPPassword != "secret" {
		t.Fatalf("Load() SMTP credentials = %q, %q; want configured values", cfg.SMTPUser, cfg.SMTPPassword)
	}
}
