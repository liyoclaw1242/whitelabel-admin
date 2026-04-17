package pgx

import (
	"context"
	"log/slog"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

type AuditRepo struct{ pool *pgxpool.Pool }

func NewAuditRepo(pool *pgxpool.Pool) *AuditRepo { return &AuditRepo{pool: pool} }

// Write inserts an audit log entry. Errors are logged but never propagated
// — the audit sink must not block the request.
func (r *AuditRepo) Write(ctx context.Context, l *repo.AuditLog) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO audit_logs (tenant_id, user_id, action, resource, ip, user_agent, trace_id, metadata, created_at)
		 VALUES ($1, $2, $3, $4, $5::inet, $6, $7, $8, $9)`,
		l.TenantID, nilIfEmpty(l.UserID), l.Action, l.Resource,
		nilIfEmpty(l.IP), l.UserAgent, nilIfEmpty(l.TraceID),
		l.Metadata, l.CreatedAt)
	if err != nil {
		slog.Warn("audit write failed — falling back to slog",
			"error", err, "action", l.Action, "resource", l.Resource,
			"user_id", l.UserID, "tenant_id", l.TenantID, "trace_id", l.TraceID)
	}
	return nil
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
