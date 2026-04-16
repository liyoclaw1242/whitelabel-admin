package memory

import (
	"context"
	"sort"
	"sync"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/middleware"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

// ItemRepo is an in-memory repo.ItemRepo with per-tenant isolation.
type ItemRepo struct {
	mu   sync.RWMutex
	byID map[string]*repo.Item
}

func NewItemRepo() *ItemRepo {
	return &ItemRepo{byID: make(map[string]*repo.Item)}
}

func tenantFrom(ctx context.Context) (string, error) {
	id, ok := middleware.TenantIDFromContext(ctx)
	if !ok {
		return "", repo.ErrMissingTenant
	}
	return id, nil
}

func (r *ItemRepo) List(ctx context.Context, page, limit int) ([]*repo.Item, int, error) {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}

	r.mu.RLock()
	defer r.mu.RUnlock()

	matched := make([]*repo.Item, 0, len(r.byID))
	for _, it := range r.byID {
		if it.TenantID == tid {
			matched = append(matched, it)
		}
	}
	sort.Slice(matched, func(i, j int) bool { return matched[i].CreatedAt.After(matched[j].CreatedAt) })

	total := len(matched)
	start := (page - 1) * limit
	if start >= total {
		return []*repo.Item{}, total, nil
	}
	end := start + limit
	if end > total {
		end = total
	}
	return matched[start:end], total, nil
}

func (r *ItemRepo) Get(ctx context.Context, id string) (*repo.Item, error) {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return nil, err
	}
	r.mu.RLock()
	defer r.mu.RUnlock()
	it, ok := r.byID[id]
	if !ok || it.TenantID != tid {
		return nil, repo.ErrNotFound
	}
	return it, nil
}

func (r *ItemRepo) Create(ctx context.Context, i *repo.Item) error {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return err
	}
	i.TenantID = tid
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byID[i.ID] = i
	return nil
}

func (r *ItemRepo) Update(ctx context.Context, i *repo.Item) error {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.byID[i.ID]
	if !ok || existing.TenantID != tid {
		return repo.ErrNotFound
	}
	// Preserve tenant; the caller can't change it.
	i.TenantID = tid
	r.byID[i.ID] = i
	return nil
}

func (r *ItemRepo) Delete(ctx context.Context, id string) error {
	tid, err := tenantFrom(ctx)
	if err != nil {
		return err
	}
	r.mu.Lock()
	defer r.mu.Unlock()
	existing, ok := r.byID[id]
	if !ok || existing.TenantID != tid {
		return repo.ErrNotFound
	}
	delete(r.byID, id)
	return nil
}
