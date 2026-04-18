// Package pgx implements the repo.* interfaces against Neon Postgres via
// pgxpool.
package pgx

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/middleware"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

type UserRepo struct{ pool *pgxpool.Pool }

func NewUserRepo(pool *pgxpool.Pool) *UserRepo { return &UserRepo{pool: pool} }

func (r *UserRepo) FindByEmail(ctx context.Context, email string) (*repo.User, error) {
	tid, err := tenantID(ctx)
	if err != nil {
		return nil, err
	}
	row := r.pool.QueryRow(ctx,
		`SELECT u.id, u.tenant_id, u.email, u.name, u.password_hash, u.created_at, u.updated_at,
		        array_agg(DISTINCT rl.name) FILTER (WHERE rl.name IS NOT NULL) AS roles,
		        array_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL) AS permissions
		 FROM users u
		 LEFT JOIN user_roles ur ON ur.user_id = u.id
		 LEFT JOIN roles rl ON rl.id = ur.role_id
		 LEFT JOIN role_permissions rp ON rp.role_id = rl.id
		 LEFT JOIN permissions p ON p.id = rp.permission_id
		 WHERE u.tenant_id = $1 AND u.email = $2
		 GROUP BY u.id`, tid, email)
	return scanUser(row)
}

func (r *UserRepo) FindByID(ctx context.Context, id string) (*repo.User, error) {
	tid, err := tenantID(ctx)
	if err != nil {
		return nil, err
	}
	row := r.pool.QueryRow(ctx,
		`SELECT u.id, u.tenant_id, u.email, u.name, u.password_hash, u.created_at, u.updated_at,
		        array_agg(DISTINCT rl.name) FILTER (WHERE rl.name IS NOT NULL) AS roles,
		        array_agg(DISTINCT p.key) FILTER (WHERE p.key IS NOT NULL) AS permissions
		 FROM users u
		 LEFT JOIN user_roles ur ON ur.user_id = u.id
		 LEFT JOIN roles rl ON rl.id = ur.role_id
		 LEFT JOIN role_permissions rp ON rp.role_id = rl.id
		 LEFT JOIN permissions p ON p.id = rp.permission_id
		 WHERE u.id = $1 AND u.tenant_id = $2
		 GROUP BY u.id`, id, tid)
	return scanUser(row)
}

func (r *UserRepo) Create(ctx context.Context, u *repo.User) error {
	tid, err := tenantID(ctx)
	if err != nil {
		return err
	}
	_, err = r.pool.Exec(ctx,
		`INSERT INTO users (tenant_id, email, name, password_hash) VALUES ($1, $2, $3, $4)`,
		tid, u.Email, u.Name, string(u.PasswordHash))
	return err
}

func scanUser(row pgx.Row) (*repo.User, error) {
	var u repo.User
	var hash string
	err := row.Scan(&u.ID, &u.TenantID, &u.Email, &u.Name, &hash, &u.CreatedAt, &u.UpdatedAt, &u.Roles, &u.Permissions)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, repo.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	u.PasswordHash = []byte(hash)
	if u.Roles == nil {
		u.Roles = []string{}
	}
	if u.Permissions == nil {
		u.Permissions = []string{}
	}
	return &u, nil
}

func tenantID(ctx context.Context) (string, error) {
	tid, ok := middleware.TenantIDFromContext(ctx)
	if !ok {
		return "", repo.ErrMissingTenant
	}
	return tid, nil
}
