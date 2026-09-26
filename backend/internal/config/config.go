// Package config loads the backend's runtime configuration from
// environment variables.
package config

import (
	"fmt"
	"net/url"
	"os"
	"strings"
)

// Config holds every environment variable the backend reads.
type Config struct {
	Port             string
	DatabaseURL      string
	SMTPFrom         string
	SMTPHost         string
	SMTPPort         string
	SMTPTLS          string
	SMTPUser         string
	SMTPPassword     string
	AuthBaseURL      string
	OIDCIssuerURL    string
	OIDCClientID     string
	OIDCClientSecret string
}

// EnvKeys lists every environment variable Load reads, in the order
// backend/.env.example documents them. config_test.go checks this list
// against .env.example's variable names so the two can't drift apart.
var EnvKeys = []string{
	"PORT",
	"DATABASE_URL",
	"SMTP_FROM",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_TLS",
	"SMTP_USER",
	"SMTP_PASSWORD",
	"AUTH_BASE_URL",
	"OIDC_ISSUER_URL",
	"OIDC_CLIENT_ID",
	"OIDC_CLIENT_SECRET",
}

var requiredEnvKeys = []string{
	"PORT",
	"DATABASE_URL",
	"SMTP_FROM",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_TLS",
	"AUTH_BASE_URL",
}

var oidcEnvKeys = []string{"OIDC_ISSUER_URL", "OIDC_CLIENT_ID", "OIDC_CLIENT_SECRET"}

// Load reads Config from the environment, returning an error naming every
// missing required variable.
func Load() (*Config, error) {
	values := make(map[string]string, len(EnvKeys))
	var missing []string
	for _, key := range requiredEnvKeys {
		v := os.Getenv(key)
		if v == "" {
			missing = append(missing, key)
		}
		values[key] = v
	}
	for _, key := range append([]string{"SMTP_USER", "SMTP_PASSWORD"}, oidcEnvKeys...) {
		values[key] = os.Getenv(key)
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variable(s): %s", strings.Join(missing, ", "))
	}
	configuredOIDCValues := 0
	for _, key := range oidcEnvKeys {
		if values[key] != "" {
			configuredOIDCValues++
		}
	}
	if configuredOIDCValues != 0 && configuredOIDCValues != len(oidcEnvKeys) {
		return nil, fmt.Errorf("OIDC_ISSUER_URL, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET must be configured together")
	}
	urlKeys := []string{"AUTH_BASE_URL"}
	if configuredOIDCValues == len(oidcEnvKeys) {
		urlKeys = append(urlKeys, "OIDC_ISSUER_URL")
	}
	for _, key := range urlKeys {
		u, err := url.Parse(values[key])
		if err != nil || u.Host == "" || (u.Scheme != "http" && u.Scheme != "https") {
			return nil, fmt.Errorf("%s must be an absolute HTTP(S) URL", key)
		}
	}
	baseURL, _ := url.Parse(values["AUTH_BASE_URL"])
	if (baseURL.Path != "" && baseURL.Path != "/") || baseURL.RawQuery != "" || baseURL.Fragment != "" {
		return nil, fmt.Errorf("AUTH_BASE_URL must contain only an origin")
	}
	if values["SMTP_TLS"] != "none" && values["SMTP_TLS"] != "starttls" && values["SMTP_TLS"] != "tls" {
		return nil, fmt.Errorf("SMTP_TLS must be one of none, starttls, tls")
	}

	return &Config{
		Port:             values["PORT"],
		DatabaseURL:      values["DATABASE_URL"],
		SMTPFrom:         values["SMTP_FROM"],
		SMTPHost:         values["SMTP_HOST"],
		SMTPPort:         values["SMTP_PORT"],
		SMTPTLS:          values["SMTP_TLS"],
		SMTPUser:         values["SMTP_USER"],
		SMTPPassword:     values["SMTP_PASSWORD"],
		AuthBaseURL:      values["AUTH_BASE_URL"],
		OIDCIssuerURL:    values["OIDC_ISSUER_URL"],
		OIDCClientID:     values["OIDC_CLIENT_ID"],
		OIDCClientSecret: values["OIDC_CLIENT_SECRET"],
	}, nil
}

// OIDCEnabled reports whether the complete optional OIDC configuration is set.
func (c *Config) OIDCEnabled() bool {
	return c.OIDCIssuerURL != "" && c.OIDCClientID != "" && c.OIDCClientSecret != ""
}
