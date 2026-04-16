// Package store provides user / tenant repositories.
//
// Phase 3 ships with an in-memory stub so the auth system can land before
// the Phase 4 pgx layer is ready. The interfaces are designed to be drop-in
// replaced by a real Postgres impl in Phase 6.
package store

import (
	"context"
	"errors"
	"strings"

	"golang.org/x/crypto/bcrypt"
)

var ErrUserNotFound = errors.New("user not found")

// User is the domain entity. IDs are ULIDs in production; simple strings here.
type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash []byte
	TenantID     string
	Roles        []string
	Permissions  []string
}

// UserRepo is the contract the auth handlers require. Phase 4 adds a pgx impl.
type UserRepo interface {
	FindByEmail(ctx context.Context, email string) (*User, error)
	FindByID(ctx context.Context, id string) (*User, error)
}

// Permissions for each seeded role. Centralised so middleware and tests agree.
var (
	PermsAdmin  = []string{"users:read", "users:write", "items:read", "items:write", "audit:read"}
	PermsEditor = []string{"items:read", "items:write", "users:read"}
	PermsViewer = []string{"items:read", "users:read"}
)

// MemoryUserRepo is a trivial map-backed repo with three seeded users.
type MemoryUserRepo struct{ byEmail map[string]*User }

// NewMemoryUserRepo returns a repo pre-loaded with admin/editor/viewer users,
// all with password "password" (bcrypt-hashed at cost=10 for dev).
func NewMemoryUserRepo() (*MemoryUserRepo, error) {
	pw, err := bcrypt.GenerateFromPassword([]byte("password"), 10)
	if err != nil {
		return nil, err
	}
	users := []*User{
		{
			ID: "user-admin", Email: "admin@test", Name: "Admin",
			PasswordHash: pw, TenantID: "tenant-1",
			Roles: []string{"admin"}, Permissions: PermsAdmin,
		},
		{
			ID: "user-editor", Email: "editor@test", Name: "Editor",
			PasswordHash: pw, TenantID: "tenant-1",
			Roles: []string{"editor"}, Permissions: PermsEditor,
		},
		{
			ID: "user-viewer", Email: "viewer@test", Name: "Viewer",
			PasswordHash: pw, TenantID: "tenant-1",
			Roles: []string{"viewer"}, Permissions: PermsViewer,
		},
	}

	m := &MemoryUserRepo{byEmail: make(map[string]*User, len(users))}
	for _, u := range users {
		m.byEmail[strings.ToLower(u.Email)] = u
	}
	return m, nil
}

func (m *MemoryUserRepo) FindByEmail(_ context.Context, email string) (*User, error) {
	u, ok := m.byEmail[strings.ToLower(email)]
	if !ok {
		return nil, ErrUserNotFound
	}
	return u, nil
}

func (m *MemoryUserRepo) FindByID(_ context.Context, id string) (*User, error) {
	for _, u := range m.byEmail {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, ErrUserNotFound
}
