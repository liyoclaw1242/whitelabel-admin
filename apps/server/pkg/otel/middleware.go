package otel

import (
	"net/http"

	"github.com/go-chi/chi/v5"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
	"go.opentelemetry.io/otel/trace"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/httperr"
)

// Middleware returns a chi middleware that:
//   - reads W3C traceparent/tracestate from the request and continues the trace
//   - creates a server span named "HTTP {method} {route-pattern}" per OTel HTTP semconv
//   - stashes the 32-char hex trace id on the request context via httperr.WithTraceID
//     so Problem+JSON error responses echo the same id
//
// Uses the global TracerProvider/Propagator set by Init.
func Middleware(next http.Handler) http.Handler {
	tracer := otel.Tracer("apps/server/internal/otel")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := otel.GetTextMapPropagator().Extract(r.Context(), propagatorCarrier(r.Header))

		ctx, span := tracer.Start(ctx, spanName(r),
			trace.WithSpanKind(trace.SpanKindServer),
			trace.WithAttributes(
				semconv.HTTPRequestMethodKey.String(r.Method),
				semconv.URLPath(r.URL.Path),
			),
		)
		defer span.End()

		// Propagate the 32-char hex trace id through context so Problem bodies
		// produced by httperr echo it.
		if tid := span.SpanContext().TraceID(); tid.IsValid() {
			ctx = httperr.WithTraceID(ctx, tid.String())
		}

		rw := &statusWriter{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rw, r.WithContext(ctx))

		// chi populates RoutePattern AFTER routing, so `http.route` can
		// only be set post-ServeHTTP. Needed by downstream dashboards /
		// alerts that group on the low-cardinality pattern (e.g.
		// `/api/users/{id}`) rather than the exact URL.
		if rc := chi.RouteContext(r.Context()); rc != nil && rc.RoutePattern() != "" {
			span.SetAttributes(semconv.HTTPRoute(rc.RoutePattern()))
			span.SetName("HTTP " + r.Method + " " + rc.RoutePattern())
		}
		span.SetAttributes(semconv.HTTPResponseStatusCode(rw.status))
		if rw.status >= 500 {
			span.SetStatus(codes.Error, http.StatusText(rw.status))
		}
	})
}

// spanName follows OTel HTTP semantic conventions: "HTTP {method} {route}"
// where route is the chi pattern (e.g. "/api/users/{id}"), not the resolved
// URL. If no chi context is available (non-chi routes), falls back to the
// URL path — still safe but will have higher cardinality.
func spanName(r *http.Request) string {
	if rc := chi.RouteContext(r.Context()); rc != nil && rc.RoutePattern() != "" {
		return "HTTP " + r.Method + " " + rc.RoutePattern()
	}
	return "HTTP " + r.Method + " " + r.URL.Path
}

// propagatorCarrier adapts http.Header to TextMapCarrier.
type propagatorCarrier http.Header

func (c propagatorCarrier) Get(key string) string   { return http.Header(c).Get(key) }
func (c propagatorCarrier) Set(key, val string)     { http.Header(c).Set(key, val) }
func (c propagatorCarrier) Keys() []string {
	keys := make([]string, 0, len(c))
	for k := range c {
		keys = append(keys, k)
	}
	return keys
}

type statusWriter struct {
	http.ResponseWriter
	status int
}

func (sw *statusWriter) WriteHeader(code int) {
	sw.status = code
	sw.ResponseWriter.WriteHeader(code)
}

// dbAttrSystem is reused by dbtrace.Query; exported for other db packages.
var dbAttrSystem = attribute.String("db.system", "postgresql")
