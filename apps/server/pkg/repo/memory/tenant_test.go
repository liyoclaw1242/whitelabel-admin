package memory

import (
	"context"
	"errors"
	"testing"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

func TestTenantRepo_Current_Seeded(t *testing.T) {
	r := NewTenantRepo()
	tn, err := r.Current(ctxT("tenant-1"))
	if err != nil {
		t.Fatal(err)
	}
	if tn.ID != "tenant-1" {
		t.Errorf("id = %q", tn.ID)
	}
}

func TestTenantRepo_MissingTenant(t *testing.T) {
	r := NewTenantRepo()
	_, err := r.Current(context.Background())
	if !errors.Is(err, repo.ErrMissingTenant) {
		t.Errorf("err = %v", err)
	}
}

func TestTenantRepo_UnknownTenant(t *testing.T) {
	r := NewTenantRepo()
	_, err := r.Current(ctxT("tenant-ghost"))
	if !errors.Is(err, repo.ErrNotFound) {
		t.Errorf("err = %v", err)
	}
}
