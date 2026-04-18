// Package handler is the Vercel Go serverless entry point.
//
// The spec calls for a catch-all at `apps/server/api/[[...path]].go`, but
// Go's compiler rejects square-bracket filenames. This file plays the same
// role: Vercel's Go runtime picks up `api/*.go` and wires the path via
// `vercel.json` rewrites — every `/api/*` request is routed to `Handler`.
// The chi router inside decides what to do with the URL.
package handler

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/db"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/otel"
	pgxrepo "github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo/pgx"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/router"
)

var (
	initOnce sync.Once
	handler  http.Handler
	otelProv *otel.Provider
)

// Handler is the Vercel entry function. It lazily builds the chi router on
// first request and reuses it across invocations within the same serverless
// instance.
//
// Vercel serverless may terminate the process without running atexit hooks,
// so we ForceFlush the OTel batcher on every invocation. 2s is the budget
// per spec; shorter than Vercel's hard cold-kill grace period.
func Handler(w http.ResponseWriter, r *http.Request) {
	initOnce.Do(initHandler)
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		if err := otelProv.ForceFlush(ctx); err != nil {
			slog.Warn("otel ForceFlush error", "error", err)
		}
	}()
	handler.ServeHTTP(w, r)
}

func initHandler() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	var err error
	otelProv, err = otel.Init(context.Background(), otel.Config{
		ServiceName:    "whitelabel-api",
		ServiceVersion: envDefault("VERCEL_GIT_COMMIT_SHA", "dev"),
	})
	if err != nil {
		slog.Error("otel.Init failed — continuing without tracing", "error", err)
	}

	deps := router.Deps{
		Blacklist: blacklist.NewMemory(),
		CookieSec: envDefault("COOKIE_SECURE", "") != "",
	}

	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		pool, err := db.OpenPool(context.Background(), dbURL)
		if err != nil {
			slog.Error("DATABASE_URL present but OpenPool failed — continuing without DB", "error", err)
		} else {
			deps.DB = &db.PoolPinger{Pool: pool}
			deps.Users = pgxrepo.NewUserRepo(pool)
			deps.AuditRepo = pgxrepo.NewAuditRepo(pool)
			slog.Info("database connected (pgxpool)")
		}
	} else {
		slog.Warn("DATABASE_URL not set — /api/health will report not_configured")
	}

	if priv, pub := os.Getenv("JWT_PRIVATE_KEY"), os.Getenv("JWT_PUBLIC_KEY"); priv != "" && pub != "" {
		kp, err := auth.LoadKeyPair(priv, pub)
		if err != nil {
			slog.Error("JWT keypair invalid — /api/auth/* will stay disabled", "error", err)
		} else {
			deps.KP = kp
			slog.Info("auth endpoints enabled")
		}
	} else {
		slog.Warn("JWT_PRIVATE_KEY/JWT_PUBLIC_KEY not set — /api/auth/* endpoints disabled")
	}

	handler = router.NewWithDeps(deps)
}

func envDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
