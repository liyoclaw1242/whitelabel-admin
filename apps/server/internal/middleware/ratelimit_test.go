package middleware

import (
	"net/http"
	"net/http/httptest"
	"strconv"
	"testing"
	"time"
)

func TestLimiter_Allow_WithinWindow(t *testing.T) {
	l := NewLimiter(3, 1*time.Minute)
	for i := 0; i < 3; i++ {
		ok, _ := l.Allow("k")
		if !ok {
			t.Fatalf("hit %d denied, expected allowed", i)
		}
	}
	ok, retry := l.Allow("k")
	if ok {
		t.Fatal("4th hit allowed, expected denied")
	}
	if retry <= 0 {
		t.Errorf("retry = %v, want > 0", retry)
	}
}

func TestLimiter_PerIP_429WithRetryAfter(t *testing.T) {
	l := NewLimiter(1, 1*time.Minute)
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	h := l.PerIP(next)

	req1 := httptest.NewRequest(http.MethodGet, "/api/x", nil)
	req1.RemoteAddr = "1.1.1.1:9999"
	rec1 := httptest.NewRecorder()
	h.ServeHTTP(rec1, req1)
	if rec1.Code != http.StatusOK {
		t.Fatalf("first hit status = %d, want 200", rec1.Code)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/api/x", nil)
	req2.RemoteAddr = "1.1.1.1:9999"
	rec2 := httptest.NewRecorder()
	h.ServeHTTP(rec2, req2)
	if rec2.Code != http.StatusTooManyRequests {
		t.Fatalf("second hit status = %d, want 429", rec2.Code)
	}
	ra := rec2.Header().Get("Retry-After")
	if n, err := strconv.Atoi(ra); err != nil || n < 1 {
		t.Errorf("Retry-After = %q, want >=1 integer", ra)
	}
	if rec2.Header().Get("Content-Type") != "application/problem+json" {
		t.Errorf("Content-Type = %q", rec2.Header().Get("Content-Type"))
	}
}

func TestLimiter_SeparateKeysDoNotShare(t *testing.T) {
	l := NewLimiter(1, 1*time.Minute)
	if ok, _ := l.Allow("a"); !ok {
		t.Fatal("first 'a' denied")
	}
	if ok, _ := l.Allow("b"); !ok {
		t.Fatal("first 'b' denied")
	}
}

func TestClientIP_XForwardedFor(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Forwarded-For", "9.9.9.9, 10.0.0.1")
	req.RemoteAddr = "127.0.0.1:5555"
	if got := ClientIP(req); got != "9.9.9.9" {
		t.Errorf("ClientIP = %q, want 9.9.9.9", got)
	}
}

func TestClientIP_FallsBackToRemoteAddr(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.RemoteAddr = "8.8.8.8:12345"
	if got := ClientIP(req); got != "8.8.8.8" {
		t.Errorf("ClientIP = %q, want 8.8.8.8", got)
	}
}
