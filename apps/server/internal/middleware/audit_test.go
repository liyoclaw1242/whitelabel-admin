package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

type memAudit struct{ logs []*repo.AuditLog }

func (m *memAudit) Write(_ context.Context, l *repo.AuditLog) error {
	m.logs = append(m.logs, l)
	return nil
}

func TestAudit_SkipsReadMethods(t *testing.T) {
	ar := &memAudit{}
	r := chi.NewRouter()
	r.Use(Audit(ar))
	r.Get("/api/items", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/items", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if len(ar.logs) != 0 {
		t.Errorf("expected 0 audit entries for GET, got %d", len(ar.logs))
	}
}

func TestAudit_CapturesMutatingRequest(t *testing.T) {
	ar := &memAudit{}
	c := auth.NewClaims("user-1", "tenant-1", []string{"admin"}, nil)

	r := chi.NewRouter()
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, rr *http.Request) {
			ctx := WithClaims(rr.Context(), &c)
			ctx = WithTenantID(ctx, c.TenantID)
			next.ServeHTTP(w, rr.WithContext(ctx))
		})
	})
	r.Use(Audit(ar))
	r.Post("/api/items", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/items", nil)
	req.Header.Set("User-Agent", "test-agent/1.0")
	req.RemoteAddr = "9.9.9.9:12345"
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if len(ar.logs) != 1 {
		t.Fatalf("expected 1 audit entry, got %d", len(ar.logs))
	}
	e := ar.logs[0]
	if e.UserID != "user-1" {
		t.Errorf("user_id = %q", e.UserID)
	}
	if e.TenantID != "tenant-1" {
		t.Errorf("tenant_id = %q", e.TenantID)
	}
	if e.Action != "items.create" {
		t.Errorf("action = %q, want items.create", e.Action)
	}
	if e.Resource != "items" {
		t.Errorf("resource = %q", e.Resource)
	}
	if e.StatusCode != http.StatusCreated {
		t.Errorf("status = %d", e.StatusCode)
	}
	if e.IP != "9.9.9.9" {
		t.Errorf("ip = %q", e.IP)
	}
	if e.UserAgent != "test-agent/1.0" {
		t.Errorf("user_agent = %q", e.UserAgent)
	}
}

func TestAudit_DeriveActionForAllMethods(t *testing.T) {
	cases := map[string]string{
		http.MethodPost:   "items.create",
		http.MethodPut:    "items.update",
		http.MethodPatch:  "items.update",
		http.MethodDelete: "items.delete",
	}
	for m, wantAction := range cases {
		ar := &memAudit{}
		r := chi.NewRouter()
		r.Use(Audit(ar))
		r.MethodFunc(m, "/api/items/{id}", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNoContent)
		})
		req := httptest.NewRequest(m, "/api/items/42", nil)
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		if len(ar.logs) != 1 || ar.logs[0].Action != wantAction {
			t.Errorf("method %s: action = %q, want %q", m, ar.logs[0].Action, wantAction)
		}
	}
}

func TestAudit_FailureDoesNotBlockResponse(t *testing.T) {
	// Audit repo that always errors. Middleware must log + continue.
	failing := &failingAudit{}
	r := chi.NewRouter()
	r.Use(Audit(failing))
	r.Post("/api/items", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	})

	req := httptest.NewRequest(http.MethodPost, "/api/items", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusCreated {
		t.Errorf("status = %d, want 201 (audit failure must not affect response)", rec.Code)
	}
}

type failingAudit struct{}

func (failingAudit) Write(_ context.Context, _ *repo.AuditLog) error {
	return context.DeadlineExceeded
}
