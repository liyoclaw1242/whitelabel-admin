// Package httperr implements RFC 7807 `application/problem+json` responses.
package httperr

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
)

const ContentType = "application/problem+json"

type Problem struct {
	Type     string            `json:"type"`
	Title    string            `json:"title"`
	Status   int               `json:"status"`
	Detail   string            `json:"detail,omitempty"`
	Instance string            `json:"instance,omitempty"`
	TraceID  string            `json:"trace_id,omitempty"`
	Errors   map[string]string `json:"errors,omitempty"`
}

type traceIDKey struct{}

// WithTraceID stores a trace id on the context so Write/WriteFor can echo it.
func WithTraceID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, traceIDKey{}, id)
}

// TraceIDFrom extracts the trace id set by WithTraceID, or "" if none.
func TraceIDFrom(ctx context.Context) string {
	if v, ok := ctx.Value(traceIDKey{}).(string); ok {
		return v
	}
	return ""
}

// Write sends the problem as application/problem+json with the declared status.
func Write(w http.ResponseWriter, p *Problem) {
	w.Header().Set("Content-Type", ContentType)
	w.WriteHeader(p.Status)
	if err := json.NewEncoder(w).Encode(p); err != nil {
		slog.Error("problem encode", "error", err)
	}
}

// WriteFor fills Instance and TraceID from the request/context, then writes.
func WriteFor(w http.ResponseWriter, r *http.Request, p *Problem) {
	if p.Instance == "" {
		p.Instance = r.URL.Path
	}
	if p.TraceID == "" {
		p.TraceID = TraceIDFrom(r.Context())
	}
	Write(w, p)
}

func base(status int, title, detail string) *Problem {
	return &Problem{Type: "about:blank", Title: title, Status: status, Detail: detail}
}

func NotFound(detail string) *Problem {
	return base(http.StatusNotFound, "Not Found", detail)
}

func Unauthorized(detail string) *Problem {
	return base(http.StatusUnauthorized, "Unauthorized", detail)
}

func Forbidden(detail string) *Problem {
	return base(http.StatusForbidden, "Forbidden", detail)
}

func Conflict(detail string) *Problem {
	return base(http.StatusConflict, "Conflict", detail)
}

func Validation(errors map[string]string) *Problem {
	p := base(http.StatusUnprocessableEntity, "Validation Failed", "One or more fields are invalid.")
	p.Errors = errors
	return p
}

// Internal wraps an unexpected error. The detail is intentionally generic — the
// underlying error is logged for operators but not leaked to clients.
func Internal(err error) *Problem {
	if err != nil {
		slog.Error("internal error", "error", err)
	}
	return base(http.StatusInternalServerError, "Internal Server Error", "An unexpected error occurred.")
}
