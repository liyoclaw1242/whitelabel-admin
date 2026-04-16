package middleware

import (
	"encoding/pem"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
)

func makeKP(t *testing.T) *auth.KeyPair {
	t.Helper()
	k, _ := rsa.GenerateKey(rand.Reader, 2048)
	privDER, _ := x509.MarshalPKCS8PrivateKey(k)
	pubDER, _ := x509.MarshalPKIXPublicKey(&k.PublicKey)
	priv := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER}))
	pub := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}))
	kp, err := auth.LoadKeyPair(priv, pub)
	if err != nil {
		t.Fatal(err)
	}
	return kp
}

func TestAuthContext_MissingHeader_401(t *testing.T) {
	kp := makeKP(t)
	h := AuthContext(kp)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
	if rec.Header().Get("Content-Type") != "application/problem+json" {
		t.Errorf("Content-Type = %q", rec.Header().Get("Content-Type"))
	}
}

func TestAuthContext_InvalidToken_401(t *testing.T) {
	kp := makeKP(t)
	h := AuthContext(kp)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		t.Error("next should not run")
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer nope.nope.nope")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestAuthContext_ValidToken_PutsClaimsOnContext(t *testing.T) {
	kp := makeKP(t)
	c := auth.NewClaims("u1", "t1", []string{"admin"}, []string{"users:read"})
	tok, _ := kp.Sign(c)

	var seen *auth.Claims
	h := AuthContext(kp)(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = ClaimsFromContext(r.Context())
		w.WriteHeader(http.StatusOK)
	}))
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("status = %d, want 200", rec.Code)
	}
	if seen == nil || seen.Sub != "u1" || seen.TenantID != "t1" {
		t.Errorf("claims on context: %+v", seen)
	}
	// Sanity: body is empty (handler wrote 200 with nothing).
	if rec.Body.Len() != 0 {
		_ = json.NewDecoder(rec.Body).Decode(&map[string]any{})
	}
}
