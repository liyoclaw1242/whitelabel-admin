package middleware

import (
	"net/http"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/httperr"
)

// RequirePermission returns middleware that allows the request only if the
// Claims on the context include perm. Must be mounted AFTER AuthContext.
func RequirePermission(perm string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			c := ClaimsFromContext(r.Context())
			if c == nil {
				httperr.WriteFor(w, r, httperr.Unauthorized("no claims on context"))
				return
			}
			for _, p := range c.Permissions {
				if p == perm {
					next.ServeHTTP(w, r)
					return
				}
			}
			httperr.WriteFor(w, r, httperr.Forbidden("missing permission: "+perm))
		})
	}
}
