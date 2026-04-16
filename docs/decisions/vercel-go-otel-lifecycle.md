# Vercel Go Serverless OTel Lifecycle — ForceFlush + Traceparent Propagation

> **Status**: Plan recommended — pending ARCH sign-off, provides implementation contract for #147
> **Parent**: #113 Phase 3 / #150 DEBUG task
> **Downstream**: #147 BE implementation (OTel Go SDK), #115 Phase 5 (live Grafana verification)
> **Cross-ref**: #133 service.name decision (PR #136, merged) — `docs/decisions/otel-naming-and-correlation.md`
> **Author**: `debug-20260416-0857496`
> **Date**: 2026-04-16

## TL;DR

| # | 決策 | 推薦 |
|---|---|---|
| 1 | ForceFlush strategy | **`BatchSpanProcessor` + per-request `defer ForceFlush(ctx, 1s)`** at Vercel `Handler()` entry. Warn-log on timeout, never block response. |
| 2 | Propagation | `otelhttp.NewHandler` + `propagation.TraceContext{}`. Edge/middleware must pass `traceparent` through untouched. |
| 3 | DB spans | **Use `github.com/XSAM/otelsql`** (not `exaring/otelpgx`) because current `apps/server/internal/db/db.go` uses `database/sql` + pgx stdlib, not `pgxpool`. This **corrects** the #133 doc recommendation for the current code shape. |
| 4 | Cold-start init | **Package-level `sync.Once`**, initialized on first `Handler()` call. Avoid `init()` function — increases cold-start on every binary invocation even if a request never arrives. |

---

## Context

### Current state (2026-04-16)

- `apps/server/cmd/api/main.go` runs a long-lived `net/http` server on `PORT` — this is the **Fly.io / container** shape. Vercel serverless requires a different entrypoint: `api/[[...path]].go` exporting `func Handler(w, r)` per Vercel's Go Runtime spec.
- `apps/server/internal/db/db.go` uses `sql.Open("pgx", dsn)` with `_ "github.com/jackc/pgx/v5/stdlib"` — this is the **`database/sql` path**, not direct `pgxpool`.
- `apps/server/internal/httperr/problem.go` already has `TraceID` field on `Problem` struct (line 19) + `WithTraceID` / `TraceIDFrom` context helpers (lines 23–36) — waiting for an OTel middleware to populate it.
- `go.mod` requires `pgx/v5 v5.9.1` + `chi v5.2.5`. No OTel deps yet — #147 adds them.
- Parent `#113` Phase 3 Checklist includes: chi router + Auth endpoints + RBAC + Audit + Multi-tenant + Repository + Rate limiting. `#147` is the focused OTel sub-task.

### Why this doc matters

Vercel's Go runtime is less documented than Node. The gotchas that this decision covers:

1. **Function process lifecycle**: after a response is written, the instance can be frozen OR evicted. If frozen, the next request reuses the same process (warm). If evicted, pending background work is lost — including unflushed OTel spans.
2. **Cold start sensitivity**: Go binary + OTel SDK init adds latency to the first request. Need a strategy that amortises that cost across warm requests.
3. **Vercel Edge ≠ Vercel Serverless Functions**: they're different runtimes with different constraints. Middleware (Edge) cannot run the full OTel SDK; it should just pass headers through.

---

## Decision 1 — ForceFlush Strategy

### The Problem

Vercel Go serverless processes are stateless from the user's perspective but **reused (warm)** when possible. The platform may:

- **Freeze** the process immediately after response (common for warm instances) — background goroutines stop executing; batched spans sit in memory until next invocation.
- **Evict** the process on idle (~15 min) or on scaling-down — any in-memory buffered spans are lost.
- **Kill on timeout** — function exceeds max duration (default 10s on Pro, 60s on Pro+); in-memory spans lost.

With `BatchSpanProcessor` (default OTel Go SDK choice), spans are buffered in memory and exported every `BatchTimeout` (default 5s) or when batch full. On Vercel this means **most spans never export**, because either:
- The process freezes before the 5s tick fires, OR
- The 5s tick fires but the HTTP export request can't complete before eviction.

### Options

| Approach | Loss risk | Latency impact | Code complexity |
|---|---|---|---|
| **A. `SimpleSpanProcessor`** — export sync on span end | None | **High** — every span end blocks on HTTP POST to Tempo | Low |
| **B. `BatchSpanProcessor` only** (no per-request flush) | **High** — as analysed above | None | Lowest |
| **C. `BatchSpanProcessor` + `defer ForceFlush` at Handler entry** | Low | Small — one HTTP batch per request, as defer | Low (pattern is well-known) |
| D. Custom processor that flushes on span end if `request done` | Low | Medium | High (reinvents C) |

