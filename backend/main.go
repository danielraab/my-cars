package main

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"at.draab/my-car/internal/auth"
	"at.draab/my-car/internal/cars"
	"at.draab/my-car/internal/config"
	"at.draab/my-car/internal/db"
	"at.draab/my-car/internal/healthcheck"
	"at.draab/my-car/internal/httpserver"
	"at.draab/my-car/internal/profile"
	"at.draab/my-car/internal/refuels"
	"at.draab/my-car/internal/repairs"
	"at.draab/my-car/internal/seed"
)

//go:embed openapi.yaml
var openapiDoc []byte

//go:embed all:static/out
var staticFS embed.FS

func main() {
	if isHealthcheckCommand(os.Args) {
		runHealthcheck()
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "seed" {
		if err := runSeed(os.Args[2:]); err != nil {
			log.Fatalf("seed: %v", err)
		}
		return
	}
	runServer()
}

func seedEmails(args []string) ([]string, error) {
	if len(args) == 0 {
		return nil, fmt.Errorf("usage: backend seed <email> [email ...] (replaces all application data)")
	}
	var emails []string
	seen := make(map[string]bool)
	for _, arg := range args {
		email := strings.ToLower(strings.TrimSpace(arg))
		parsed, err := mail.ParseAddress(email)
		if err != nil || parsed.Address != email || parsed.Name != "" || strings.ContainsAny(email, " \t\n") {
			return nil, fmt.Errorf("invalid email address: %q", arg)
		}
		if !seen[email] {
			emails = append(emails, email)
			seen[email] = true
		}
	}
	return emails, nil
}

func runSeed(args []string) error {
	emails, err := seedEmails(args)
	if err != nil {
		return err
	}
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		return fmt.Errorf("DATABASE_URL is required")
	}
	if err := db.RunMigrations(databaseURL); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, databaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()
	if err := seed.Run(ctx, pool, emails, time.Now()); err != nil {
		return err
	}
	log.Printf("seeded %d accounts: 4 cars, 500 refuels, 75 repairs, 90 tickets each", len(emails))
	return nil
}

// isHealthcheckCommand reports whether args (as os.Args) select the
// healthcheck subcommand rather than the default server mode.
func isHealthcheckCommand(args []string) bool {
	return len(args) > 1 && args[1] == "healthcheck"
}

// runHealthcheck is the container HEALTHCHECK's entry point: probe our own
// /api/healthz and report success or failure via the process exit code,
// since the distroless runtime image has no curl.
func runHealthcheck() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("healthcheck: load config: %v", err)
	}

	if err := healthcheck.Probe(cfg.Port); err != nil {
		log.Printf("healthcheck: %v", err)
		os.Exit(1)
	}
}

func runServer() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}

	if err := db.RunMigrations(cfg.DatabaseURL); err != nil {
		log.Fatalf("run migrations: %v", err)
	}

	ctx := context.Background()
	pool, err := db.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("connect to database: %v", err)
	}
	defer pool.Close()

	staticOut, err := fs.Sub(staticFS, "static/out")
	if err != nil {
		log.Fatalf("prepare embedded static assets: %v", err)
	}

	store := auth.NewStore(pool)
	if err := store.Prune(ctx, time.Now()); err != nil {
		log.Printf("prune expired authentication state: %v", err)
	}
	go func() {
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for now := range ticker.C {
			if err := store.Prune(ctx, now); err != nil {
				log.Printf("prune expired authentication state: %v", err)
			}
		}
	}()
	var oidcClient auth.OIDCProvider
	if cfg.OIDCEnabled() {
		oidcClient, err = auth.NewOIDCClient(ctx, cfg.OIDCIssuerURL, cfg.OIDCClientID, cfg.OIDCClientSecret, cfg.AuthBaseURL+"/api/v1/auth/oidc/callback")
		if err != nil {
			log.Fatalf("configure OIDC: %v", err)
		}
	}
	mailer := auth.NewSMTPMailer(cfg.SMTPFrom, cfg.SMTPHost, cfg.SMTPPort, cfg.SMTPTLS, cfg.SMTPUser, cfg.SMTPPassword)
	authService := auth.NewService(store, mailer, oidcClient, cfg.AuthBaseURL)
	profileHandler := profile.NewHandler(profile.NewStore(pool))
	carsHandler := cars.NewHandler(cars.NewStore(pool))
	repairsHandler := repairs.NewHandler(repairs.NewStore(pool))
	refuelsHandler := refuels.NewHandler(refuels.NewStore(pool))
	mux := httpserver.NewMux(pool, openapiDoc, staticOut, authService.RegisterRoutes, func(mux *http.ServeMux) {
		profileHandler.RegisterRoutes(mux, authService.RequireSession)
		carsHandler.RegisterRoutes(mux, authService.RequireSession)
		repairsHandler.RegisterRoutes(mux, authService.RequireSession)
		refuelsHandler.RegisterRoutes(mux, authService.RequireSession)
	})

	log.Printf("listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
