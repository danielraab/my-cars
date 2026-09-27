package profile

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"

	"at.draab/my-car/internal/auth"
)

// Store persists profile changes in the accounts table.
type Store struct{ pool *pgxpool.Pool }

func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

// UpdateAccountNames overwrites each non-nil name (empty strings included)
// and returns the updated account.
func (s *Store) UpdateAccountNames(ctx context.Context, accountID string, firstName, lastName *string) (auth.Account, error) {
	var a auth.Account
	err := s.pool.QueryRow(ctx, `UPDATE accounts SET first_name=COALESCE($2,first_name), last_name=COALESCE($3,last_name), updated_at=now() WHERE id=$1 RETURNING id,email,first_name,last_name`, accountID, firstName, lastName).Scan(&a.ID, &a.Email, &a.FirstName, &a.LastName)
	return a, err
}
