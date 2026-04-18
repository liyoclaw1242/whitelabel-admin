// Package blacklist tracks revoked refresh-token JTIs.
//
// Phase 3 uses an in-memory sync.Map stub so we can ship without the
// Cloudflare KV namespace. TODO(#N_KV): swap to Cloudflare KV when #138
// provisioning lands.
package blacklist

import (
	"context"
	"sync"
	"time"
)

// Store is the minimal interface over the JTI blacklist.
type Store interface {
	// Add records jti as revoked until expiresAt. Safe to call repeatedly.
	Add(ctx context.Context, jti string, expiresAt time.Time) error
	// Contains returns true if jti has been revoked and the revocation
	// hasn't expired.
	Contains(ctx context.Context, jti string) (bool, error)
}

// Memory is a process-local Store backed by sync.Map. Good for Phase 3
// stubs; NOT safe across serverless invocations.
type Memory struct{ m sync.Map }

// NewMemory returns an empty in-memory Store.
func NewMemory() *Memory { return &Memory{} }

func (m *Memory) Add(_ context.Context, jti string, expiresAt time.Time) error {
	m.m.Store(jti, expiresAt)
	return nil
}

func (m *Memory) Contains(_ context.Context, jti string) (bool, error) {
	v, ok := m.m.Load(jti)
	if !ok {
		return false, nil
	}
	exp, _ := v.(time.Time)
	if time.Now().After(exp) {
		m.m.Delete(jti)
		return false, nil
	}
	return true, nil
}
