package main

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// stubPinger implements the pinger interface for testing.
type stubPinger struct {
	err error
}

func (s *stubPinger) Ping() error { return s.err }

func TestHealthHandler_DBConnected(t *testing.T) {
	handler := healthHandler(&stubPinger{err: nil})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("expected status=ok, got %q", body["status"])
	}
	if body["db"] != "connected" {
		t.Errorf("expected db=connected, got %q", body["db"])
	}
}

func TestLoggingMiddleware(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	slog.SetDefault(logger)

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := loggingMiddleware(inner)
	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	logOutput := buf.String()
	for _, want := range []string{`"method":"GET"`, `"path":"/api/health"`, `"status":200`} {
		if !strings.Contains(logOutput, want) {
			t.Errorf("log missing %s, got: %s", want, logOutput)
		}
	}
}

func TestLoggingMiddleware_CapturesStatus(t *testing.T) {
	var buf bytes.Buffer
	logger := slog.New(slog.NewJSONHandler(&buf, nil))
	slog.SetDefault(logger)

	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	})

	handler := loggingMiddleware(inner)
	req := httptest.NewRequest(http.MethodPost, "/missing", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	logOutput := buf.String()
	if !strings.Contains(logOutput, `"status":404`) {
		t.Errorf("expected status 404 in log, got: %s", logOutput)
	}
}

func TestHealthHandler_DBDisconnected(t *testing.T) {
	handler := healthHandler(&stubPinger{err: errDBDown})

	req := httptest.NewRequest(http.MethodGet, "/api/health", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", rec.Code)
	}

	var body map[string]string
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("invalid JSON: %v", err)
	}
	if body["status"] != "error" {
		t.Errorf("expected status=error, got %q", body["status"])
	}
	if body["db"] != "disconnected" {
		t.Errorf("expected db=disconnected, got %q", body["db"])
	}
}
