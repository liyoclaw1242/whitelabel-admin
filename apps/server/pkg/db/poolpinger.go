package db

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PoolPinger wraps a pgxpool.Pool to satisfy the health.Pinger interface
// which expects PingContext (not Ping).
type PoolPinger struct{ Pool *pgxpool.Pool }

func (p *PoolPinger) PingContext(ctx context.Context) error {
	return p.Pool.Ping(ctx)
}
