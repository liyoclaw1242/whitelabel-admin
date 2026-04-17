// Package authapi implements the /api/auth/* HTTP endpoints.
package authapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/auth"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/blacklist"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/middleware"
	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/repo"
)

// RefreshCookieName is the HttpOnly cookie carrying the refresh JWT.
const RefreshCookieName = "whitelabel_refresh"

// loginRateKey builds a Limiter key for per-IP+email login.
func loginRateKey(ip, email string) string { return "login:" + ip + "|" + email }

// Handlers wires the four auth endpoints against the stores provided.
type Handlers struct {
	KP        *auth.KeyPair
	Users     repo.UserRepo
	Blacklist blacklist.Store
	Limiter   *middleware.Limiter // per-IP + per-email login limiter
	CookieSec bool                // set Secure flag on refresh cookie (false in local dev)
}

// Mount attaches the unauthenticated endpoints (login/refresh/logout) to mux.
// /api/auth/me must be mounted separately under AuthContext — use MeHandler.
func (h *Handlers) Mount(mux interface {
	Post(pattern string, fn http.HandlerFunc)
}) {
	mux.Post("/api/auth/login", h.login)
	mux.Post("/api/auth/refresh", h.refresh)
	mux.Post("/api/auth/logout", h.logout)
}

// MeHandler returns the /api/auth/me handler so the router can wrap it in
// AuthContext (Bearer-token required).
func (h *Handlers) MeHandler() http.HandlerFunc { return h.me }

// ----- Login -----

type loginReq struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userOut struct {
	ID          string   `json:"id"`
	Email       string   `json:"email"`
	Name        string   `json:"name"`
	TenantID    string   `json:"tenant_id"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
}

type loginResp struct {
	AccessToken     string  `json:"access_token"`
	AccessExpiresIn int     `json:"access_expires_in"`
	User            userOut `json:"user"`
}

func (h *Handlers) login(w http.ResponseWriter, r *http.Request) {
	var req loginReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httperr.WriteFor(w, r, httperr.Validation(map[string]string{"body": "invalid JSON"}))
		return
	}
	if req.Email == "" || req.Password == "" {
		httperr.WriteFor(w, r, httperr.Validation(map[string]string{"email": "required", "password": "required"}))
		return
	}

	// Per-IP + per-email rate limit BEFORE DB lookup so attackers can't
	// probe existence via timing.
	ip := middleware.ClientIP(r)
	if ok, retry := h.Limiter.Allow(loginRateKey(ip, req.Email)); !ok {
		middleware.WriteTooMany(w, r, retry)
		return
	}

	// Uniform error — never reveal whether user exists.
	invalid := httperr.Unauthorized("invalid credentials")

	u, err := h.Users.FindByEmail(r.Context(), req.Email)
	if err != nil {
		// Still burn bcrypt time to equalise timings.
		_ = bcrypt.CompareHashAndPassword([]byte("$2a$10$dummydummydummydummydummydummydummydummydummydummydu"), []byte(req.Password))
		httperr.WriteFor(w, r, invalid)
		return
	}
	if err := bcrypt.CompareHashAndPassword(u.PasswordHash, []byte(req.Password)); err != nil {
		httperr.WriteFor(w, r, invalid)
		return
	}

	access := auth.NewClaims(u.ID, u.TenantID, u.Roles, u.Permissions)
	accessTok, err := h.KP.Sign(access)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Internal(err))
		return
	}

	refresh := auth.NewRefreshClaims(u.ID, u.TenantID)
	refreshTok, err := h.KP.SignRefresh(refresh)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Internal(err))
		return
	}

	h.writeRefreshCookie(w, refreshTok, time.Unix(refresh.EXP, 0))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(loginResp{
		AccessToken:     accessTok,
		AccessExpiresIn: int(auth.ExpDuration.Seconds()),
		User:            userOutOf(u),
	})
}

// ----- Refresh -----

type refreshResp struct {
	AccessToken     string `json:"access_token"`
	AccessExpiresIn int    `json:"access_expires_in"`
}

func (h *Handlers) refresh(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(RefreshCookieName)
	if err != nil || c.Value == "" {
		httperr.WriteFor(w, r, httperr.Unauthorized("missing refresh cookie"))
		return
	}
	claims, err := h.KP.VerifyRefresh(c.Value)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Unauthorized("invalid or expired refresh token"))
		return
	}
	if revoked, _ := h.Blacklist.Contains(r.Context(), claims.JTI); revoked {
		httperr.WriteFor(w, r, httperr.Unauthorized("refresh token revoked"))
		return
	}

	u, err := h.Users.FindByID(r.Context(), claims.Sub)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Unauthorized("user not found"))
		return
	}

	// Rotate: revoke old JTI, issue new refresh cookie.
	_ = h.Blacklist.Add(r.Context(), claims.JTI, time.Unix(claims.EXP, 0))

	newRefresh := auth.NewRefreshClaims(u.ID, u.TenantID)
	newRefreshTok, err := h.KP.SignRefresh(newRefresh)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Internal(err))
		return
	}

	access := auth.NewClaims(u.ID, u.TenantID, u.Roles, u.Permissions)
	accessTok, err := h.KP.Sign(access)
	if err != nil {
		httperr.WriteFor(w, r, httperr.Internal(err))
		return
	}

	h.writeRefreshCookie(w, newRefreshTok, time.Unix(newRefresh.EXP, 0))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(refreshResp{
		AccessToken:     accessTok,
		AccessExpiresIn: int(auth.ExpDuration.Seconds()),
	})
}

// ----- Logout -----

func (h *Handlers) logout(w http.ResponseWriter, r *http.Request) {
	c, err := r.Cookie(RefreshCookieName)
	if err == nil && c.Value != "" {
		if claims, err := h.KP.VerifyRefresh(c.Value); err == nil {
			_ = h.Blacklist.Add(r.Context(), claims.JTI, time.Unix(claims.EXP, 0))
		}
	}
	// Always clear the cookie client-side.
	h.clearRefreshCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

// ----- Me -----

type meResp struct {
	User        userOut  `json:"user"`
	Roles       []string `json:"roles"`
	Permissions []string `json:"permissions"`
	TenantID    string   `json:"tenant_id"`
}

func (h *Handlers) me(w http.ResponseWriter, r *http.Request) {
	c := middleware.ClaimsFromContext(r.Context())
	if c == nil {
		httperr.WriteFor(w, r, httperr.Unauthorized("missing claims"))
		return
	}
	u, err := h.Users.FindByID(r.Context(), c.Sub)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			httperr.WriteFor(w, r, httperr.Unauthorized("user not found"))
			return
		}
		httperr.WriteFor(w, r, httperr.Internal(err))
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(meResp{
		User:        userOutOf(u),
		Roles:       c.Roles,
		Permissions: c.Permissions,
		TenantID:    c.TenantID,
	})
}

// ----- helpers -----

func (h *Handlers) writeRefreshCookie(w http.ResponseWriter, tok string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    tok,
		Path:     "/api/auth",
		Expires:  expires,
		HttpOnly: true,
		Secure:   h.CookieSec,
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handlers) clearRefreshCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     RefreshCookieName,
		Value:    "",
		Path:     "/api/auth",
		Expires:  time.Unix(0, 0),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   h.CookieSec,
		SameSite: http.SameSiteLaxMode,
	})
}

func userOutOf(u *repo.User) userOut {
	return userOut{
		ID: u.ID, Email: u.Email, Name: u.Name,
		TenantID: u.TenantID, Roles: u.Roles, Permissions: u.Permissions,
	}
}
