# End-to-End Trace Verification Guide

> **Author**: `debug-20260416-0857496`
> **Date**: 2026-04-17
> **Parent**: #115 Phase 5 / #172 DEBUG task
> **Status**: Code-level chain verified; live Grafana verification pending deployment with OTel env vars

## Overview

This guide covers how to verify the full observability chain in whitelabel-admin:

```
Browser (Faro)  →  Next.js middleware  →  Go serverless  →  Neon Postgres
     │                     │                    │                │
  whitelabel-dashboard  pass-through     whitelabel-api      db span
  (TracingInstrumentation)              (otel.Middleware)    (otel.Query)
     │                     │                    │                │
     └────────── W3C traceparent header ────────┘                │
                                                └── context ─────┘
```

---

## 1. Code-Level Chain Verification

### 1a. FE → traceparent header

**File**: `apps/dashboard/src/components/providers/FaroProvider.tsx`

`initializeFaro` is called with `TracingInstrumentation()` from `@grafana/faro-web-tracing`. This auto-wraps `fetch()` and `XMLHttpRequest` to inject `traceparent` headers on outgoing requests.

**Verify**: in browser DevTools → Network tab → any `/api/*` request → Headers → look for:
```
traceparent: 00-{32hex-trace-id}-{16hex-span-id}-01
```

### 1b. Next.js middleware → pass-through

**File**: `apps/dashboard/src/middleware.ts` (if exists)

Next.js middleware uses `NextResponse.next()`, which preserves all incoming request headers including `traceparent`. No OTel SDK runs in the edge runtime.

**Verify**: the `traceparent` header seen in DevTools on the browser request matches what the Go handler receives.

### 1c. Go handler → reads traceparent, creates child span

**File**: `apps/server/internal/otel/middleware.go:23-52`

`otel.Middleware` runs first in the chi middleware chain (`apps/server/internal/router/router.go:45`):
1. `otel.GetTextMapPropagator().Extract(r.Context(), r.Header)` reads `traceparent`.
2. `tracer.Start(ctx, spanName)` creates a server span as child of the browser's trace.
3. `httperr.WithTraceID(ctx, tid.String())` stores trace id for RFC 7807 responses.

**Verify in Grafana Tempo**: query `{ resource.service.name = "whitelabel-api" }` → waterfall should show `HTTP POST /api/auth/login` as a child of the browser's Faro trace.

### 1d. DB span → child of handler span

**File**: `apps/server/internal/otel/dbtrace.go:22-33`

`otel.Query()` creates a span `db.query {name}` with `db.system=postgresql` and sanitized `db.query.text`.

**Verify in Grafana Tempo**: inside the same trace, the DB span should appear as a child of the HTTP handler span:
```
[browser fetch]  →  [HTTP POST /api/auth/login]  →  [db.query select_user]
                                                  →  [db.query insert_audit]
```

### 1e. Audit log → trace_id persisted

**File**: `apps/server/internal/middleware/audit.go:62-65`

Audit middleware extracts `trace.SpanContextFromContext(r.Context()).TraceID()` and stores it in `repo.AuditLog.TraceID`.

**File**: `apps/server/internal/repo/pgx/audit.go:20-28`

The pgx repo writes `trace_id` to the `audit_logs` Neon table. This enables jumping from an audit record to a Grafana Tempo trace.

### 1f. slog → trace_id auto-injection

**File**: `apps/server/internal/logging/logger.go`

A custom `traceHandler` wraps slog's JSON handler and injects `trace_id` + `span_id` into every log record whose context carries a valid span. This means all `slog.InfoContext(ctx, ...)` calls in handlers produce structured JSON with `trace_id`.

**Verify in Grafana Loki**: `{service_name="whitelabel-api"} | json | trace_id != ""` should return log lines with valid 32-char hex trace IDs.

---

## 2. Triggering an End-to-End Trace

### Option A: Via curl (headless, no browser Faro)

Generate a synthetic trace from the Go handler + DB:

```bash
# Generate a random W3C traceparent header
TRACE_ID=$(openssl rand -hex 16)
SPAN_ID=$(openssl rand -hex 8)
TRACEPARENT="00-${TRACE_ID}-${SPAN_ID}-01"

# Hit the login endpoint with traceparent
curl -v -X POST "${PREVIEW_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "traceparent: ${TRACEPARENT}" \
  -d '{"email":"admin@example.com","password":"changeme"}' \
  2>&1 | grep -i "trace_id\|traceparent"

echo "Search Tempo for trace: ${TRACE_ID}"
```

Expected: the RFC 7807 error response (if login fails) contains `"trace_id": "<TRACE_ID>"` matching the injected value. In Grafana Tempo, search by `${TRACE_ID}` to see the full span tree.

### Option B: Via browser (FE Faro)

