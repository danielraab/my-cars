package db

import (
	"context"
	"database/sql"
	"os"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// testDatabaseURL returns DATABASE_URL, skipping the test if it isn't set.
// CI provisions a Postgres service and sets it; a plain `go test ./...`
// without one skips rather than failing.
func testDatabaseURL(t *testing.T) string {
	t.Helper()
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set; skipping test that requires a live Postgres database")
	}
	return url
}

func TestNewPool_Ping(t *testing.T) {
	url := testDatabaseURL(t)
	ctx := context.Background()

	pool, err := NewPool(ctx, url)
	if err != nil {
		t.Fatalf("NewPool() error: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		t.Fatalf("pool.Ping() error: %v", err)
	}
}

func TestNewPool_Unreachable(t *testing.T) {
	ctx := context.Background()

	_, err := NewPool(ctx, "postgres://nobody:nobody@127.0.0.1:1/nonexistent?connect_timeout=1")
	if err == nil {
		t.Fatal("NewPool() with an unreachable database: expected error, got nil")
	}
}

func TestRunMigrations(t *testing.T) {
	url := testDatabaseURL(t)

	if err := RunMigrations(url); err != nil {
		t.Fatalf("RunMigrations() error: %v", err)
	}

	// Running again against an already up-to-date database must not fail.
	if err := RunMigrations(url); err != nil {
		t.Fatalf("RunMigrations() second call error: %v", err)
	}

	sqlDB, err := sql.Open("pgx", url)
	if err != nil {
		t.Fatalf("sql.Open() error: %v", err)
	}
	defer sqlDB.Close()

	var version int
	var dirty bool
	if err := sqlDB.QueryRow("SELECT version, dirty FROM schema_migrations").Scan(&version, &dirty); err != nil {
		t.Fatalf("query schema_migrations: %v", err)
	}
	if version != 1 {
		t.Errorf("schema_migrations.version = %d, want 1", version)
	}
	if dirty {
		t.Errorf("schema_migrations.dirty = true, want false")
	}
}
