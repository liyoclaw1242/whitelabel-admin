// Package otel wires the Go OTel SDK to Grafana Tempo via OTLP/HTTP.
//
// Resource attributes follow the decision at
// `docs/decisions/otel-naming-and-correlation.md`:
//
//	service.name                 = "whitelabel-api"
//	service.namespace            = "whitelabel"
//	service.version              = build-time version
//	deployment.environment.name  = DEPLOYMENT_ENVIRONMENT env var
//
// If OTEL_EXPORTER_OTLP_ENDPOINT is unset, Init logs a warning and returns
// a disabled Provider — the server still boots and serves traffic; spans
// are simply not exported.
package otel

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
	"go.opentelemetry.io/otel/trace"
)

// Config captures process-level OTel identity.
type Config struct {
	ServiceName    string // default "whitelabel-api"
	ServiceVersion string // default "dev"
}

// Provider holds the TracerProvider handle and lifecycle operations.
type Provider struct {
	tp      *sdktrace.TracerProvider
	enabled bool
}

// Init sets up the global OTel TracerProvider and Propagator. Returns a
// non-nil *Provider even when disabled, so callers don't need nil checks.
func Init(ctx context.Context, cfg Config) (*Provider, error) {
	endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")

	// Global propagator is wired unconditionally so traceparent/tracestate
	// still flow between services, even when export is disabled.
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	if endpoint == "" {
		slog.Warn("OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled")
		return &Provider{enabled: false}, nil
	}

	if cfg.ServiceName == "" {
		cfg.ServiceName = "whitelabel-api"
	}
	if cfg.ServiceVersion == "" {
		cfg.ServiceVersion = "dev"
	}

	exp, err := otlptracehttp.New(ctx)
	if err != nil {
		return nil, fmt.Errorf("otlptracehttp.New: %w", err)
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(cfg.ServiceName),
			semconv.ServiceNamespace("whitelabel"),
			semconv.ServiceVersion(cfg.ServiceVersion),
			semconv.DeploymentEnvironmentName(envDefault("DEPLOYMENT_ENVIRONMENT", "development")),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("resource.New: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(res),
	)
	otel.SetTracerProvider(tp)

	slog.Info("otel tracing enabled", "endpoint", endpoint, "service.name", cfg.ServiceName)
	return &Provider{tp: tp, enabled: true}, nil
}

// Enabled reports whether spans will be exported.
func (p *Provider) Enabled() bool {
	if p == nil {
		return false
	}
	return p.enabled
}

// ForceFlush drains any pending spans. Safe to call on a disabled provider
// (noop). Intended for serverless Handler defer.
func (p *Provider) ForceFlush(ctx context.Context) error {
	if p == nil || !p.enabled || p.tp == nil {
		return nil
	}
	return p.tp.ForceFlush(ctx)
}

// Shutdown flushes + releases exporter resources. Local cmd/api defers this.
func (p *Provider) Shutdown(ctx context.Context) error {
	if p == nil || !p.enabled || p.tp == nil {
		return nil
	}
	return p.tp.Shutdown(ctx)
}

// Tracer returns a tracer bound to this provider. Callers outside this
// package can also use otel.Tracer(name) since the SDK is set globally.
func (p *Provider) Tracer(name string) trace.Tracer {
	if p == nil || !p.enabled || p.tp == nil {
		return otel.Tracer(name) // noop tracer
	}
	return p.tp.Tracer(name)
}

func envDefault(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
