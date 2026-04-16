package otel

import (
	"context"
	"database/sql"

	"go.opentelemetry.io/otel"
	semconv "go.opentelemetry.io/otel/semconv/v1.27.0"
	"go.opentelemetry.io/otel/trace"
)

// Querier is the subset of *sql.DB / *sql.Conn used by the helper.
type Querier interface {
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

// Query runs QueryContext under an OTel child span annotated with
// db.system=postgresql and a sanitized db.statement.
//
// Phase 4 repo layer will use this directly; the helper exists here so
// follow-up tasks have a consistent tracing surface.
func Query(ctx context.Context, q Querier, name, stmt string, args ...any) (*sql.Rows, error) {
	ctx, span := otel.Tracer("apps/server/internal/otel").Start(
		ctx, "db.query "+name,
		trace.WithSpanKind(trace.SpanKindClient),
		trace.WithAttributes(
			dbAttrSystem,
			semconv.DBQueryText(Sanitize(stmt)),
		),
	)
	defer span.End()
	return q.QueryContext(ctx, stmt, args...)
}

// Sanitize is a very small statement scrubber — removes string literals and
// numbers so stray PII doesn't land in traces. Real parameterised queries
// should already pass args separately, so this is a belt-and-braces guard.
func Sanitize(stmt string) string {
	out := make([]byte, 0, len(stmt))
	inString := false
	for i := 0; i < len(stmt); i++ {
		c := stmt[i]
		if c == '\'' {
			inString = !inString
			out = append(out, '?')
			continue
		}
		if inString {
			continue
		}
		if c >= '0' && c <= '9' {
			out = append(out, '?')
			// Skip contiguous digits.
			for i+1 < len(stmt) && stmt[i+1] >= '0' && stmt[i+1] <= '9' {
				i++
			}
			continue
		}
		out = append(out, c)
	}
	return string(out)
}
