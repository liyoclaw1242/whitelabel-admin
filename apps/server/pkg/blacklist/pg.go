package blacklist

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Postgres is a Store backed by the refresh_blacklist table. Unlike
// Memory, it survives serverless cold-starts and is shared across
// every invocation in the cluster.
type Postgres struct{ pool *pgxpool.Pool }

// NewPostgres returns a Store backed by the given pgxpool. The caller
// is responsible for running migration 000010 so the refresh_blacklist
// table exists.
func NewPostgres(pool *pgxpool.Pool) *Postgres { return &Postgres{pool: pool} }

// Add records jti as revoked until expiresAt. Idempotent via
// ON CONFLICT DO NOTHING — re-posting the same JTI is a no-op.
func (p *Postgres) Add(ctx context.Context, jti string, expiresAt time.Time) error {
	_, err := p.pool.Exec(ctx,
		`INSERT INTO refresh_blacklist (jti, exp) VALUES ($1, $2)
		 ON CONFLICT (jti) DO NOTHING`,
		jti, expiresAt)
	if err != nil {
		return fmt.Errorf("blacklist.Add: %w", err)
	}
	return nil
}

// Contains returns true if jti is present and has not yet expired.
// Expired rows are kept in the table (cleanup is out of band) but are
// filtered out here so the effective membership equals the active set.
func (p *Postgres) Contains(ctx context.Context, jti string) (bool, error) {
	var found bool
	err := p.pool.QueryRow(ctx,
		`SELECT EXISTS (
		   SELECT 1 FROM refresh_blacklist
		   WHERE jti = $1 AND exp > now()
		 )`, jti).Scan(&found)
	if err != nil {
		return false, fmt.Errorf("blacklist.Contains: %w", err)
	}
	return found, nil
}
