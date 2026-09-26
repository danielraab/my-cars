package config

import (
	"fmt"
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

func TestLoad_OptionalOIDCConfiguration(t *testing.T) {
	setAllEnv(t)
	for _, key := range oidcEnvKeys {
		t.Setenv(key, "")
	}

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}
	if cfg.OIDCEnabled() {
		t.Fatal("OIDCEnabled() = true with all OIDC values absent")
	}
}

func TestLoad_CompleteOIDCConfigurationIsEnabled(t *testing.T) {
	setAllEnv(t)
	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() returned unexpected error: %v", err)
	}
	if !cfg.OIDCEnabled() {
		t.Fatal("OIDCEnabled() = false with complete OIDC configuration")
	}
}

func TestLoad_RejectsPartialOIDCConfiguration(t *testing.T) {
	for mask := 1; mask < 1<<len(oidcEnvKeys)-1; mask++ {
		t.Run(fmt.Sprintf("combination_%d", mask), func(t *testing.T) {
			setAllEnv(t)
			for index, key := range oidcEnvKeys {
				if mask&(1<<index) == 0 {
					t.Setenv(key, "")
				}
			}

			_, err := Load()
			if err == nil || !strings.Contains(err.Error(), "must be configured together") {
				t.Fatalf("Load() error = %v", err)
			}
		})
	}
}

func TestLoad_RejectsInvalidAuthenticationConfiguration(t *testing.T) {
	for key, value := range map[string]string{"AUTH_BASE_URL": "relative", "OIDC_ISSUER_URL": "javascript:bad", "SMTP_TLS": "sometimes"} {
		t.Run(key, func(t *testing.T) {
			setAllEnv(t)
			t.Setenv(key, value)
			_, err := Load()
			if err == nil || !strings.Contains(err.Error(), key) {
				t.Fatalf("Load() error=%v", err)
			}
		})
	}
}

func TestLoad_RejectsAuthBaseURLWithPath(t *testing.T) {
	setAllEnv(t)
	t.Setenv("AUTH_BASE_URL", "https://cars.example/subpath")
	_, err := Load()
	if err == nil || !strings.Contains(err.Error(), "AUTH_BASE_URL") {
		t.Fatalf("Load() error=%v", err)
	}
}
