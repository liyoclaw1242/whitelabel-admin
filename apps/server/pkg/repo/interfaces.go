package repo

import "context"

type UserRepo interface {
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
	Create(ctx context.Context, u *User) error
}

type ItemRepo interface {
	// List returns items scoped to the tenant_id on ctx. Pagination is
	// 1-indexed page + limit; returns (items, total, err).
	List(ctx context.Context, page, limit int) ([]*Item, int, error)
	Get(ctx context.Context, id string) (*Item, error)
	Create(ctx context.Context, i *Item) error
	Update(ctx context.Context, i *Item) error
	Delete(ctx context.Context, id string) error
}

type TenantRepo interface {
	Current(ctx context.Context) (*Tenant, error)
}

type AuditRepo interface {
	// Write persists an audit log entry. Failure MUST NOT block the
	// request: audit middleware logs the error and continues.
	Write(ctx context.Context, log *AuditLog) error
}
