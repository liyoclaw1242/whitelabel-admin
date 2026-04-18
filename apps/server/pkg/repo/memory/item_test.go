package memory

import (
	"context"
	"errors"
	"sync"
	"testing"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/middleware"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

func ctxT(tenant string) context.Context {
	return middleware.WithTenantID(context.Background(), tenant)
}

func TestItemRepo_MissingTenant(t *testing.T) {
	r := NewItemRepo()
	_, _, err := r.List(context.Background(), 1, 20)
	if !errors.Is(err, repo.ErrMissingTenant) {
		t.Errorf("List err = %v, want ErrMissingTenant", err)
	}
	err = r.Create(context.Background(), &repo.Item{ID: "x"})
	if !errors.Is(err, repo.ErrMissingTenant) {
		t.Errorf("Create err = %v, want ErrMissingTenant", err)
	}
}

func TestItemRepo_TenantIsolation(t *testing.T) {
	r := NewItemRepo()
	ctxA, ctxB := ctxT("tenant-a"), ctxT("tenant-b")

	for _, id := range []string{"a1", "a2"} {
		_ = r.Create(ctxA, &repo.Item{ID: id, Name: "A-" + id, CreatedAt: time.Now()})
	}
	for _, id := range []string{"b1", "b2"} {
		_ = r.Create(ctxB, &repo.Item{ID: id, Name: "B-" + id, CreatedAt: time.Now()})
	}

	gotA, totalA, _ := r.List(ctxA, 1, 20)
	gotB, totalB, _ := r.List(ctxB, 1, 20)
	if totalA != 2 || totalB != 2 {
		t.Errorf("totalA=%d totalB=%d", totalA, totalB)
	}
	for _, it := range gotA {
		if it.TenantID != "tenant-a" {
			t.Errorf("tenant-a list leaked %+v", it)
		}
	}
	for _, it := range gotB {
		if it.TenantID != "tenant-b" {
			t.Errorf("tenant-b list leaked %+v", it)
		}
	}

	// Cross-tenant Get must fail.
	if _, err := r.Get(ctxB, "a1"); !errors.Is(err, repo.ErrNotFound) {
		t.Errorf("expected tenant-b to NOT see tenant-a's a1, got err=%v", err)
	}

	// Cross-tenant Delete must fail.
	if err := r.Delete(ctxA, "b1"); !errors.Is(err, repo.ErrNotFound) {
		t.Errorf("expected tenant-a to NOT delete tenant-b's b1, got err=%v", err)
	}
	if totalB2 := countTenant(t, r, ctxB); totalB2 != 2 {
		t.Errorf("tenant-b items after cross-delete attempt = %d, want 2", totalB2)
	}
}

func countTenant(t *testing.T, r *ItemRepo, ctx context.Context) int {
	t.Helper()
	_, total, _ := r.List(ctx, 1, 100)
	return total
}

func TestItemRepo_UpdatePreservesTenant(t *testing.T) {
	r := NewItemRepo()
	ctxA := ctxT("tenant-a")
	_ = r.Create(ctxA, &repo.Item{ID: "x", Name: "old", CreatedAt: time.Now()})

	// Attacker-controlled update payload tries to change tenant.
	if err := r.Update(ctxA, &repo.Item{ID: "x", Name: "new", TenantID: "tenant-evil"}); err != nil {
		t.Fatal(err)
	}
	it, err := r.Get(ctxA, "x")
	if err != nil {
		t.Fatal(err)
	}
	if it.TenantID != "tenant-a" {
		t.Errorf("update allowed tenant change: %q", it.TenantID)
	}
	if it.Name != "new" {
		t.Errorf("name not updated: %q", it.Name)
	}
}

func TestItemRepo_PaginatePastEnd(t *testing.T) {
	r := NewItemRepo()
	ctx := ctxT("tenant-a")
	for i := 0; i < 3; i++ {
		_ = r.Create(ctx, &repo.Item{ID: string(rune('a' + i)), Name: "n", CreatedAt: time.Now()})
	}
	got, total, _ := r.List(ctx, 10, 20)
	if total != 3 {
		t.Errorf("total = %d", total)
	}
	if len(got) != 0 {
		t.Errorf("past-end page should be empty, got %d", len(got))
	}
}

func TestItemRepo_ConcurrentSafe(t *testing.T) {
	r := NewItemRepo()
	ctx := ctxT("tenant-a")
	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_ = r.Create(ctx, &repo.Item{ID: string(rune('a' + i%26)) + "-" + string(rune('0' + i/10)), CreatedAt: time.Now()})
			_, _, _ = r.List(ctx, 1, 10)
		}(i)
	}
	wg.Wait()
}
