package httperr

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestWrite_SetsContentTypeAndStatus(t *testing.T) {
	rec := httptest.NewRecorder()
	p := &Problem{Type: "about:blank", Title: "Teapot", Status: 418, Detail: "short and stout"}
	Write(rec, p)

	if got := rec.Header().Get("Content-Type"); got != "application/problem+json" {
		t.Errorf("Content-Type = %q, want application/problem+json", got)
	}
	if rec.Code != 418 {
		t.Errorf("status = %d, want 418", rec.Code)
	}

	var decoded Problem
	if err := json.NewDecoder(rec.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if decoded.Title != "Teapot" || decoded.Detail != "short and stout" {
		t.Errorf("body = %+v", decoded)
	}
}

func TestHelpers_DefaultStatusCodes(t *testing.T) {
	cases := []struct {
		name string
		p    *Problem
		want int
	}{
		{"NotFound", NotFound("x"), http.StatusNotFound},
		{"Unauthorized", Unauthorized("x"), http.StatusUnauthorized},
		{"Forbidden", Forbidden("x"), http.StatusForbidden},
		{"Conflict", Conflict("x"), http.StatusConflict},
		{"Internal", Internal(nil), http.StatusInternalServerError},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if tc.p.Status != tc.want {
				t.Errorf("%s status = %d, want %d", tc.name, tc.p.Status, tc.want)
			}
			if tc.p.Type != "about:blank" {
				t.Errorf("%s type = %q, want about:blank", tc.name, tc.p.Type)
			}
			if tc.p.Title == "" {
				t.Errorf("%s has empty title", tc.name)
			}
		})
	}
}

func TestValidation_IncludesFieldErrors(t *testing.T) {
	rec := httptest.NewRecorder()
	p := Validation(map[string]string{"email": "format", "password": "min_length"})
	Write(rec, p)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("status = %d, want 422", rec.Code)
	}

	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	errs, ok := body["errors"].(map[string]any)
	if !ok {
		t.Fatalf("errors missing or wrong type: %T", body["errors"])
	}
	if errs["email"] != "format" {
		t.Errorf("errors.email = %v, want format", errs["email"])
	}
}

func TestWrite_UsesTraceIDFromContext(t *testing.T) {
	ctx := WithTraceID(context.Background(), "trace-abc-123")
	req := httptest.NewRequest(http.MethodGet, "/api/x", nil).WithContext(ctx)
	rec := httptest.NewRecorder()

	p := NotFound("x")
	WriteFor(rec, req, p)

	var decoded Problem
	if err := json.NewDecoder(rec.Body).Decode(&decoded); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if decoded.TraceID != "trace-abc-123" {
		t.Errorf("trace_id = %q, want trace-abc-123", decoded.TraceID)
	}
	if decoded.Instance != "/api/x" {
		t.Errorf("instance = %q, want /api/x", decoded.Instance)
	}
}
