package otel

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	"go.opentelemetry.io/otel/sdk/trace/tracetest"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
)

// withRecorder swaps in an in-memory span recorder for the duration of the test.
func withRecorder(t *testing.T) *tracetest.SpanRecorder {
	t.Helper()
	rec := tracetest.NewSpanRecorder()
	tp := sdktrace.NewTracerProvider(sdktrace.WithSpanProcessor(rec))
	prev := otel.GetTracerProvider()
	otel.SetTracerProvider(tp)
	t.Cleanup(func() { otel.SetTracerProvider(prev) })
	return rec
}

func TestMiddleware_CreatesRootSpan(t *testing.T) {
	rec := withRecorder(t)

	r := chi.NewRouter()
	r.Use(Middleware)
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rw := httptest.NewRecorder()
	r.ServeHTTP(rw, req)

	spans := rec.Ended()
	if len(spans) != 1 {
		t.Fatalf("expected 1 span, got %d", len(spans))
	}
	if spans[0].Name() != "HTTP GET /api/health" {
		t.Errorf("span name = %q, want 'HTTP GET /api/health'", spans[0].Name())
	}
}

func TestMiddleware_ExtractsTraceparent(t *testing.T) {
	rec := withRecorder(t)

	// Re-init propagator via Init's code path — the test recorder doesn't
	// touch the global propagator, so we rely on Init having been called.
	_, err := Init(context.Background(), Config{})
	if err != nil {
		t.Fatalf("Init: %v", err)
	}

	r := chi.NewRouter()
	r.Use(Middleware)
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// W3C traceparent: version-traceid-spanid-flags
	parentTraceID := "4bf92f3577b34da6a3ce929d0e0e4736"
	parentSpanID := "00f067aa0ba902b7"
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	req.Header.Set("traceparent", "00-"+parentTraceID+"-"+parentSpanID+"-01")
	rw := httptest.NewRecorder()
	r.ServeHTTP(rw, req)

	spans := rec.Ended()
	if len(spans) != 1 {
		t.Fatalf("expected 1 span, got %d", len(spans))
	}
	if got := spans[0].SpanContext().TraceID().String(); got != parentTraceID {
		t.Errorf("child span trace id = %q, want parent's %q", got, parentTraceID)
	}
	if got := spans[0].Parent().SpanID().String(); got != parentSpanID {
		t.Errorf("parent span id = %q, want %q", got, parentSpanID)
	}
}

func TestMiddleware_PutsTraceIDOnContextForProblem(t *testing.T) {
	withRecorder(t)

	var capturedTraceID string
	r := chi.NewRouter()
	r.Use(Middleware)
	r.Get("/api/health", func(w http.ResponseWriter, r *http.Request) {
		capturedTraceID = httperr.TraceIDFrom(r.Context())
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rw := httptest.NewRecorder()
	r.ServeHTTP(rw, req)

	if capturedTraceID == "" {
		t.Error("trace id not propagated through context")
	}
	if len(capturedTraceID) != 32 {
		t.Errorf("trace id len = %d, want 32", len(capturedTraceID))
	}
}
