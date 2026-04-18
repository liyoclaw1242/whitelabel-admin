package memory

import (
	"context"
	"sync"
	"testing"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

func TestAuditRepo_WriteThenRead(t *testing.T) {
	r := NewAuditRepo()
	l := &repo.AuditLog{
		ID: "a1", TenantID: "tenant-1", UserID: "user-admin",
		Action: "item.create", Resource: "items",
		StatusCode: 201, IP: "1.1.1.1", UserAgent: "test",
		TraceID: "abc", CreatedAt: time.Now(),
	}
	if err := r.Write(context.Background(), l); err != nil {
		t.Fatal(err)
	}
	all := r.All()
	if len(all) != 1 || all[0].ID != "a1" {
		t.Errorf("all = %+v", all)
	}
}

func TestAuditRepo_ConcurrentWrite(t *testing.T) {
	r := NewAuditRepo()
	var wg sync.WaitGroup
	for i := 0; i < 100; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			_ = r.Write(context.Background(), &repo.AuditLog{ID: string(rune(i)), Action: "x"})
		}(i)
	}
	wg.Wait()
	if got := len(r.All()); got != 100 {
		t.Errorf("len = %d, want 100", got)
	}
}
