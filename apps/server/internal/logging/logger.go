// Package logging wraps slog with OTel trace_id/span_id auto-injection.
package logging

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"go.opentelemetry.io/otel/trace"
)

// New returns a slog.Logger configured for JSON output at the level read
// from the LOG_LEVEL env var (default "info"). The handler automatically
// injects `trace_id` and `span_id` attributes when the record's context
// has an active OTel span.
func New() *slog.Logger {
	lvl := parseLevel(os.Getenv("LOG_LEVEL"))
	base := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})
	return slog.New(&traceHandler{base: base})
}

// parseLevel maps common names to slog levels. Unknown values fall back to INFO.
func parseLevel(s string) slog.Level {
	switch strings.ToLower(s) {
	case "debug":
		return slog.LevelDebug
	case "warn", "warning":
		return slog.LevelWarn
	case "error":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}

// traceHandler decorates every record with trace_id / span_id pulled from
// the record's context, if an OTel span is active. Otherwise it's a noop.
type traceHandler struct{ base slog.Handler }

func (h *traceHandler) Enabled(ctx context.Context, l slog.Level) bool {
	return h.base.Enabled(ctx, l)
}

func (h *traceHandler) Handle(ctx context.Context, r slog.Record) error {
	if sc := trace.SpanContextFromContext(ctx); sc.IsValid() {
		r.AddAttrs(
			slog.String("trace_id", sc.TraceID().String()),
			slog.String("span_id", sc.SpanID().String()),
		)
	}
	return h.base.Handle(ctx, r)
}

func (h *traceHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &traceHandler{base: h.base.WithAttrs(attrs)}
}

func (h *traceHandler) WithGroup(name string) slog.Handler {
	return &traceHandler{base: h.base.WithGroup(name)}
}
