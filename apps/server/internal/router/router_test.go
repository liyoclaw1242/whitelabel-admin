package router

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo/memory"
)

type stubPinger struct{ err error }

func (s *stubPinger) PingContext(ctx context.Context) error { return s.err }

func TestNew_ServesHealthEndpoint(t *testing.T) {
	r := New(&stubPinger{err: nil})
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decode: %v", err)
	}
	if body["status"] != "ok" || body["db"] != "connected" {
		t.Errorf("body = %+v", body)
	}
}

func TestNew_ServesHealthEndpoint_NotConfigured(t *testing.T) {
	r := New(nil)
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want 503", rec.Code)
	}
}

func TestNew_UnknownRoute_404(t *testing.T) {
	r := New(&stubPinger{err: nil})
	req := httptest.NewRequest(http.MethodGet, "/api/nope", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("status = %d, want 404", rec.Code)
	}
}

func TestNewWithDeps_MountsAuthEndpoints(t *testing.T) {
	k, _ := rsa.GenerateKey(rand.Reader, 2048)
	privDER, _ := x509.MarshalPKCS8PrivateKey(k)
	pubDER, _ := x509.MarshalPKIXPublicKey(&k.PublicKey)
	priv := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER}))
	pub := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}))
	kp, _ := auth.LoadKeyPair(priv, pub)
	users, _ := memory.NewUserRepo()

	r := NewWithDeps(Deps{
		DB:        &stubPinger{err: nil},
		KP:        kp,
		Users:     users,
		Blacklist: blacklist.NewMemory(),
	})

	// POST /api/auth/login should exist (and succeed with seeded creds).
	body, _ := json.Marshal(map[string]string{"email": "admin@test", "password": "password"})
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Errorf("login status = %d, body=%s", rec.Code, rec.Body.String())
	}

	// GET /api/auth/me WITHOUT bearer → 401 (AuthContext catches it).
	reqMe := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	recMe := httptest.NewRecorder()
	r.ServeHTTP(recMe, reqMe)
	if recMe.Code != http.StatusUnauthorized {
		t.Errorf("me (no bearer) status = %d, want 401", recMe.Code)
	}
}

func TestNewWithDeps_AuthDisabledWhenKeysMissing(t *testing.T) {
	r := NewWithDeps(Deps{DB: &stubPinger{err: nil}})

	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Errorf("status = %d, want 404 when auth deps missing", rec.Code)
	}
}
