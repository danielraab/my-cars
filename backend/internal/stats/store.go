package stats

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Expense is one refuel, repair or ticket reduced to what the dashboard
// charts. The amount is a decimal string exactly as it appears on the wire.
type Expense struct {
	Date   time.Time
	Kind   string
	Amount string
}

// Filter bounds a query to [From, To); a nil CarID does not filter by car.
type Filter struct {
	CarID    *string
	From, To time.Time
}

type Store struct{ pool *pgxpool.Pool }

func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// Expenses returns the account's expenses within the filter, ordered by
// date, then kind, then ID. Expenses have no account column of their own, so
// each table is restricted to the account in $1's cars.
func (s *Store) Expenses(ctx context.Context, accountID string, f Filter) ([]Expense, error) {
	rows, err := s.pool.Query(ctx, `SELECT date, kind, amount FROM (
  SELECT id, car_id, date, 'refuel' AS kind, amount::text AS amount FROM refuels
  UNION ALL
  SELECT id, car_id, date, 'repair', amount::text FROM repairs
  UNION ALL
  SELECT id, car_id, date, 'ticket', amount::text FROM tickets
) AS expenses
WHERE car_id IN (SELECT id FROM cars WHERE account_id = $1)
  AND ($2::uuid IS NULL OR car_id = $2::uuid)
  AND date >= $3::timestamptz
  AND date < $4::timestamptz
ORDER BY date, kind, id`, accountID, f.CarID, f.From, f.To)
	if err != nil {
		return nil, err
	}
	return pgx.CollectRows(rows, func(row pgx.CollectableRow) (Expense, error) {
		var e Expense
		err := row.Scan(&e.Date, &e.Kind, &e.Amount)
		return e, err
	})
}
