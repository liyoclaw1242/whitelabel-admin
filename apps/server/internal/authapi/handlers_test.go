package authapi

import (
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/middleware"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo/memory"
)

func setup(t *testing.T) (*Handlers, *chi.Mux, *auth.KeyPair) {
	t.Helper()
	k, _ := rsa.GenerateKey(rand.Reader, 2048)
	privDER, _ := x509.MarshalPKCS8PrivateKey(k)
	pubDER, _ := x509.MarshalPKIXPublicKey(&k.PublicKey)
	priv := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER}))
	pub := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}))
	kp, _ := auth.LoadKeyPair(priv, pub)

	users, _ := memory.NewUserRepo()
	h := &Handlers{
		KP:        kp,
		Users:     users,
		Blacklist: blacklist.NewMemory(),
		Limiter:   middleware.NewLimiter(100, time.Minute),
		CookieSec: false,
	}

	r := chi.NewRouter()
	h.Mount(r)
	// /me needs AuthContext mounted
	r.With(middleware.AuthContext(kp)).Get("/api/auth/me-authed", h.me)
	return h, r, kp
}

func postJSON(r *chi.Mux, path string, body any) *httptest.ResponseRecorder {
	buf, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, path, bytes.NewReader(buf))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	return rec
}

func TestLogin_HappyPath(t *testing.T) {
	_, r, _ := setup(t)
	rec := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "password"})
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body=%s", rec.Code, rec.Body.String())
	}
	var resp loginResp
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.AccessToken == "" {
		t.Error("empty access_token")
	}
	if resp.User.Email != "admin@test" {
		t.Errorf("user.email = %q", resp.User.Email)
	}

	// Check refresh cookie flags.
	ck := rec.Result().Cookies()
	if len(ck) != 1 || ck[0].Name != RefreshCookieName {
		t.Fatalf("expected 1 refresh cookie, got %+v", ck)
	}
	c := ck[0]
	if !c.HttpOnly {
		t.Error("cookie HttpOnly = false")
	}
	if c.SameSite != http.SameSiteLaxMode {
		t.Errorf("cookie SameSite = %v, want Lax", c.SameSite)
	}
	if c.Path != "/api/auth" {
		t.Errorf("cookie Path = %q, want /api/auth", c.Path)
	}
}

func TestLogin_WrongPassword_Uniform401(t *testing.T) {
	_, r, _ := setup(t)
	rec := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "wrong"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
	var p map[string]any
	_ = json.NewDecoder(rec.Body).Decode(&p)
	if !strings.Contains(rec.Body.String()+"invalid credentials", "invalid credentials") {
		t.Errorf("expected uniform 'invalid credentials' detail")
	}
}

func TestLogin_UnknownEmail_Uniform401(t *testing.T) {
	_, r, _ := setup(t)
	rec := postJSON(r, "/api/auth/login", loginReq{Email: "nope@test", Password: "password"})
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want 401", rec.Code)
	}
}

func TestLogin_MissingFields_422(t *testing.T) {
	_, r, _ := setup(t)
	rec := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test"})
	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("status = %d, want 422", rec.Code)
	}
}

func TestLogin_InvalidJSON_422(t *testing.T) {
	_, r, _ := setup(t)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/login", bytes.NewReader([]byte("not-json")))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("status = %d, want 422", rec.Code)
	}
}

func TestLogin_RateLimit_429(t *testing.T) {
	k, _ := rsa.GenerateKey(rand.Reader, 2048)
	privDER, _ := x509.MarshalPKCS8PrivateKey(k)
	pubDER, _ := x509.MarshalPKIXPublicKey(&k.PublicKey)
	priv := string(pem.EncodeToMemory(&pem.Block{Type: "PRIVATE KEY", Bytes: privDER}))
	pub := string(pem.EncodeToMemory(&pem.Block{Type: "PUBLIC KEY", Bytes: pubDER}))
	kp, _ := auth.LoadKeyPair(priv, pub)
	users, _ := memory.NewUserRepo()

	h := &Handlers{
		KP: kp, Users: users, Blacklist: blacklist.NewMemory(),
		Limiter: middleware.NewLimiter(2, time.Minute), CookieSec: false,
	}
	r := chi.NewRouter()
	h.Mount(r)

	// 2 allowed, 3rd should be 429.
	for i := 0; i < 2; i++ {
		rec := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "password"})
		if rec.Code != http.StatusOK {
			t.Fatalf("hit %d status = %d", i, rec.Code)
		}
	}
	rec := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "password"})
	if rec.Code != http.StatusTooManyRequests {
		t.Errorf("status = %d, want 429", rec.Code)
	}
	if rec.Header().Get("Retry-After") == "" {
		t.Error("missing Retry-After")
	}
}

