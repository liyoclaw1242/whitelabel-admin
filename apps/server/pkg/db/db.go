// Package db opens a Postgres connection (Neon-compatible) via pgx stdlib.
package db

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

// Open returns an *sql.DB using the pgx driver. DSN is a Postgres URL
// (Neon-compatible), e.g. `postgres://user:pw@host/db?sslmode=require`.
func Open(dsn string) (*sql.DB, error) {
	d, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("sql.Open pgx: %w", err)
	}
	d.SetMaxOpenConns(10)
	d.SetMaxIdleConns(5)
	d.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := d.PingContext(ctx); err != nil {
		_ = d.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}
	return d, nil
}
