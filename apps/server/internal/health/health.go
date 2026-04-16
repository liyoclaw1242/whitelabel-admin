// Package health provides the /api/health endpoint.
package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
)

const pingTimeout = 2 * time.Second

// Pinger is the minimal surface from *sql.DB we need.
type Pinger interface {
	PingContext(ctx context.Context) error
}

// Handler returns the /api/health handler. It pings the DB with a 2s timeout.
// Success → 200 application/json; failure → 503 application/problem+json.
func Handler(db Pinger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), pingTimeout)
		defer cancel()

		if err := db.PingContext(ctx); err != nil {
			p := httperr.Problem{
				Type:   "about:blank",
				Title:  "Service Unavailable",
				Status: http.StatusServiceUnavailable,
				Detail: "Database is unreachable.",
			}
			httperr.WriteFor(w, r, &p)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"db":     "connected",
		})
	}
}
