package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"

	"at.draab/my-car/internal/config"
	"at.draab/my-car/internal/db"
	"at.draab/my-car/internal/healthcheck"
	"at.draab/my-car/internal/httpserver"
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
	runServer()
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

	mux := httpserver.NewMux(pool, openapiDoc, staticOut)

	log.Printf("listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("serve: %v", err)
	}
}
