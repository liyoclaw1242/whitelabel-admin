package middleware

import (
	"context"
	"net/http"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/httperr"
)

type tenantCtxKey struct{}

// WithTenantID stores tenant id on context (exported for handlers that want
// to set it directly without going through middleware, e.g. tests).
func WithTenantID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, tenantCtxKey{}, id)
}

// TenantIDFromContext returns the tenant id previously set by Tenant or
// WithTenantID. The bool is false when unset. Repo layer will use this to
// auto-inject WHERE tenant_id = $X.
func TenantIDFromContext(ctx context.Context) (string, bool) {
	id, ok := ctx.Value(tenantCtxKey{}).(string)
	return id, ok && id != ""
}

// Tenant middleware pulls tenant_id from Claims (set by AuthContext) and
// stores it on the request context. Must be mounted AFTER AuthContext.
// Responds with 401 + RFC 7807 if Claims missing; 403 if tenant_id empty.
func Tenant(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c := ClaimsFromContext(r.Context())
		if c == nil {
			httperr.WriteFor(w, r, httperr.Unauthorized("no claims on context"))
			return
		}
		if c.TenantID == "" {
			httperr.WriteFor(w, r, httperr.Forbidden("token has no tenant_id"))
			return
		}
		next.ServeHTTP(w, r.WithContext(WithTenantID(r.Context(), c.TenantID)))
	})
}
