// Package middleware exposes auth/rbac/tenant/ratelimit chi middleware.
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
)

type claimsCtxKey struct{}

// WithClaims stores Claims on the context.
func WithClaims(ctx context.Context, c *auth.Claims) context.Context {
	return context.WithValue(ctx, claimsCtxKey{}, c)
}

// ClaimsFromContext returns the Claims attached by AuthContext, or nil.
func ClaimsFromContext(ctx context.Context) *auth.Claims {
	c, _ := ctx.Value(claimsCtxKey{}).(*auth.Claims)
	return c
}

// AuthContext returns chi middleware that parses the incoming Authorization
// bearer token with kp, puts the Claims on the request context on success,
// or responds with 401 + RFC 7807 on failure.
//
// Does NOT enforce permissions — use RequirePermission for that.
func AuthContext(kp *auth.KeyPair) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			hdr := r.Header.Get("Authorization")
			if !strings.HasPrefix(hdr, "Bearer ") {
				httperr.WriteFor(w, r, httperr.Unauthorized("missing bearer token"))
				return
			}
			tok := strings.TrimPrefix(hdr, "Bearer ")
			claims, err := kp.Verify(tok)
			if err != nil {
				httperr.WriteFor(w, r, httperr.Unauthorized("invalid or expired token"))
				return
			}
			next.ServeHTTP(w, r.WithContext(WithClaims(r.Context(), claims)))
		})
	}
}
