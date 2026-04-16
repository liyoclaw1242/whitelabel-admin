package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
)

func TestTenant_PutsIDOnContext(t *testing.T) {
	c := auth.NewClaims("u", "tenant-acme", []string{"admin"}, nil)
	var seen string
	h := Tenant(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id, ok := TenantIDFromContext(r.Context())
		if !ok {
			t.Error("tenant id not on context")
		}
		seen = id
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/x", nil).WithContext(WithClaims(context.Background(), &c))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if seen != "tenant-acme" {
		t.Errorf("seen = %q, want tenant-acme", seen)
	}
}

func TestTenant_NoClaims_401(t *testing.T) {
	h := Tenant(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/x", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestTenant_NoTenantID_403(t *testing.T) {
	c := auth.NewClaims("u", "", []string{"admin"}, nil)
	h := Tenant(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/x", nil).WithContext(WithClaims(context.Background(), &c))
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Errorf("status = %d, want 403", rec.Code)
	}
}
