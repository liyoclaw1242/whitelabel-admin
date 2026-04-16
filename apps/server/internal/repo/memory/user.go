// Package memory implements the repo.* interfaces against in-memory maps.
// All impls are thread-safe via sync.RWMutex and meant for Phase 3 stubs
// only — Phase 4 replaces them with pgx against Neon.
package memory

import (
	"context"
	"strings"
	"sync"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

// UserRepo is an in-memory repo.UserRepo.
type UserRepo struct {
	mu      sync.RWMutex
	byEmail map[string]*repo.User
	byID    map[string]*repo.User
}

// NewUserRepo returns a repo pre-seeded with admin/editor/viewer (all
// password "password") under tenant-1. Matches the legacy store.MemoryUserRepo
// seeds so authapi tests keep working.
func NewUserRepo() (*UserRepo, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte("password"), 10)
	if err != nil {
		return nil, err
	}
	permsAdmin := []string{"users:read", "users:write", "items:read", "items:write", "audit:read"}
	permsEditor := []string{"items:read", "items:write", "users:read"}
	permsViewer := []string{"items:read", "users:read"}
	now := time.Now()

	seeds := []*repo.User{
		{ID: "user-admin", Email: "admin@test", Name: "Admin", PasswordHash: hash, TenantID: "tenant-1", Roles: []string{"admin"}, Permissions: permsAdmin, CreatedAt: now, UpdatedAt: now},
		{ID: "user-editor", Email: "editor@test", Name: "Editor", PasswordHash: hash, TenantID: "tenant-1", Roles: []string{"editor"}, Permissions: permsEditor, CreatedAt: now, UpdatedAt: now},
		{ID: "user-viewer", Email: "viewer@test", Name: "Viewer", PasswordHash: hash, TenantID: "tenant-1", Roles: []string{"viewer"}, Permissions: permsViewer, CreatedAt: now, UpdatedAt: now},
	}
	r := &UserRepo{
		byEmail: make(map[string]*repo.User, len(seeds)),
		byID:    make(map[string]*repo.User, len(seeds)),
	}
	for _, u := range seeds {
		r.byEmail[strings.ToLower(u.Email)] = u
		r.byID[u.ID] = u
	}
	return r, nil
}

func (r *UserRepo) FindByEmail(_ context.Context, email string) (*repo.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byEmail[strings.ToLower(email)]
	if !ok {
		return nil, repo.ErrNotFound
	}
	return u, nil
}

func (r *UserRepo) FindByID(_ context.Context, id string) (*repo.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	u, ok := r.byID[id]
	if !ok {
		return nil, repo.ErrNotFound
	}
	return u, nil
}

func (r *UserRepo) Create(_ context.Context, u *repo.User) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.byEmail[strings.ToLower(u.Email)] = u
	r.byID[u.ID] = u
	return nil
}
