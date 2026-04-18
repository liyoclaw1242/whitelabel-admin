// Package router builds the chi HTTP router used by both the local
// `cmd/api` entry and the Vercel catch-all (`api/catchall.go`).
package router

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/authapi"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/health"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/middleware"
	otelmw "github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/otel"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo"
)

// Deps bundles the cross-cutting singletons the router needs.
// Any field may be nil — the router degrades gracefully (auth routes
// are only mounted when KP+Users+Blacklist are all provided).
type Deps struct {
	DB        health.Pinger
	KP        *auth.KeyPair
	Users     repo.UserRepo
	Blacklist blacklist.Store
	AuditRepo repo.AuditRepo
	CookieSec bool
}

// New returns a chi.Mux wired with the request-logging middleware and the
// /api/health endpoint. Passing a nil Pinger signals "DATABASE_URL unset" —
// health responds with 503 + {"db":"not_configured"} (graceful degradation).
func New(db health.Pinger) *chi.Mux {
	return NewWithDeps(Deps{DB: db})
}

// NewWithDeps is the full constructor. When auth deps are supplied, it
// mounts the /api/auth/* endpoints (login/refresh/logout/me).
func NewWithDeps(d Deps) *chi.Mux {
	r := chi.NewRouter()

	r.Use(otelmw.Middleware) // OpenTelemetry span + W3C traceparent propagation
	r.Use(loggingMiddleware)
	if d.AuditRepo != nil {
		r.Use(middleware.Audit(d.AuditRepo))
	}

	// /api/health is intentionally NOT behind auth middleware —
	// external probes (Vercel, uptime monitors) must reach it.
	r.Get("/api/health", health.Handler(d.DB))

	if d.KP != nil && d.Users != nil && d.Blacklist != nil {
		// Login limiter: 5 req/min per (ip+email) composite key.
		loginLimiter := middleware.NewLimiter(5, time.Minute)
		h := &authapi.Handlers{
			KP:        d.KP,
			Users:     d.Users,
			Blacklist: d.Blacklist,
			Limiter:   loginLimiter,
			CookieSec: d.CookieSec,
		}
		h.Mount(r)

		// /api/auth/me sits behind AuthContext (Bearer JWT required).
		r.With(middleware.AuthContext(d.KP)).Get("/api/auth/me", h.MeHandler())
	}

	return r
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r)
		slog.Info("request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rw.status,
			"duration_ms", time.Since(start).Milliseconds(),
		)
	})
}

type responseWriter struct {
	http.ResponseWriter
	status int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}