1. Open the Vercel preview URL in Chrome.
2. Navigate to `/login` and submit a login form.
3. Open DevTools → Network → find the `/api/auth/login` request.
4. Copy the `traceparent` header value.
5. Extract the trace ID: `00-{THIS PART}-{span}-01`.
6. Paste it into Grafana Tempo → Explore → Search by Trace ID.

### Option C: Faro error test

```javascript
// In browser console on the preview URL:
import('@grafana/faro-web-sdk').then(m => m.faro.api.pushError(new Error('e2e-test')));
```

Or use the `<FaroTestButton />` component on the dashboard home page (`apps/dashboard/src/app/(dashboard)/page.tsx:30`).

---

## 3. Grafana Correlations Configuration

### 3a. Loki → Tempo (log line → trace)

**Config via Grafana UI**:
1. Go to **Administration → Data sources → Loki (your instance)**.
2. Click **Correlations** tab (or **Administration → Correlations**).
3. Add correlation:
   - **Source**: Loki
   - **Target**: Tempo
   - **Label**: `View trace`
   - **Field**: `trace_id` (the JSON field from structured logs)
   - **Query**: `${__value.raw}` (maps the trace_id field value to Tempo's trace ID search)
   - **Type**: Query

**Verify**: in Grafana Explore → Loki → query `{service_name="whitelabel-api"} | json` → click a log line → the `trace_id` field should show a clickable "View trace" link that opens Tempo.

### 3b. Tempo → Loki (trace span → logs)

**Config via Grafana UI**:
1. Go to **Administration → Data sources → Tempo (your instance)**.
2. Under **Trace to logs**:
   - **Data source**: Loki (your instance)
   - **Tags**: `service.name` (maps to Loki label)
   - **Span start/end shift**: `-5m / +5m` (time window for log search)
   - **Filter by trace ID**: enabled
   - **Loki query**: `{service_name="${__span.tags.service.name}"} | json | trace_id = "${__span.traceId}"`

**Verify**: in Grafana Explore → Tempo → open a trace → click a span → "Logs for this span" link should jump to Loki with the filtered logs.

### 3c. Audit table → Tempo (DB record → trace)

For the admin UI's audit log table:

The `audit_logs.trace_id` column stores the 32-char hex trace ID. To create a clickable link in the dashboard UI:

```
https://{GRAFANA_INSTANCE}.grafana.net/explore?left={"queries":[{"refId":"A","datasource":{"type":"tempo"},"queryType":"traceql","query":"${trace_id}"}]}
```

Or use Grafana's built-in **Data link** feature on a Table panel:
1. Create a Grafana dashboard panel showing audit logs (via Postgres data source → `SELECT * FROM audit_logs ORDER BY created_at DESC`).
2. On the `trace_id` column, add a **Data link**:
   - **Title**: `View trace in Tempo`
   - **URL**: `${__data.fields.trace_id}` with target datasource = Tempo

---

## 4. Troubleshooting

### Trace missing entirely

| Symptom | Check |
|---|---|
| No traces from Go backend | Is `OTEL_EXPORTER_OTLP_ENDPOINT` set in Vercel env? Check Vercel function logs for "tracing disabled" warning. |
| No traces from FE Faro | Is `NEXT_PUBLIC_GRAFANA_FARO_URL` set? Check browser console for "[Faro] ... not set" warning. |
| Traces appear but no DB spans | Is `otel.Query()` used in the repo layer? Phase 4 repo migration must use `otel.Query` helper, not raw `db.QueryContext`. |

### Span tree broken (FE and BE appear as separate traces)

| Symptom | Check |
|---|---|
| Browser trace and Go trace have different trace IDs | `traceparent` header is not reaching Go. Check: (1) Faro `TracingInstrumentation` initialized, (2) Next.js middleware not stripping headers, (3) CORS not blocking custom headers. |
| Go reads traceparent but creates root span | `otel.GetTextMapPropagator()` returns `propagation.TraceContext{}` — verify `otel.Init` ran BEFORE the middleware chain (it does via `sync.Once` in `catchall.go`). |

### Sampling drops traces

| Symptom | Check |
|---|---|
| Some auth requests missing | Shouldn't happen — `sampler.go` uses `AlwaysSample()` for `/api/auth/*`. Check `sampler.go:48` `isAuthRoute` logic. |
| Non-auth requests sparse | Expected at 10% default. Set `OTEL_TRACES_SAMPLER_ARG=1.0` for 100% during verification. |

### Loki ↔ Tempo correlation link missing

| Symptom | Check |
|---|---|
| Log lines have no `trace_id` | Is the custom slog handler (`logging/logger.go`) wired? Check `cmd/api/main.go` or `catchall.go` for logger init. |
| `trace_id` present but no clickable link | Grafana Correlations not configured. Follow Section 3a/3b above. |
| Link opens Tempo but "trace not found" | Trace may have been sampled out (Faro side) or hasn't been ingested yet (OTLP batching delay — wait 30s and retry). |

### Faro events not appearing in Grafana

| Symptom | Check |
|---|---|
| Console shows "[Faro] init failed" | Check `NEXT_PUBLIC_GRAFANA_FARO_URL` format — must be the full collector URL (e.g. `https://faro-collector-prod-xx.grafana.net/collect/{appKey}`). |
| No PageView/WebVitals | Faro initialized but `getWebInstrumentations()` may be missing. Verify `FaroProvider.tsx:34` includes it. |
| `pushError()` works but no traces | `TracingInstrumentation()` must be in the instrumentations array. Check `FaroProvider.tsx:35`. |

---

## 5. Code-Level Wiring Audit (Findings)

### Confirmed correct

| Component | File | Status |
|---|---|---|
| FE Faro init with TracingInstrumentation | `FaroProvider.tsx:27-38` | ✅ |
| FE global-error pushes to Faro | `global-error.tsx:13-14` | ✅ |
| BE OTel provider with W3C propagator | `otel/provider.go:50-53` | ✅ |
| BE middleware reads traceparent | `otel/middleware.go:27` | ✅ |
| BE middleware bridges trace_id to httperr | `otel/middleware.go:40-42` | ✅ |
| BE DB spans via otel.Query helper | `otel/dbtrace.go:22-33` | ✅ |
| BE audit writes trace_id to DB | `middleware/audit.go:62-65` | ✅ |
| BE slog injects trace_id/span_id | `logging/logger.go:37-49` | ✅ |
| BE ForceFlush on every Vercel invocation | `api/catchall.go:39-45` | ✅ |
| BE sampler: auth alwaysOn, default 10% | `otel/sampler.go:22-28` | ✅ |
| BE resource attrs match #133 decision | `otel/provider.go:72-79` | ✅ |

### Discrepancy found

| Component | Expected (#133 decision) | Actual | Impact |
|---|---|---|---|
| FE Faro `app.name` | `whitelabel-web` | `whitelabel-dashboard` | Grafana Tempo "by service" filter will show `whitelabel-dashboard` for BOTH browser Faro spans AND Next.js Node SSR spans. This defeats the split recommended in `docs/decisions/otel-naming-and-correlation.md` D1. **Should be `whitelabel-web`**. |

**Recommendation**: FE task to change `FaroProvider.tsx:30` from `name: "whitelabel-dashboard"` to `name: "whitelabel-web"`. This is a one-line fix but affects Grafana dashboard filters — coordinate with Phase 5 Grafana dashboard definitions.

---

## 6. Verification Checklist

Use this checklist during live Grafana verification:

- [ ] **T1**: curl with synthetic `traceparent` → response `trace_id` matches injected value
- [ ] **T2**: Search that trace in Tempo → shows `HTTP POST /api/auth/login` span
- [ ] **T3**: Same trace has DB child span(s) (`db.query`)
- [ ] **T4**: Span attributes complete: `http.request.method`, `url.path`, `http.response.status_code`, `db.system`
- [ ] **T5**: Loki query `{service_name="whitelabel-api"} | json | trace_id != ""` returns results
- [ ] **T6**: Loki → Tempo correlation link works (Section 3a configured)
- [ ] **T7**: Tempo → Loki "Logs for this span" link works (Section 3b configured)
- [ ] **T8**: Browser Faro → Grafana: PageView event visible
- [ ] **T9**: Browser Faro → Grafana: `pushError(new Error('test'))` visible
- [ ] **T10**: FE trace + BE trace share same trace ID (end-to-end propagation)
- [ ] **T11**: `audit_logs` table row has matching `trace_id`

---

## References

- `apps/dashboard/src/components/providers/FaroProvider.tsx` — Faro init
- `apps/dashboard/src/app/global-error.tsx` — Faro error push
- `apps/server/api/catchall.go` — Vercel entrypoint + ForceFlush
- `apps/server/internal/otel/provider.go` — OTel SDK init
- `apps/server/internal/otel/middleware.go` — traceparent reader + span creation
- `apps/server/internal/otel/dbtrace.go` — DB span helper
- `apps/server/internal/otel/sampler.go` — route-based sampling
- `apps/server/internal/logging/logger.go` — slog trace_id injection
- `apps/server/internal/middleware/audit.go` — audit log trace_id
- `apps/server/internal/repo/pgx/audit.go:20-28` — audit trace_id to Neon
- `docs/decisions/otel-naming-and-correlation.md` — D1 naming decision (#133)
- `docs/decisions/vercel-go-otel-lifecycle.md` — ForceFlush decision (#150)