func TestRefresh_HappyPath_RotatesCookie(t *testing.T) {
	_, r, _ := setup(t)
	login := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "password"})
	cookie := login.Result().Cookies()[0]

	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.AddCookie(cookie)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body=%s", rec.Code, rec.Body.String())
	}
	var resp refreshResp
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.AccessToken == "" {
		t.Error("empty access_token")
	}
	// Must return a new refresh cookie distinct from the old.
	new := rec.Result().Cookies()
	if len(new) != 1 {
		t.Fatalf("expected 1 rotated cookie, got %d", len(new))
	}
	if new[0].Value == cookie.Value {
		t.Error("refresh cookie was not rotated")
	}
}

func TestRefresh_AfterLogout_401(t *testing.T) {
	_, r, _ := setup(t)
	login := postJSON(r, "/api/auth/login", loginReq{Email: "admin@test", Password: "password"})
	cookie := login.Result().Cookies()[0]

	// Logout revokes the refresh JTI.
	reqLogout := httptest.NewRequest(http.MethodPost, "/api/auth/logout", nil)
	reqLogout.AddCookie(cookie)
	recLogout := httptest.NewRecorder()
	r.ServeHTTP(recLogout, reqLogout)
	if recLogout.Code != http.StatusNoContent {
		t.Fatalf("logout status = %d", recLogout.Code)
	}

	// Now try refresh with the revoked cookie.
	reqR := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	reqR.AddCookie(cookie)
	recR := httptest.NewRecorder()
	r.ServeHTTP(recR, reqR)
	if recR.Code != http.StatusUnauthorized {
		t.Errorf("refresh-after-logout status = %d, want 401", recR.Code)
	}
}

func TestRefresh_MissingCookie_401(t *testing.T) {
	_, r, _ := setup(t)
	rec := postJSON(r, "/api/auth/refresh", nil)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestMe_HappyPath(t *testing.T) {
	_, r, kp := setup(t)
	c := auth.NewClaims("user-admin", "tenant-1", []string{"admin"}, []string{"users:read", "users:write", "items:read", "items:write", "audit:read"})
	tok, _ := kp.Sign(c)
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me-authed", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, body=%s", rec.Code, rec.Body.String())
	}
	var resp meResp
	_ = json.NewDecoder(rec.Body).Decode(&resp)
	if resp.User.Email != "admin@test" {
		t.Errorf("user.email = %q", resp.User.Email)
	}
	if resp.TenantID != "tenant-1" {
		t.Errorf("tenant_id = %q", resp.TenantID)
	}
}

func TestIntegration_LoginThenMe(t *testing.T) {
	_, r, _ := setup(t)

	login := postJSON(r, "/api/auth/login", loginReq{Email: "editor@test", Password: "password"})
	if login.Code != http.StatusOK {
		t.Fatalf("login %d: %s", login.Code, login.Body.String())
	}
	var loginR loginResp
	_ = json.NewDecoder(login.Body).Decode(&loginR)

	req := httptest.NewRequest(http.MethodGet, "/api/auth/me-authed", nil)
	req.Header.Set("Authorization", "Bearer "+loginR.AccessToken)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("me status = %d", rec.Code)
	}
}

func TestMeHandler_AccessorReturnsFunction(t *testing.T) {
	h, _, _ := setup(t)
	if h.MeHandler() == nil {
		t.Error("MeHandler returned nil")
	}
}

func TestMe_UserDeletedBetweenLoginAndMe_401(t *testing.T) {
	_, r, kp := setup(t)
	c := auth.NewClaims("user-ghost", "tenant-1", []string{"admin"}, []string{"users:read", "users:write", "items:read", "items:write", "audit:read"})
	tok, _ := kp.Sign(c)
	req := httptest.NewRequest(http.MethodGet, "/api/auth/me-authed", nil)
	req.Header.Set("Authorization", "Bearer "+tok)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestRefresh_InvalidCookieValue_401(t *testing.T) {
	_, r, _ := setup(t)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: RefreshCookieName, Value: "not-a-jwt"})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}

func TestRefresh_UserDeletedBeforeRefresh_401(t *testing.T) {
	_, r, kp := setup(t)
	rc := auth.NewRefreshClaims("user-ghost", "tenant-1")
	tok, _ := kp.SignRefresh(rc)
	req := httptest.NewRequest(http.MethodPost, "/api/auth/refresh", nil)
	req.AddCookie(&http.Cookie{Name: RefreshCookieName, Value: tok})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Errorf("status = %d, want 401", rec.Code)
	}
}
