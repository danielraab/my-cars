// Package config loads the backend's runtime configuration from
// environment variables.
package config

import (
	"fmt"
	"os"
	"strings"
)

// Config holds every environment variable the backend reads.
type Config struct {
	Port         string
	DatabaseURL  string
	SMTPFrom     string
	SMTPHost     string
	SMTPPort     string
	SMTPTLS      string
	SMTPUser     string
	SMTPPassword string
	AuthBaseURL  string
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
	values["SMTP_USER"] = os.Getenv("SMTP_USER")
	values["SMTP_PASSWORD"] = os.Getenv("SMTP_PASSWORD")
	if len(missing) > 0 {
		return nil, fmt.Errorf("missing required environment variable(s): %s", strings.Join(missing, ", "))
	}

	return &Config{
		Port:         values["PORT"],
		DatabaseURL:  values["DATABASE_URL"],
		SMTPFrom:     values["SMTP_FROM"],
		SMTPHost:     values["SMTP_HOST"],
		SMTPPort:     values["SMTP_PORT"],
		SMTPTLS:      values["SMTP_TLS"],
		SMTPUser:     values["SMTP_USER"],
		SMTPPassword: values["SMTP_PASSWORD"],
		AuthBaseURL:  values["AUTH_BASE_URL"],
	}, nil
}
