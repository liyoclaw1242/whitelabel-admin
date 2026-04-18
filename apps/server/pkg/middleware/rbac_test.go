package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/pkg/auth"
)

func TestRequirePermission_Pass(t *testing.T) {
	c := auth.NewClaims("u", "t", []string{"admin"}, []string{"users:read"})
	h := RequirePermission("users:read")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/users", nil).WithContext(WithClaims(context.Background(), &c))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
}

func TestRequirePermission_Missing_403(t *testing.T) {
	c := auth.NewClaims("u", "t", []string{"viewer"}, []string{"items:read"})
	h := RequirePermission("users:write")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodPost, "/api/users", nil).WithContext(WithClaims(context.Background(), &c))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", rec.Code)
	}
}

func TestRequirePermission_NoClaims_401(t *testing.T) {
	h := RequirePermission("any")(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/x", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}
