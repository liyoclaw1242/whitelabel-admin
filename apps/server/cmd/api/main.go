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

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/db"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/health"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/otel"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/router"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

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
	if dbURL := os.Getenv("DATABASE_URL"); dbURL != "" {
		d, err := db.Open(dbURL)
		if err != nil {
			return err
		}
		defer d.Close()
		conn = d
		slog.Info("database connected")
	} else {
		slog.Warn("DATABASE_URL not set — /api/health will report not_configured")
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router.New(conn),
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
