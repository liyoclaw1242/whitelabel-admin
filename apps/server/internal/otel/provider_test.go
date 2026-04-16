package otel

import (
	"context"
	"testing"
)

func TestInit_NoEndpoint_ReturnsNilProviderAndNoError(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "")
	t.Setenv("DEPLOYMENT_ENVIRONMENT", "test")

	p, err := Init(context.Background(), Config{ServiceName: "whitelabel-api"})
	if err != nil {
		t.Fatalf("Init: unexpected err: %v", err)
	}
	if p == nil {
		t.Fatal("expected non-nil Provider (noop) when endpoint unset")
	}
	if p.Enabled() {
		t.Error("Enabled() = true, want false when OTLP endpoint unset")
	}
}

func TestInit_WithEndpoint_ReturnsEnabledProvider(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:0")
	t.Setenv("DEPLOYMENT_ENVIRONMENT", "test")

	p, err := Init(context.Background(), Config{ServiceName: "whitelabel-api", ServiceVersion: "0.0.0-test"})
	if err != nil {
		t.Fatalf("Init: %v", err)
	}
	defer p.Shutdown(context.Background())

	if !p.Enabled() {
		t.Error("Enabled() = false, want true when endpoint configured")
	}
}

func TestProvider_ForceFlush_NoopWhenDisabled(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "")

	p, err := Init(context.Background(), Config{ServiceName: "whitelabel-api"})
	if err != nil {
		t.Fatalf("Init: %v", err)
	}
	if err := p.ForceFlush(context.Background()); err != nil {
		t.Errorf("ForceFlush on disabled provider: %v", err)
	}
}

func TestProvider_ForceFlush_WhenEnabled(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://127.0.0.1:0")

	p, err := Init(context.Background(), Config{ServiceName: "whitelabel-api"})
	if err != nil {
		t.Fatalf("Init: %v", err)
	}
	defer p.Shutdown(context.Background())

	ctx, cancel := context.WithTimeout(context.Background(), 500*1000*1000) // 500ms
	defer cancel()
	// Call should return (exporter may error against :0, but ForceFlush itself
	// doesn't propagate exporter errors on batcher when nothing queued).
	_ = p.ForceFlush(ctx)
}

func TestProvider_Tracer_ReturnsNoopWhenDisabled(t *testing.T) {
	t.Setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "")

	p, err := Init(context.Background(), Config{})
	if err != nil {
		t.Fatalf("Init: %v", err)
	}
	tr := p.Tracer("test")
	if tr == nil {
		t.Fatal("Tracer returned nil; expected noop tracer")
	}
	// Creating a span on the noop tracer must not panic.
	_, span := tr.Start(context.Background(), "noop-span")
	span.End()
}
