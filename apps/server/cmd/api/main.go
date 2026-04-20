// Command api runs the Whitelabel Admin HTTP API locally.
//
// In production the same router is served via Vercel's Go serverless
// runtime — see apps/server/api/catchall.go.
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/db"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/health"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/logging"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/otel"
	memrepo "github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo/memory"
	pgxrepo "github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/repo/pgx"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/router"
)

func main() {
	// Bootstrap with stdout-only logger so otel.Init failures are visible.
	slog.SetDefault(logging.New(nil))

	if err := run(); err != nil {
		slog.Error("fatal", "error", err)
		os.Exit(1)
	}
}

func run() error {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	otelProv, err := otel.Init(context.Background(), otel.Config{
		ServiceName:    "whitelabel-api",
		ServiceVersion: envDefault("VERCEL_GIT_COMMIT_SHA", "dev"),
	})
	// Re-seat the default logger so the OTel logs bridge (if enabled)
	// picks up every subsequent slog.Info/Warn/Error call.
	slog.SetDefault(logging.New(otelProv.LoggerProvider()))
	if err != nil {
		slog.Error("otel.Init failed — continuing without tracing", "error", err)
	}
	defer func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = otelProv.Shutdown(ctx)
	}()

	// DATABASE_URL is optional. When unset, /api/health gracefully
	// reports {"db":"not_configured"} instead of crashing startup —
	// this lets Vercel previews boot before OPS wires the Neon URL.
	var conn health.Pinger
	deps := router.Deps{CookieSec: envDefault("COOKIE_SECURE", "") != ""}

	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		pool, err := db.OpenPool(context.Background(), dbURL)
		if err != nil {
			return err
		}
		defer pool.Close()
		conn = &db.PoolPinger{Pool: pool}
		deps.Users = pgxrepo.NewUserRepo(pool)
		deps.AuditRepo = pgxrepo.NewAuditRepo(pool)
		slog.Info("database connected (pgxpool)")
	} else {
		slog.Warn("DATABASE_URL not set — using memory repos")
		users, err := memrepo.NewUserRepo()
		if err != nil {
			return err
		}
		deps.Users = users
	}
	deps.DB = conn
	deps.Blacklist = blacklist.NewMemory()

	// Auth deps — gracefully degrade when JWT keys aren't provided.
	if priv, pub := os.Getenv("JWT_PRIVATE_KEY"), os.Getenv("JWT_PUBLIC_KEY"); priv != "" && pub != "" {
		kp, err := auth.LoadKeyPair(priv, pub)
		if err != nil {
			return err
		}
		deps.KP = kp
		slog.Info("auth endpoints enabled")
	} else {
		slog.Warn("JWT_PRIVATE_KEY/JWT_PUBLIC_KEY not set — /api/auth/* endpoints disabled")
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router.NewWithDeps(deps),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		slog.Info("server starting", "port", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	sig := <-done
	slog.Info("shutdown signal received", "signal", sig.String())

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		return err
	}
	slog.Info("server stopped gracefully")
	return nil
}

func envDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