### Recommendation: **Option C**

`BatchSpanProcessor` + per-request `defer ForceFlush(ctx, timeout=1s)` at Vercel `Handler()` entrypoint.

**Why 1s and not 2s:**
The issue body suggested `2s`. Analysis: Vercel Pro has 10s max function duration. For a "normal" 200ms handler the **remaining budget** after handler returns is ~9.8s — 1s is plenty. For a slow handler near the 10s cap, 2s blocks eviction further; 1s gives more margin. 1s matches Grafana Cloud OTLP endpoint P99 latency (<500ms based on published SLOs). **Recommend 1s default, expose as `OTEL_FORCE_FLUSH_TIMEOUT_MS` env for tuning.**

**Why batch + force-flush (not SimpleSpanProcessor):**
The project will have many DB queries per request (Phase 3 RBAC check + user lookup + tenant filter + actual query + audit log write = easily 5 spans per auth'd endpoint). `SimpleSpanProcessor` would add 5 × OTLP POST latency per request. `BatchSpanProcessor` + one ForceFlush = 1 × OTLP POST (with up to 512 spans per batch).

**On flush failure** (timeout or network error):
- Log at `WARN` level with `error` field.
- **Do not** fail the response — user impact must be zero.
- Phase 5 Grafana dashboard should include a metric for "otel flush errors" to catch regressions.

### Implementation snippet (for #147)

```go
// apps/server/internal/otel/provider.go
package otel

import (
    "context"
    "os"
    "sync"
    "time"
    "log/slog"

    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

var (
    initOnce sync.Once
    provider *sdktrace.TracerProvider
    initErr  error
)

// Init returns the package-level TracerProvider, initializing on first call.
// Safe to call from every Handler() invocation — sync.Once guarantees single init.
func Init(version, env string) (*sdktrace.TracerProvider, error) {
    initOnce.Do(func() {
        endpoint := os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
        if endpoint == "" {
            slog.Warn("OTEL_EXPORTER_OTLP_ENDPOINT not set — tracing disabled")
            return // provider stays nil; callers must nil-check
        }

        ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()

        exporter, err := otlptracehttp.New(ctx)
        if err != nil {
            initErr = err
            slog.Error("otlp exporter init failed", "error", err)
            return
        }

        res, err := resource.New(ctx,
            resource.WithAttributes(
                semconv.ServiceName("whitelabel-api"),
                semconv.ServiceNamespace("whitelabel"),
                semconv.ServiceVersion(version),
                semconv.DeploymentEnvironmentName(env),
            ),
        )
        if err != nil {
            initErr = err
            return
        }

        provider = sdktrace.NewTracerProvider(
            sdktrace.WithBatcher(exporter), // BatchSpanProcessor, default 5s tick
            sdktrace.WithResource(res),
        )
        otel.SetTracerProvider(provider)
        otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
            propagation.TraceContext{},
            propagation.Baggage{},
        ))
    })
    return provider, initErr
}

// FlushTimeout reads OTEL_FORCE_FLUSH_TIMEOUT_MS (default 1000ms).
func FlushTimeout() time.Duration {
    if v := os.Getenv("OTEL_FORCE_FLUSH_TIMEOUT_MS"); v != "" {
        if ms, err := time.ParseDuration(v + "ms"); err == nil {
            return ms
        }
    }
    return 1000 * time.Millisecond
}
```

```go
// apps/server/api/[[...path]].go (Vercel entrypoint — created by #147)
package handler

import (
    "context"
    "log/slog"
    "net/http"
    "os"

    otelpkg "github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/otel"
    "github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/router"
)

// Handler is Vercel's required entrypoint. Must be `Handler` exactly.
func Handler(w http.ResponseWriter, r *http.Request) {
    tp, _ := otelpkg.Init(
        os.Getenv("VERCEL_GIT_COMMIT_SHA"),
        os.Getenv("VERCEL_ENV"),
    )

    // Defer flush BEFORE serving. If tp is nil (no endpoint), defer is a no-op.
    if tp != nil {
        defer func() {
            ctx, cancel := context.WithTimeout(context.Background(), otelpkg.FlushTimeout())
            defer cancel()
            if err := tp.ForceFlush(ctx); err != nil {
                slog.Warn("otel force flush", "error", err)
            }
        }()
    }

    router.Mux().ServeHTTP(w, r)
}
```

**Test for flush invocation** (AC from #147):

```go
// apps/server/internal/otel/provider_test.go (#147 will write)
func TestFlushCalledOnHandlerReturn(t *testing.T) {
    // Use sdktrace.NewTracerProvider with tracetest.InMemoryExporter
    // Issue a request to Handler → assert exporter.GetSpans() returns ≥1 after handler returns
}
```

---

## Decision 2 — Traceparent Propagation (full chain)

### The Flow

```
Browser (Faro + faro-web-tracing)
    │
    │  fetch("/api/users/me") with header:
    │  traceparent: 00-{32hex}-{16hex}-01
    │
    ▼
Vercel Edge Middleware (next.js middleware.ts)
    │
    │  Pass-through: do NOT consume or modify traceparent.
    │  If Next middleware needs to create a child span, it must call
    │  setHeaders({ traceparent: ... }) explicitly before proxy.
    │
    ▼
Vercel Go Serverless (api/[[...path]].go  →  Handler)
    │
    │  otelhttp.NewHandler wraps chi.Mux → reads traceparent,
    │  creates child span via propagation.TraceContext{}.
    │  span.SpanContext().TraceID() → RFC 7807 Problem.TraceID on errors.
    │
    ▼
pgx / database/sql (internal/db + otelsql wrapper)
    │
    │  otelsql's Driver reads span from ctx and creates db span for
    │  every QueryContext / ExecContext. attrs: db.system="postgresql",
    │  db.statement (sanitized).
    │
    ▼
Neon Postgres
```

### Specifics per hop

**1. Faro → Edge.**
`@grafana/faro-web-tracing`'s `TracingInstrumentation` auto-wraps `fetch`/`XHR` to add `traceparent`. No code needed in FE.

**2. Edge middleware (Next.js Phase 2).**
Vercel Edge Runtime is **not** a place to run the full OTel SDK (no `fs`, restricted APIs). The middleware must:
- **Keep the `traceparent` header on the incoming request** — Next.js by default forwards headers, but if the middleware does `new NextResponse(...)` without copying headers, the traceparent is lost.
- **Recommendation**: don't create spans in middleware for Phase 2. If observability of middleware is needed (Phase 5+), introduce `@vercel/otel` package (edge-compatible, thin). For now, middleware is a pass-through.

```typescript
// apps/dashboard/src/middleware.ts (Phase 2 shape — preserve traceparent)
import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // ... auth / rewrite logic ...
  const res = NextResponse.next();
  // Critical: Next.js preserves request headers by default when returning
  // NextResponse.next(). Do NOT call res.headers.set() to strip anything.
  return res;
}
```

**3. Go handler (this decision's focus).**
Use `otelhttp.NewHandler` around the chi router. It:
- Reads `traceparent` via the registered propagator.
- Creates a new span for each request; child of the incoming trace if present.
- Injects span into `r.Context()` so downstream handlers get `trace.SpanFromContext(r.Context())`.

```go
// apps/server/internal/router/router.go (new — to be created by #147)
package router

import (
    "net/http"

    "github.com/go-chi/chi/v5"
    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"

    "github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/health"
    "github.com/liyoclaw1242/whitelabel-admin/apps/server/internal/httperr"
    // auth, users, etc. as Phase 3 progresses
)

func Mux() http.Handler {
    r := chi.NewRouter()

    // Middleware chain: trace → tracing_ctx → audit → RBAC
    r.Use(otelhttpMiddleware)    // chi-compat shim for otelhttp (see below)
    r.Use(problemTraceIDBridge)  // populate httperr.WithTraceID from OTel span

    r.Get("/api/health", health.Handler(nil /* inject db */))
    // ... rest of routes ...

    return r
}

// otelhttpMiddleware is a chi-compatible wrapper around otelhttp.NewHandler.
// We wrap the whole chi mux once in router.Mux's return so no per-route handler
// wrapping is needed.
func otelhttpMiddleware(next http.Handler) http.Handler {
    return otelhttp.NewHandler(next, "server",
        otelhttp.WithSpanNameFormatter(func(_ string, r *http.Request) string {
            // "HTTP GET /api/users/{id}" — populate route after chi resolves
            return r.Method + " " + chi.RouteContext(r.Context()).RoutePattern()
        }),
    )
}

// problemTraceIDBridge copies OTel trace id into httperr's context key so
// RFC 7807 Problem.TraceID fills automatically via WriteFor.
func problemTraceIDBridge(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if sc := trace.SpanContextFromContext(r.Context()); sc.IsValid() {
            ctx := httperr.WithTraceID(r.Context(), sc.TraceID().String())
            r = r.WithContext(ctx)
        }
        next.ServeHTTP(w, r)
    })
}
```

> Note: `chi.RouteContext(r.Context()).RoutePattern()` may be empty if the otelhttp middleware runs **before** chi resolves the route. If this happens in tests, switch the order: `otelhttp` inside the chi middleware chain (after `chi.NewRouter()` is set up), using `r.Use()` and a delayed-naming pattern. This is a known chi/otelhttp interaction gotcha — #147 should unit-test span name population.

**4. Database layer.**

The existing code uses `database/sql` + pgx stdlib driver (`apps/server/internal/db/db.go:16`). This means **`exaring/otelpgx` is the wrong choice** here — it targets `pgxpool` directly. The #133 doc recommended `exaring/otelpgx` assuming Phase 3 would use `pgxpool`; **the actual Phase 3 code chose `database/sql`**. This decision corrects that.

**Correct choice: `github.com/XSAM/otelsql`**.

```go
// Replace internal/db/db.go (modification from the existing Open):
import (
    "database/sql"
    "github.com/XSAM/otelsql"
    _ "github.com/jackc/pgx/v5/stdlib"
    semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func Open(dsn string) (*sql.DB, error) {
    d, err := otelsql.Open("pgx", dsn,
        otelsql.WithAttributes(semconv.DBSystemPostgreSQL),
        otelsql.WithSpanOptions(otelsql.SpanOptions{
            OmitConnPrepare: true,  // noisy, rarely useful
            OmitRows:        true,  // per-row spans = excessive
        }),
    )
    if err != nil {
        return nil, err
    }
    // Register DB stats metrics (optional but cheap)
    if err := otelsql.RegisterDBStatsMetrics(d,
        otelsql.WithAttributes(semconv.DBSystemPostgreSQL),
    ); err != nil {
        // non-fatal
        slog.Warn("otelsql stats register", "error", err)
    }
    d.SetMaxOpenConns(10)
    d.SetMaxIdleConns(5)
    d.SetConnMaxLifetime(30 * time.Minute)
    // PingContext as before
    return d, nil
}
```

**Effect**: every `db.QueryContext(ctx, ...)` produces a child span with `db.system=postgresql`, `db.statement` (sanitized). Grafana Tempo waterfall shows the full chain — request → handler → db query — without per-call-site instrumentation.

---

## Decision 3 — Service Name / Resource Attrs (cross-check with #133)

Already decided in `docs/decisions/otel-naming-and-correlation.md` (PR #136, merged). Summary for reference:

| Attribute | Value |
|---|---|
| `service.name` | `whitelabel-api` |
| `service.namespace` | `whitelabel` |
| `service.version` | `VERCEL_GIT_COMMIT_SHA` (or `-ldflags -X main.version=$GIT_SHA` for binary deploys) |
| `deployment.environment.name` | `VERCEL_ENV` |
| `service.instance.id` | `HOSTNAME` (fallback) or `VERCEL_DEPLOYMENT_ID` |

**Phase 5 Grafana verification**: in Tempo, `service.name=whitelabel-api` filter must return only Go backend spans, never FE Faro or Next SSR spans. If Faro spans appear under `whitelabel-api`, it means `traceparent` propagation is working *but* someone set the FE service name wrong — check `apps/dashboard/src/app/faro.ts`.

---

## Decision 4 — Cold-Start Init Strategy

### Options

| Approach | Cold-start impact | Complexity | Warm-start impact |
|---|---|---|---|
| **A. `init()` at package level** | Always pays init cost even if no request arrives | Low | Zero |
| **B. Lazy `sync.Once` in Handler** | Pays init cost on first request only | Low | Zero after first request |
| C. Per-request new provider | Pays every request (high) | Low | Prohibitive (250ms+/req) |

### Recommendation: **Option B (sync.Once from Handler)**

Reasons:
1. **Vercel's "cold start" includes Go binary load + init()**. Putting OTel init in `init()` makes every cold-start pay ~50–100ms for TracerProvider construction. Option B defers that to the first request, hiding it in request latency that would pay cold-start anyway.
2. **`init()` is eager: it runs even for function warmup pings or non-handler paths.** Lazy init only pays when an actual request arrives.
3. **`sync.Once` is the idiomatic Go pattern** for one-time init guarded by concurrent calls. Vercel's Go runtime may invoke `Handler` concurrently within a single warm process; `sync.Once` handles this naturally.

See the `otel.Init()` snippet in Decision 1 — already uses `sync.Once`.

**One caveat**: the first request after cold-start will pay init latency. Mitigate by:
- Scheduled synthetic probe (Grafana synthetic monitoring → hits `/api/health` every 60s) to keep a warm instance.
- Pre-warm via Vercel Cron if synthetic cost is an issue.

Neither is in scope for Phase 3; both can be added in Phase 5 (#115) as ops-level tuning.

### Memory impact

TracerProvider + BatchSpanProcessor + OTLP exporter hold ~5–10MB resident. Vercel Go runtime has 1024MB default memory limit — negligible overhead.

---

## Risk & Mitigation

| Risk | Mitigation |
|---|---|
| `ForceFlush` blocks Vercel function eviction past the 10s/60s limit | Timeout is 1s; Vercel kills the process anyway at the hard cap — flush failure is logged but response is already sent. |
| `otelhttp` + chi span-name race (RoutePattern empty) | #147 must unit-test span name population; if it fails, switch to `otelhttp` **inside** chi middleware chain rather than wrapping the entire mux. |
| `XSAM/otelsql` version incompatibility with pgx v5.9.1 | Pin `XSAM/otelsql` v0.40+ which supports pgx v5 stdlib. Validate in #147's CI. |
| Package-level `sync.Once` not re-init on config change | Vercel cold-starts the process on every deploy → new process → `sync.Once` resets. Safe. |
| Cold-start latency from lazy init | Phase 5 synthetic probe; or upgrade to Vercel Pro+ memory tier (64-bit ARM, faster boot). Not a Phase 3 concern. |
| #133 doc recommended `exaring/otelpgx` — now corrected to `XSAM/otelsql` | **This doc supersedes that specific recommendation.** #133 is still correct for the pgxpool path; we're not on that path. If Phase 4 later migrates to pgxpool, re-evaluate. |

---

## Files the implementer (#147) will touch

**New**:
- `apps/server/internal/otel/provider.go` — Init, FlushTimeout, `sync.Once` guard
- `apps/server/internal/otel/middleware.go` — `otelhttpMiddleware`, `problemTraceIDBridge`
- `apps/server/internal/otel/provider_test.go` — init success / graceful-skip / flush-invocation tests
- `apps/server/api/[[...path]].go` — Vercel entrypoint `Handler()` wrapping chi mux

**Modified**:
- `apps/server/internal/db/db.go` — swap `sql.Open("pgx", dsn)` → `otelsql.Open(...)`, add DB stats metrics register
- `apps/server/internal/router/router.go` — *will be created by #147 or a parallel chi task; contract above*
- `apps/server/go.mod` / `go.sum` — add `go.opentelemetry.io/otel/sdk`, `otelhttp`, `XSAM/otelsql`

**NOT touched by #147**:
- FE files (`apps/dashboard/*`) — handled by Phase 2 tasks
- `apps/server/cmd/api/main.go` — this is the Fly.io container entrypoint; Vercel uses `api/[[...path]].go`. If the project commits fully to Vercel, Phase 7 (#117) can retire `cmd/api/main.go`.

---

## Open Questions (deferred to Phase 5 / later)

1. **Sampling strategy**: Head-based 10% vs tail-based + error-priority. Recommended to start with head-based 10% for Phase 3; revisit in Phase 5 when real volume is observable.
2. **`db.statement` PII scrubbing**: `otelsql` sanitizes by default (replaces literal values), but JSONB column payloads can leak. Phase 4 Repository layer should audit per-query. Out of scope for #147.
3. **Audit log dual-write to Loki**: Phase 3 checklist says audit logs should write to both Neon `audit_logs` table AND Loki (via slog). That's Phase 3 #148 or similar — not #147. This doc focuses only on trace pipeline.
4. **Sync synthetic probe for cold-start warmup**: Phase 5 #115 ops decision.

---

## References

- Vercel Go Runtime docs: https://vercel.com/docs/functions/runtimes/go
- OTel Go SDK BatchSpanProcessor semantics: https://opentelemetry.io/docs/languages/go/instrumentation/#processors
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- `XSAM/otelsql`: https://github.com/XSAM/otelsql (recommended for `database/sql` path)
- `exaring/otelpgx`: https://github.com/exaring/otelpgx (for future pgxpool migration)
- `apps/server/cmd/api/main.go:28-78` — current Fly.io entrypoint
- `apps/server/internal/db/db.go:15-31` — current `database/sql` + pgx stdlib setup
- `apps/server/internal/httperr/problem.go:11-56` — RFC 7807 + `TraceID` context helpers
- `apps/server/go.mod` — chi v5 already required, OTel deps to be added by #147
- Parent: #113 Phase 3
- Implementer: #147 BE OTel Go
- Cross-ref (merged): #133 → `docs/decisions/otel-naming-and-correlation.md` (this doc corrects the DB driver recommendation for the actual code shape)
