package pgx

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

type ItemRepo struct{ pool *pgxpool.Pool }

func NewItemRepo(pool *pgxpool.Pool) *ItemRepo { return &ItemRepo{pool: pool} }

func (r *ItemRepo) List(ctx context.Context, page, limit int) ([]*repo.Item, int, error) {
	tid, err := tenantID(ctx)
	if err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var total int
	err = r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM items WHERE tenant_id = $1`, tid).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	rows, err := r.pool.Query(ctx,
		`SELECT id, tenant_id, title, description, created_at, updated_at
		 FROM items WHERE tenant_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`, tid, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []*repo.Item
	for rows.Next() {
		it := &repo.Item{}
		if err := rows.Scan(&it.ID, &it.TenantID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, it)
	}
	if items == nil {
		items = []*repo.Item{}
	}
	return items, total, rows.Err()
}

func (r *ItemRepo) Get(ctx context.Context, id string) (*repo.Item, error) {
	tid, err := tenantID(ctx)
	if err != nil {
		return nil, err
	}
	it := &repo.Item{}
	err = r.pool.QueryRow(ctx,
		`SELECT id, tenant_id, title, description, created_at, updated_at
		 FROM items WHERE id = $1 AND tenant_id = $2`, id, tid).
		Scan(&it.ID, &it.TenantID, &it.Name, &it.Description, &it.CreatedAt, &it.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, repo.ErrNotFound
	}
	return it, err
}

func (r *ItemRepo) Create(ctx context.Context, i *repo.Item) error {
	tid, err := tenantID(ctx)
	if err != nil {
		return err
	}
	return r.pool.QueryRow(ctx,
		`INSERT INTO items (tenant_id, title, description) VALUES ($1, $2, $3) RETURNING id, created_at, updated_at`,
		tid, i.Name, i.Description).Scan(&i.ID, &i.CreatedAt, &i.UpdatedAt)
}

func (r *ItemRepo) Update(ctx context.Context, i *repo.Item) error {
	tid, err := tenantID(ctx)
	if err != nil {
		return err
	}
	tag, err := r.pool.Exec(ctx,
		`UPDATE items SET title = $1, description = $2, updated_at = $3 WHERE id = $4 AND tenant_id = $5`,
		i.Name, i.Description, time.Now(), i.ID, tid)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}

func (r *ItemRepo) Delete(ctx context.Context, id string) error {
	tid, err := tenantID(ctx)
	if err != nil {
		return err
	}
	tag, err := r.pool.Exec(ctx, `DELETE FROM items WHERE id = $1 AND tenant_id = $2`, id, tid)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return repo.ErrNotFound
	}
	return nil
}
