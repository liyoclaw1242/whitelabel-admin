package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel/trace"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

// Audit returns chi middleware that writes an audit log entry after each
// mutating request (POST/PUT/PATCH/DELETE). Failures are logged but do
// NOT block the response — the user's request shouldn't 500 because the
// audit sink is down.
//
// Must be mounted AFTER AuthContext so Claims are available.
func Audit(ar repo.AuditRepo) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if !isMutating(r.Method) {
				next.ServeHTTP(w, r)
				return
			}

			rw := &auditWriter{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(rw, r)

			entry := buildAuditLog(r, rw.status)
			// Write is best-effort. Failure logs through the repo itself
			// (memory impl slog.Errors; pgx impl will slog.Warn on retry
			// path).
			_ = ar.Write(r.Context(), entry)
		})
	}
}

// isMutating is exported via MutatingMethods-like logic but kept small.
func isMutating(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	}
	return false
}

// buildAuditLog assembles the record from request context + claims + span.
func buildAuditLog(r *http.Request, status int) *repo.AuditLog {
	var userID, tenantID string
	if c := ClaimsFromContext(r.Context()); c != nil {
		userID = c.Sub
		tenantID = c.TenantID
	}
	if tid, ok := TenantIDFromContext(r.Context()); ok && tenantID == "" {
		tenantID = tid
	}

	traceID := ""
	if sc := trace.SpanContextFromContext(r.Context()); sc.IsValid() {
		traceID = sc.TraceID().String()
	}

	return &repo.AuditLog{
		TenantID:   tenantID,
		UserID:     userID,
		Action:     deriveAction(r),
		Resource:   deriveResource(r),
		StatusCode: status,
		IP:         ClientIP(r),
		UserAgent:  r.UserAgent(),
		TraceID:    traceID,
		CreatedAt:  time.Now(),
	}
}

// deriveAction turns (method, resource) into a verb string like
// "items.create". Falls back to "<method>.<path>" when a route pattern
// isn't available.
func deriveAction(r *http.Request) string {
	resource := deriveResource(r)
	switch r.Method {
	case http.MethodPost:
		return resource + ".create"
	case http.MethodPut, http.MethodPatch:
		return resource + ".update"
	case http.MethodDelete:
		return resource + ".delete"
	default:
		return resource + "." + strings.ToLower(r.Method)
	}
}

// deriveResource pulls the resource noun from the chi route pattern
// (e.g. "/api/items/{id}" → "items"). Falls back to the path's second
// segment for non-chi handlers.
func deriveResource(r *http.Request) string {
	pattern := ""
	if rc := chi.RouteContext(r.Context()); rc != nil {
		pattern = rc.RoutePattern()
	}
	if pattern == "" {
		pattern = r.URL.Path
	}
	// Strip "/api/" and take the first segment.
	trimmed := strings.TrimPrefix(pattern, "/api/")
	if i := strings.Index(trimmed, "/"); i >= 0 {
		trimmed = trimmed[:i]
	}
	if trimmed == "" {
		return "unknown"
	}
	return trimmed
}

// auditWriter captures status code without touching chi's own wrapper.
type auditWriter struct {
	http.ResponseWriter
	status int
}

func (w *auditWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}
