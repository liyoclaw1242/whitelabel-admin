package memory

import (
	"context"
	"log/slog"
	"sync"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

// AuditRepo is an in-memory repo.AuditRepo. It also emits each entry as
// a structured slog.Info so traces and logs land in Grafana Loki via the
// same pipeline that captures the rest of the server logs.
type AuditRepo struct {
	mu   sync.RWMutex
	logs []*repo.AuditLog
}

func NewAuditRepo() *AuditRepo { return &AuditRepo{} }

func (r *AuditRepo) Write(_ context.Context, l *repo.AuditLog) error {
	r.mu.Lock()
	r.logs = append(r.logs, l)
	r.mu.Unlock()

	slog.Info("audit",
		"action", l.Action,
		"resource", l.Resource,
		"user_id", l.UserID,
		"tenant_id", l.TenantID,
		"status_code", l.StatusCode,
		"ip", l.IP,
		"user_agent", l.UserAgent,
		"trace_id", l.TraceID,
	)
	return nil
}

// All returns a snapshot of the log slice for tests. Not on the interface.
func (r *AuditRepo) All() []*repo.AuditLog {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]*repo.AuditLog, len(r.logs))
	copy(out, r.logs)
	return out
}
