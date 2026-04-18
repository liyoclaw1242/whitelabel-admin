package pgx

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

type TenantRepo struct{ pool *pgxpool.Pool }

func NewTenantRepo(pool *pgxpool.Pool) *TenantRepo { return &TenantRepo{pool: pool} }

func (r *TenantRepo) Current(ctx context.Context) (*repo.Tenant, error) {
	tid, err := tenantID(ctx)
	if err != nil {
		return nil, err
	}
	t := &repo.Tenant{}
	err = r.pool.QueryRow(ctx,
		`SELECT id, name, slug, created_at, updated_at FROM tenants WHERE id = $1`, tid).
		Scan(&t.ID, &t.Name, &t.Slug, &t.CreatedAt, &t.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, repo.ErrNotFound
	}
	return t, err
}
