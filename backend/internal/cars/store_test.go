package cars

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"at.draab/my-car/internal/db"
)

func testStore(t *testing.T) (*Store, *pgxpool.Pool) {
	t.Helper()
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
	t.Cleanup(pool.Close)
	// Serialize with other packages' database tests, one of which truncates
	// the domain tables while holding this lock.
	lock, err := pool.Acquire(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := lock.Exec(ctx, `SELECT pg_advisory_lock(7242026)`); err != nil {
		lock.Release()
		t.Fatal(err)
	}
	t.Cleanup(func() {
		lock.Exec(ctx, `SELECT pg_advisory_unlock(7242026)`)
		lock.Release()
	})
	return NewStore(pool), pool
}

func testAccount(t *testing.T, pool *pgxpool.Pool) string {
	t.Helper()
	ctx := context.Background()
	email := "cars-test-" + time.Now().Format("150405.000000000") + "@example.com"
	var id string
	if err := pool.QueryRow(ctx, `INSERT INTO accounts (email) VALUES ($1) RETURNING id`, email).Scan(&id); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		pool.Exec(ctx, `DELETE FROM cars WHERE account_id = $1`, id)
		pool.Exec(ctx, `DELETE FROM accounts WHERE id = $1`, id)
	})
	return id
}

func ptr(s string) *string { return &s }

func validInput(name string) Input {
	return Input{Type: "Hatchback", Make: "VW", Name: name, Fuel: "diesel", FirstRegistration: "2019-03-01", LicensePlate: "W-123AB", IsActive: true}
}

func TestStoreListPaginates(t *testing.T) {
	s, pool := testStore(t)
	ctx := context.Background()
	account := testAccount(t, pool)
	other := testAccount(t, pool)
	if _, err := s.Create(ctx, other, validInput("not mine")); err != nil {
		t.Fatal(err)
	}
	var created []Car
	for _, name := range []string{"one", "two", "three"} {
		c, err := s.Create(ctx, account, validInput(name))
		if err != nil {
			t.Fatal(err)
		}
		created = append(created, c)
	}

	page, next, err := s.List(ctx, account, nil, 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(page) != 2 || page[0].ID != created[0].ID || page[1].ID != created[1].ID || next == nil {
		t.Fatalf("first page = %v, next = %v", page, next)
	}

	decoded, ok := DecodeCursor(next.Encode())
	if !ok || !decoded.CreatedAt.Equal(next.CreatedAt) || decoded.ID != next.ID {
		t.Fatalf("cursor round trip = %v, %v", decoded, ok)
	}
	page, next, err = s.List(ctx, account, &decoded, 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(page) != 1 || page[0].ID != created[2].ID || next != nil {
		t.Fatalf("last page = %v, next = %v", page, next)
	}

	page, next, err = s.List(ctx, account, nil, 3)
	if err != nil || len(page) != 3 || next != nil {
		t.Fatalf("exact page = %v, %v, %v", page, next, err)
	}
}

func TestStoreCreateGetDelete(t *testing.T) {
	s, pool := testStore(t)
	ctx := context.Background()
	account := testAccount(t, pool)
	other := testAccount(t, pool)

	in := validInput("Golf")
	in.FIN, in.PurchaseDate, in.PurchasePrice = ptr("WVWZZZ1KZ"), ptr("2019-04-15"), ptr("18500.50")
	c, err := s.Create(ctx, account, in)
	if err != nil {
		t.Fatal(err)
	}
	if c.Name != "Golf" || c.Fuel != "diesel" || c.FirstRegistration != "2019-03-01" || *c.FIN != "WVWZZZ1KZ" ||
		*c.PurchaseDate != "2019-04-15" || *c.PurchasePrice != "18500.50" || !c.IsActive {
		t.Fatalf("created = %+v", c)
	}

	got, err := s.Get(ctx, account, c.ID)
	if err != nil || got.ID != c.ID || got.LicensePlate != "W-123AB" {
		t.Fatalf("get = %+v, %v", got, err)
	}
	if _, err := s.Get(ctx, other, c.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("get as other account err = %v", err)
	}
	if err := s.Delete(ctx, other, c.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("delete as other account err = %v", err)
	}

	var refuelID string
	if err := pool.QueryRow(ctx, `INSERT INTO refuels (car_id, date, station, fuel, liters, amount) VALUES ($1, now(), 'Station', 'normal', 40, 60) RETURNING id`, c.ID).Scan(&refuelID); err != nil {
		t.Fatal(err)
	}
	if err := s.Delete(ctx, account, c.ID); err != nil {
		t.Fatal(err)
	}
	if _, err := s.Get(ctx, account, c.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("get after delete err = %v", err)
	}
	var remaining int
	if err := pool.QueryRow(ctx, `SELECT count(*) FROM refuels WHERE id = $1`, refuelID).Scan(&remaining); err != nil || remaining != 0 {
		t.Fatalf("refuel after car delete = %d, %v", remaining, err)
	}
}

func TestStoreUpdateTriState(t *testing.T) {
	s, pool := testStore(t)
	ctx := context.Background()
	account := testAccount(t, pool)
	other := testAccount(t, pool)

	in := validInput("Golf")
	in.FIN, in.PurchaseDate, in.PurchasePrice = ptr("WVWZZZ1KZ"), ptr("2019-04-15"), ptr("18500.50")
	c, err := s.Create(ctx, account, in)
	if err != nil {
		t.Fatal(err)
	}

	inactive := false
	updated, err := s.Update(ctx, account, c.ID, Patch{
		Name:          ptr("Golf GTD"),
		IsActive:      &inactive,
		FIN:           Nullable{Set: true},
		PurchasePrice: Nullable{Set: true, Value: ptr("17999.99")},
	})
	if err != nil {
		t.Fatal(err)
	}
	if updated.Name != "Golf GTD" || updated.IsActive || updated.FIN != nil ||
		updated.PurchaseDate == nil || *updated.PurchaseDate != "2019-04-15" ||
		updated.PurchasePrice == nil || *updated.PurchasePrice != "17999.99" ||
		updated.Make != "VW" || updated.FirstRegistration != "2019-03-01" {
		t.Fatalf("updated = %+v", updated)
	}
	if !updated.UpdatedAt.After(c.UpdatedAt) {
		t.Fatalf("updated_at not advanced: %v -> %v", c.UpdatedAt, updated.UpdatedAt)
	}

	if _, err := s.Update(ctx, other, c.ID, Patch{Name: ptr("stolen")}); !errors.Is(err, ErrNotFound) {
		t.Fatalf("update as other account err = %v", err)
	}
}
