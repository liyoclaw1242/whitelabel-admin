// Package repo defines the canonical Phase 3 data-layer interfaces.
//
// Phase 3 ships with in-memory stubs under `repo/memory`. Phase 4 adds
// pgx implementations against Neon that satisfy the same interfaces.
package repo

import (
	"errors"
	"time"
)

// ErrMissingTenant is returned by repo operations when the request
// context does not carry a tenant id. Middleware MUST have populated
// tenant scoping via `middleware.Tenant` before calling repo methods.
// Treat this as a 500-level internal error in handlers — a missing
// tenant on an authenticated request is a middleware bug, not a user
// problem.
var ErrMissingTenant = errors.New("missing tenant id on context")

// ErrNotFound is the canonical not-found sentinel across all repos.
var ErrNotFound = errors.New("record not found")

// User is the canonical user entity. Note the Create method on UserRepo
// takes this type; Phase 4 pgx impl will hash the password before
// persisting (bcrypt at env BCRYPT_COST).
type User struct {
	ID           string
	Email        string
	Name         string
	PasswordHash []byte
	TenantID     string
	Roles        []string
	Permissions  []string
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Item is a placeholder domain entity used to exercise the tenant-scoped
// CRUD path. Real product entities (workspaces, projects, ...) follow the
// same interface shape.
type Item struct {
	ID          string
	TenantID    string
	Name        string
	Description string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// Tenant is an isolation boundary. In Phase 3 we have one seeded tenant
// ("tenant-1"); multi-tenant admin endpoints come in a later phase.
type Tenant struct {
	ID        string
	Name      string
	Slug      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// AuditLog captures a single audited action. Written on every mutating
// request by `middleware.Audit`. Read endpoints may emit ad-hoc audits
// via `AuditRepo.Write` directly.
type AuditLog struct {
	ID         string
	TenantID   string
	UserID     string
	Action     string // e.g. "item.create", "user.update"
	Resource   string // derived from route pattern, e.g. "items"
	StatusCode int
	IP         string
	UserAgent  string
	TraceID    string
	Metadata   map[string]any
	CreatedAt  time.Time
}
