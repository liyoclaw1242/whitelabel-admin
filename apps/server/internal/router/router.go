// Package router builds the chi HTTP router used by both the local
// `cmd/api` entry and the Vercel catch-all (`api/catchall.go`).
package router

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/health"
)

// New returns a chi.Mux wired with the request-logging middleware and the
// /api/health endpoint. Passing a nil Pinger signals "DATABASE_URL unset" —
// health responds with 503 + {"db":"not_configured"} (graceful degradation).
//
// Additional middleware mount points are reserved below for follow-up tasks;
// do NOT implement them here.
func New(db health.Pinger) *chi.Mux {
	r := chi.NewRouter()

	r.Use(loggingMiddleware)
	// TODO(#N_OTEL): r.Use(otel.Middleware)     — OpenTelemetry span wiring
	// TODO(#N_AUDIT): r.Use(audit.Middleware)   — audit log capture
	// TODO(#N_TENANT): r.Use(tenant.Middleware) — JWT → tenant scoping

	// /api/health is intentionally NOT behind auth middleware —
	// external probes (Vercel, uptime monitors) must reach it.
	r.Get("/api/health", health.Handler(db))

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
