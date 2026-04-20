// Package logging wraps slog with OTel trace_id/span_id auto-injection
// and, when given a non-nil OTel LoggerProvider, fans records out to
// the OTLP logs exporter so they land in Grafana Loki alongside
// traces.
package logging

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/trace"
)

// instrumentationName identifies these records in the OTel pipeline
// (appears as the logger scope name in Loki under "otel_scope_name").
const instrumentationName = "github.com/liyoclaw1242/whitelabel-admin/apps/server"

// New returns a *slog.Logger that writes JSON to stdout. If lp is
// non-nil, records are ALSO forwarded to the OTel LoggerProvider (which
// ships them to the OTLP /v1/logs endpoint — Grafana Loki). Log level
// comes from the LOG_LEVEL env var; default "info".
func New(lp *sdklog.LoggerProvider) *slog.Logger {
	lvl := parseLevel(os.Getenv("LOG_LEVEL"))
	stdoutH := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})

	var base slog.Handler = stdoutH
	if lp != nil {
		otelH := otelslog.NewHandler(instrumentationName, otelslog.WithLoggerProvider(lp))
		base = &fanoutHandler{handlers: []slog.Handler{stdoutH, otelH}}
	}
	return slog.New(&traceHandler{base: base})
}

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

// traceHandler decorates every record with trace_id / span_id pulled
// from the record's context, if an OTel span is active. Otherwise noop.
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

// fanoutHandler sends every record to all wrapped handlers. Used to
// write the same log line to stdout AND the OTel logs exporter so
// local tail (Vercel function log page) and Grafana Loki stay in
// sync. Clone() is required because slog.Record is a value type that
// some handlers mutate.
type fanoutHandler struct{ handlers []slog.Handler }

func (f *fanoutHandler) Enabled(ctx context.Context, l slog.Level) bool {
	for _, h := range f.handlers {
		if h.Enabled(ctx, l) {
			return true
		}
	}
	return false
}

func (f *fanoutHandler) Handle(ctx context.Context, r slog.Record) error {
	var firstErr error
	for _, h := range f.handlers {
		if err := h.Handle(ctx, r.Clone()); err != nil && firstErr == nil {
			firstErr = err
		}
	}
	return firstErr
}

func (f *fanoutHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	out := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		out[i] = h.WithAttrs(attrs)
	}
	return &fanoutHandler{handlers: out}
}

func (f *fanoutHandler) WithGroup(name string) slog.Handler {
	out := make([]slog.Handler, len(f.handlers))
	for i, h := range f.handlers {
		out[i] = h.WithGroup(name)
	}
	return &fanoutHandler{handlers: out}
}
