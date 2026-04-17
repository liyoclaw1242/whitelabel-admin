package otel

import (
	"testing"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/trace"
)

func TestRouteSampler_AuthAlwaysSampled(t *testing.T) {
	s := &routeSampler{
		defaultSampler: sdktrace.NeverSample(),
		alwaysOn:       sdktrace.AlwaysSample(),
	}
	result := s.ShouldSample(sdktrace.SamplingParameters{
		Name:    "HTTP POST /api/auth/login",
		TraceID: trace.TraceID{1, 2, 3},
	})
	if result.Decision != sdktrace.RecordAndSample {
		t.Errorf("auth route decision = %v, want RecordAndSample", result.Decision)
	}
}

func TestRouteSampler_NonAuthUsesDefault(t *testing.T) {
	s := &routeSampler{
		defaultSampler: sdktrace.NeverSample(),
		alwaysOn:       sdktrace.AlwaysSample(),
	}
	result := s.ShouldSample(sdktrace.SamplingParameters{
		Name:    "HTTP GET /api/items",
		TraceID: trace.TraceID{1, 2, 3},
	})
	if result.Decision != sdktrace.Drop {
		t.Errorf("non-auth route decision = %v, want Drop (NeverSample)", result.Decision)
	}
}

func TestRouteSampler_Description(t *testing.T) {
	s := &routeSampler{
		defaultSampler: sdktrace.TraceIDRatioBased(0.1),
		alwaysOn:       sdktrace.AlwaysSample(),
	}
	desc := s.Description()
	if desc == "" {
		t.Error("empty description")
	}
}

func TestSamplerRatio_Default(t *testing.T) {
	t.Setenv("OTEL_TRACES_SAMPLER_ARG", "")
	if got := SamplerRatio(); got != 0.1 {
		t.Errorf("ratio = %f, want 0.1", got)
	}
}

func TestSamplerRatio_FromEnv(t *testing.T) {
	t.Setenv("OTEL_TRACES_SAMPLER_ARG", "0.5")
	if got := SamplerRatio(); got != 0.5 {
		t.Errorf("ratio = %f, want 0.5", got)
	}
}

func TestNewSampler_ReturnsNonNil(t *testing.T) {
	t.Setenv("OTEL_TRACES_SAMPLER_ARG", "0.25")
	s := NewSampler()
	if s == nil {
		t.Fatal("NewSampler returned nil")
	}
}
