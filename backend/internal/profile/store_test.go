package profile

import (
	"context"
	"os"
	"testing"
	"time"

	"at.draab/my-car/internal/db"
)

func TestStoreUpdateAccountNames(t *testing.T) {
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		t.Skip("DATABASE_URL not set; skipping Postgres integration test")
	}
	if err := db.RunMigrations(url); err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	pool, err := db.NewPool(ctx, url)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	email := "profile-test-" + time.Now().Format("150405.000000000") + "@example.com"
	var id string
	if err := pool.QueryRow(ctx, `INSERT INTO accounts (email,first_name,last_name) VALUES ($1,'Ada','Lovelace') RETURNING id`, email).Scan(&id); err != nil {
		t.Fatal(err)
	}
	defer pool.Exec(ctx, `DELETE FROM accounts WHERE id=$1`, id)
	s := NewStore(pool)

	first := "Grace"
	a, err := s.UpdateAccountNames(ctx, id, &first, nil)
	if err != nil {
		t.Fatal(err)
	}
	if a.ID != id || a.Email != email || a.FirstName != "Grace" || a.LastName != "Lovelace" {
		t.Fatalf("partial update = %+v", a)
	}

	empty := ""
	a, err = s.UpdateAccountNames(ctx, id, nil, &empty)
	if err != nil {
		t.Fatal(err)
	}
	if a.FirstName != "Grace" || a.LastName != "" {
		t.Fatalf("empty update = %+v", a)
	}
}
