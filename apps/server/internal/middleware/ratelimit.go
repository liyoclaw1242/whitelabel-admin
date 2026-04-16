package middleware

import (
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
)

// bucket is a very small fixed-window counter keyed by some identifier.
// Zero-value is usable.
type bucket struct {
	mu     sync.Mutex
	count  int
	window time.Time
}

// Limiter is a fixed-window, in-memory rate limiter. TODO(#N_KV): swap to
// Cloudflare KV when #138 lands so preview + prod can share counters.
type Limiter struct {
	perWindow int
	window    time.Duration
	buckets   sync.Map // map[string]*bucket
}

// NewLimiter returns a Limiter that allows perWindow hits per window per key.
func NewLimiter(perWindow int, window time.Duration) *Limiter {
	return &Limiter{perWindow: perWindow, window: window}
}

// allow atomically increments the counter for key; returns (ok, retryAfter).
func (l *Limiter) allow(key string, now time.Time) (bool, time.Duration) {
	v, _ := l.buckets.LoadOrStore(key, &bucket{})
	b := v.(*bucket)

	b.mu.Lock()
	defer b.mu.Unlock()

	if now.After(b.window) {
		b.count = 0
		b.window = now.Add(l.window)
	}
	if b.count >= l.perWindow {
		return false, time.Until(b.window)
	}
	b.count++
	return true, 0
}

// ClientIP extracts the client IP, honouring the first entry in
// X-Forwarded-For when present (Vercel / CDN proxy). Exported so handlers
// can key bespoke limiters (e.g. per-email on login).
func ClientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if i := strings.Index(xff, ","); i >= 0 {
			return strings.TrimSpace(xff[:i])
		}
		return strings.TrimSpace(xff)
	}
	// RemoteAddr is "host:port".
	if i := strings.LastIndex(r.RemoteAddr, ":"); i >= 0 {
		return r.RemoteAddr[:i]
	}
	return r.RemoteAddr
}

// PerIP returns middleware that rate-limits per client IP.
func (l *Limiter) PerIP(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ok, retry := l.allow("ip:"+ClientIP(r), time.Now())
		if !ok {
			tooMany(w, r, retry)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Allow records a hit under the composite key (caller-supplied, e.g.
// "email:alice@test") and returns (ok, retryAfter). Handlers that want
// two-dimensional limiting (IP + email) call this directly.
func (l *Limiter) Allow(key string) (bool, time.Duration) {
	return l.allow(key, time.Now())
}

// tooMany writes 429 + Retry-After + RFC 7807 body.
func tooMany(w http.ResponseWriter, r *http.Request, retry time.Duration) {
	secs := int(retry.Seconds())
	if secs < 1 {
		secs = 1
	}
	w.Header().Set("Retry-After", strconv.Itoa(secs))
	p := &httperr.Problem{
		Type:   "about:blank",
		Title:  "Too Many Requests",
		Status: http.StatusTooManyRequests,
		Detail: "Rate limit exceeded. Retry after " + strconv.Itoa(secs) + "s.",
	}
	httperr.WriteFor(w, r, p)
}

// WriteTooMany exposes the 429-writing helper so handlers can emit it after
// a custom allow() call.
func WriteTooMany(w http.ResponseWriter, r *http.Request, retry time.Duration) {
	tooMany(w, r, retry)
}
