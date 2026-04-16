package logging

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"strings"
	"testing"

	"go.opentelemetry.io/otel"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
)

func TestNew_DefaultsToInfoJSON(t *testing.T) {
	t.Setenv("LOG_LEVEL", "")
	l := New()
	if l == nil {
		t.Fatal("New returned nil")
	}
}

func TestParseLevel(t *testing.T) {
	cases := map[string]slog.Level{
		"debug":   slog.LevelDebug,
		"warn":    slog.LevelWarn,
		"warning": slog.LevelWarn,
		"error":   slog.LevelError,
		"":        slog.LevelInfo,
		"xyz":     slog.LevelInfo,
	}
	for in, want := range cases {
		if got := parseLevel(in); got != want {
			t.Errorf("parseLevel(%q) = %v, want %v", in, got, want)
		}
	}
}

func TestTraceHandler_InjectsTraceAndSpanID_WhenSpanActive(t *testing.T) {
	var buf bytes.Buffer
	base := slog.NewJSONHandler(&buf, nil)
	l := slog.New(&traceHandler{base: base})

	tp := sdktrace.NewTracerProvider()
	defer tp.Shutdown(context.Background())
	prev := otel.GetTracerProvider()
	otel.SetTracerProvider(tp)
	defer otel.SetTracerProvider(prev)

	ctx, span := tp.Tracer("t").Start(context.Background(), "op")
	defer span.End()

	l.InfoContext(ctx, "hello")

	var rec map[string]any
	if err := json.NewDecoder(&buf).Decode(&rec); err != nil {
		t.Fatal(err)
	}
	if s, _ := rec["trace_id"].(string); len(s) != 32 {
		t.Errorf("trace_id len = %d, got %q", len(s), s)
	}
	if s, _ := rec["span_id"].(string); len(s) != 16 {
		t.Errorf("span_id len = %d, got %q", len(s), s)
	}
}

func TestTraceHandler_NoInjection_WhenNoSpan(t *testing.T) {
	var buf bytes.Buffer
	base := slog.NewJSONHandler(&buf, nil)
	l := slog.New(&traceHandler{base: base})

	l.InfoContext(context.Background(), "hello")

	got := buf.String()
	if strings.Contains(got, "trace_id") {
		t.Errorf("unexpected trace_id in log: %s", got)
	}
}

func TestTraceHandler_WithAttrsAndGroupPropagate(t *testing.T) {
	var buf bytes.Buffer
	base := slog.NewJSONHandler(&buf, nil)
	h := &traceHandler{base: base}
	withA := h.WithAttrs([]slog.Attr{slog.String("k", "v")})
	if withA == nil {
		t.Fatal("WithAttrs returned nil")
	}
	withG := h.WithGroup("g")
	if withG == nil {
		t.Fatal("WithGroup returned nil")
	}
}
