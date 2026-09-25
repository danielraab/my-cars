package auth

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrInvalidCredential = errors.New("invalid or expired credential")

type Account struct{ ID, Email, FirstName, LastName string }
type Session struct {
	Account
	ExpiresAt time.Time
}

type Store struct{ pool *pgxpool.Pool }

func NewStore(pool *pgxpool.Pool) *Store { return &Store{pool: pool} }

func normalizeEmail(email string) string { return strings.ToLower(strings.TrimSpace(email)) }

func (s *Store) CreateMagicLink(ctx context.Context, digest []byte, email string, expires time.Time) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO magic_link_challenges (token_digest,email,expires_at) VALUES ($1,$2,$3)`, digest, normalizeEmail(email), expires)
	return err
}

func (s *Store) ConsumeMagicLink(ctx context.Context, digest []byte, now time.Time) (Account, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return Account{}, err
	}
	defer tx.Rollback(ctx)
	var email string
	err = tx.QueryRow(ctx, `UPDATE magic_link_challenges SET consumed_at=$2 WHERE token_digest=$1 AND consumed_at IS NULL AND expires_at>$2 RETURNING email`, digest, now).Scan(&email)
	if errors.Is(err, pgx.ErrNoRows) {
		return Account{}, ErrInvalidCredential
	}
	if err != nil {
		return Account{}, err
	}
	var a Account
	err = tx.QueryRow(ctx, `INSERT INTO accounts (email) VALUES ($1) ON CONFLICT (email) DO UPDATE SET email=EXCLUDED.email RETURNING id,email,first_name,last_name`, email).Scan(&a.ID, &a.Email, &a.FirstName, &a.LastName)
	if err != nil {
		return Account{}, err
	}
	return a, tx.Commit(ctx)
}

func (s *Store) CreateSession(ctx context.Context, digest []byte, accountID string, expires time.Time) error {
	_, err := s.pool.Exec(ctx, `INSERT INTO sessions (token_digest,account_id,expires_at) VALUES ($1,$2,$3)`, digest, accountID, expires)
	return err
}
func (s *Store) Session(ctx context.Context, digest []byte, now time.Time) (Session, error) {
	var out Session
	err := s.pool.QueryRow(ctx, `SELECT a.id,a.email,a.first_name,a.last_name,s.expires_at FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_digest=$1 AND s.revoked_at IS NULL AND s.expires_at>$2`, digest, now).Scan(&out.ID, &out.Email, &out.FirstName, &out.LastName, &out.ExpiresAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return Session{}, ErrInvalidCredential
	}
	return out, err
}
func (s *Store) RevokeSession(ctx context.Context, digest []byte, now time.Time) error {
	_, err := s.pool.Exec(ctx, `UPDATE sessions SET revoked_at=$2 WHERE token_digest=$1 AND revoked_at IS NULL`, digest, now)
	return err
}

func (s *Store) Prune(ctx context.Context, now time.Time) error {
	for _, q := range []string{`DELETE FROM oidc_login_attempts WHERE expires_at <= $1`, `DELETE FROM magic_link_challenges WHERE expires_at <= $1`, `DELETE FROM sessions WHERE expires_at <= $1 OR revoked_at IS NOT NULL`} {
		if _, err := s.pool.Exec(ctx, q, now); err != nil {
			return err
		}
	}
	return nil
}
