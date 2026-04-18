package otel

import (
	"os"
	"strconv"
	"strings"

	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

// NewSampler returns a ParentBased sampler that:
//   - Always samples auth routes (/api/auth/*)
//   - Uses TraceIDRatioBased for everything else (default 10%)
//   - Reads OTEL_TRACES_SAMPLER_ARG env for the default ratio
func NewSampler() sdktrace.Sampler {
	ratio := 0.1
	if v := os.Getenv("OTEL_TRACES_SAMPLER_ARG"); v != "" {
		if r, err := strconv.ParseFloat(v, 64); err == nil && r >= 0 && r <= 1 {
			ratio = r
		}
	}
	return sdktrace.ParentBased(
		&routeSampler{
			defaultSampler: sdktrace.TraceIDRatioBased(ratio),
			alwaysOn:       sdktrace.AlwaysSample(),
		},
	)
}

// routeSampler delegates to AlwaysSample for auth routes, and a
// ratio-based sampler for everything else.
type routeSampler struct {
	defaultSampler sdktrace.Sampler
	alwaysOn       sdktrace.Sampler
}

func (s *routeSampler) ShouldSample(p sdktrace.SamplingParameters) sdktrace.SamplingResult {
	if isAuthRoute(p.Name) {
		return s.alwaysOn.ShouldSample(p)
	}
	return s.defaultSampler.ShouldSample(p)
}

func (s *routeSampler) Description() string {
	return "RouteSampler(auth=alwaysOn, default=" + s.defaultSampler.Description() + ")"
}

func isAuthRoute(spanName string) bool {
	return strings.Contains(spanName, "/api/auth/")
}

// SamplerRatio exposes the configured ratio for testing. Reads from env.
func SamplerRatio() float64 {
	if v := os.Getenv("OTEL_TRACES_SAMPLER_ARG"); v != "" {
		if r, err := strconv.ParseFloat(v, 64); err == nil && r >= 0 && r <= 1 {
			return r
		}
	}
	return 0.1
}
