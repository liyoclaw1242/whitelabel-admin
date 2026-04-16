package memory

import (
	"context"
	"sync"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

type TenantRepo struct {
	mu   sync.RWMutex
	byID map[string]*repo.Tenant
}

// NewTenantRepo returns a tenant repo seeded with tenant-1 (matches the
// seed in user repo).
func NewTenantRepo() *TenantRepo {
	now := time.Now()
	r := &TenantRepo{byID: map[string]*repo.Tenant{
		"tenant-1": {ID: "tenant-1", Name: "Default Tenant", Slug: "default", CreatedAt: now, UpdatedAt: now},
	}}
	return r
}

func (r *TenantRepo) Current(ctx context.Context) (*repo.Tenant, error) {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	t, ok := r.byID[tid]
	if !ok {
		return nil, repo.ErrNotFound
	}
	return t, nil
}
