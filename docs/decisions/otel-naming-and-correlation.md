# OTel `service.name` Convention + FE/BE Trace Correlation

> **Status**: Plan recommended — pending ARCH sign-off
> **Parent**: #111 Phase 1 / #133 DEBUG task
> **Downstream**: #112 Phase 2 (Faro wiring), #113 Phase 3 (Go BE + OTel), #115 Phase 5 (observability correlations)
> **Author**: `debug-20260416-0857496`
> **Date**: 2026-04-16

## TL;DR

| # | 決策 | 推薦 |
|---|---|---|
| 1 | `service.name` | **純名稱** + `deployment.environment.name` attribute。三個 service：`whitelabel-web` (browser/Faro), `whitelabel-dashboard` (Next.js Node), `whitelabel-api` (Go) |
| 2 | Trace propagation | **W3C Trace Context** (`traceparent` + `tracestate`)。Faro default，BE 用 `otelhttp.NewHandler` + `propagation.TraceContext{}` 讀 header |
| 3 | Logs↔Traces | RFC 7807 `trace_id` = **OTel `trace_id` 32-char hex**。BE slog handler 自動 inject `trace_id`、`span_id` |
| 4 | Resource attrs | 共同：`service.namespace="whitelabel"`, `service.version`, `deployment.environment.name`, `service.instance.id` |

---

## Context

### Current state

- `packages/otel/src/tracing.ts` 已經用 `resourceFromAttributes` 設 `ATTR_SERVICE_NAME / ATTR_SERVICE_VERSION / ATTR_DEPLOYMENT_ENVIRONMENT_NAME`（来自 `@opentelemetry/semantic-conventions/incubating`）。
- `apps/dashboard/instrumentation.ts` 呼叫 `initTracing({ serviceName: "whitelabel-dashboard", environment: process.env.NODE_ENV })` — 目前只有一個 service name，沒有 namespace、沒有 version、也沒有為 browser / server 分流。
- `apps/server/main.go` 尚未整合 OTel（#113 Phase 3 才做）。使用 `log/slog` JSON handler 不帶任何 trace 關聯。
- Phase 3 BE 將改用 Go `chi` + Neon Postgres（目前是 Turso）。本決策是要讓 #113 直接照做，不用再回頭修。

### 決策依據（OTel Semantic Conventions）

本文件遵循 OTel 1.27+ resource semantic conventions：
- `service.name` 必填、應跨環境穩定（spec 原話：*"a logical name of the service"*）。
- `service.namespace` 選填但在多 service 場景強烈推薦（group by 用）。
- `deployment.environment.name` 取代舊的 `deployment.environment`（已 deprecated），標記 `production | preview | development`。
- `service.version` 跨語言通用，對應 release/commit SHA。
- `service.instance.id` 用於同一 service 的多個實例（Vercel deploy id / pod name）。

---

## Decision 1 — `service.name` Convention

### Candidates (from issue body)

| | Example | Grafana Tempo 搜尋 UX | SemConv 合規 |
|---|---|---|---|
| **A. 環境後綴** `whitelabel-dashboard.prod` | 每個 env 出現一個新 service | 🚫 搜尋 `service.name="whitelabel-dashboard"` 抓不到 prod；必須寫 3 條 filter | 🚫 違反「跨 env 穩定」原則 |
| **B. 純名稱 + attr** `whitelabel-dashboard` + `deployment.environment.name=prod` | 同一 service、用 filter 切環境 | ✅ 直覺；Grafana Explore 的「Service」下拉維持 O(services)，不會 O(services × envs) | ✅ 完全合規 |
| **C. 前綴** `frontend.whitelabel-dashboard` | 多了一層 `frontend.` prefix | ⚠ 下拉變長；OTel `service.namespace` 已經提供這功能，在 service.name 裡手動加 prefix 是 reinvent | ⚠ 與 `service.namespace` 重疊，屬反模式 |

### Recommendation: **B + `service.namespace`**

三個 service：

| Service | 用途 | Runtime | 定義處 |
|---|---|---|---|
| `whitelabel-web` | 瀏覽器端 Faro（JS errors、Web Vitals、client fetch span） | Browser | `apps/dashboard/src/app/faro.ts`（Phase 2 新增） |
| `whitelabel-dashboard` | Next.js Node runtime（SSR、App Router server components、middleware） | Node 20+ | `apps/dashboard/instrumentation.ts` |
| `whitelabel-api` | Go backend (chi + Neon) | Go 1.22+ | `apps/server/main.go`（Phase 3 新增） |

`service.namespace = "whitelabel"` 統一三者（Grafana Tempo 可做 "all whitelabel services" 視圖）。

### 為什麼 browser 跟 Next Node 要分兩個 service.name（而不是共用 `whitelabel-dashboard`）

運維特性差很大：
- **Browser**：RUM 性質（web vitals、JS errors、client fetch）、量大、sampled aggressively、bundle/parse 時間。
- **Next Node SSR**：server latency、middleware 執行、DB proxy（/api/* rewrite）。

共用一個 service.name 會讓 Grafana 的「service latency」等 dashboard 混入 browser 的 LCP，毫無意義。雖然 `span.kind = CLIENT | SERVER` 理論上可以區分，但 Tempo 的 service 下拉還是會被 browser spans 稀釋。

### 不用 `service.instance.id` 也能追 Vercel multi-region 嗎

Vercel Serverless 每個 invoke 都是新 instance。讓 `service.instance.id = process.env.VERCEL_DEPLOYMENT_ID ?? <hostname>` 即可。

---

## Decision 2 — Trace ID Propagation

### FE Faro → BE Go

Faro web-sdk 的 `@grafana/faro-web-tracing` package 預設啟用 `FetchInstrumentation` 與 `XHRInstrumentation`，**自動在 outgoing `fetch` / `XHR` 加上 `traceparent`（W3C Trace Context）header**。無需手動處理。

唯一需要的事：**讓 BE 讀 `traceparent`**。

### BE Go 實作範例（for Phase 3 #113）

```go
// apps/server/tracing.go (Phase 3 新增)
package main

import (
    "context"

    "go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
    "go.opentelemetry.io/otel/propagation"
    "go.opentelemetry.io/otel/sdk/resource"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

func initTracing(ctx context.Context, version, env string) (func(context.Context) error, error) {
    exporter, err := otlptracehttp.New(ctx) // reads OTEL_EXPORTER_OTLP_ENDPOINT
    if err != nil {
        return nil, err
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
        return nil, err
    }

    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
        sdktrace.WithResource(res),
    )
    otel.SetTracerProvider(tp)
    // CRITICAL: enable W3C Trace Context reader/writer
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
        propagation.TraceContext{},
        propagation.Baggage{},
    ))
    return tp.Shutdown, nil
}

// Usage in main.go (Phase 3):
// mux.Handle("GET /api/health", otelhttp.NewHandler(healthHandler(db), "GET /api/health"))
```

`otelhttp.NewHandler` 做三件事：
1. 自 `traceparent` header 還原 parent span context（如果 Faro 有送）。
2. 沒 parent 時自開 root span。
3. 把 OTel span inject 到 `r.Context()`，讓 handler 內可 `trace.SpanFromContext(r.Context())`。

### Neon Postgres 子 span

Phase 3 會從 Turso 換到 Neon，DB driver 會改成 `jackc/pgx/v5`。pgx 有 **官方社群 instrumentation**：

```go
import (
    "github.com/exaring/otelpgx"
    "github.com/jackc/pgx/v5/pgxpool"
)

cfg, _ := pgxpool.ParseConfig(os.Getenv("DATABASE_URL"))
cfg.ConnConfig.Tracer = otelpgx.NewTracer() // 每個 query 自動建 span
pool, _ := pgxpool.NewWithConfig(ctx, cfg)
```

每個 DB 查詢會產生一個 `db.system=postgresql` span，parent 為當前 HTTP request 的 span。Grafana Tempo waterfall 會顯示 `GET /api/users → SELECT * FROM users`。

**建議 Phase 3 採用 `exaring/otelpgx`**：commit-active、純 Tracer hook、無 pgx wrapper；若未來改 `database/sql` 路徑再考慮 `XSAM/otelsql`。

### Edge / middleware runtime

Next.js edge runtime 無法跑完整 Node OTel SDK（沒有 `fs` / `process.hrtime`）。Phase 2 FE 的 middleware 若需要 trace：
- **選項 1（推薦）**：middleware 只做 header pass-through（Faro 的 `traceparent` 原本就會到 middleware，middleware 只要不清 headers 即可）。
- **選項 2**：edge 用 `@vercel/otel` package — 精簡版、支援 edge runtime，只提供 minimal span API。

本 Phase 決定先走選項 1，Phase 5 再視需要引入 `@vercel/otel`。

---

## Decision 3 — Logs ↔ Traces Correlation

### RFC 7807 的 `trace_id` 欄位

**決策：RFC 7807 response 的 `trace_id` = 當前 OTel trace 的 32-char lowercase hex（`SpanContext.TraceID.String()`）。**

理由：
- Grafana Tempo 的 trace lookup API 直接吃 32-char hex。
- W3C Trace Context 的 `traceparent` 格式本身就是 `00-{trace-id-32hex}-{span-id-16hex}-{flags}`，所以寫回 JSON 時直接取中段。
- 使用者（或 support）拿到 error response 可直接貼到 Grafana Tempo 的 "Search by ID" 看全部 span。

### Go BE 實作範例（Phase 3）

```go
// apps/server/errors.go (Phase 3)
type ProblemDetail struct {
    Type     string `json:"type"`
    Title    string `json:"title"`
    Status   int    `json:"status"`
    Detail   string `json:"detail,omitempty"`
    Instance string `json:"instance,omitempty"`
    TraceID  string `json:"trace_id,omitempty"`
}

func writeProblem(ctx context.Context, w http.ResponseWriter, status int, title, detail string) {
    span := trace.SpanFromContext(ctx)
    traceID := ""
    if sc := span.SpanContext(); sc.IsValid() {
        traceID = sc.TraceID().String() // 32-char lowercase hex
    }
    w.Header().Set("Content-Type", "application/problem+json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(ProblemDetail{
        Type: "about:blank", Title: title, Status: status,
        Detail: detail, TraceID: traceID,
    })
}
```

### slog 自動 inject `trace_id`

```go
// apps/server/slog_handler.go (Phase 3)
type traceHandler struct{ slog.Handler }

func (h traceHandler) Handle(ctx context.Context, r slog.Record) error {
    if sc := trace.SpanContextFromContext(ctx); sc.IsValid() {
        r.AddAttrs(
            slog.String("trace_id", sc.TraceID().String()),
            slog.String("span_id", sc.SpanID().String()),
        )
    }
    return h.Handler.Handle(ctx, r)
}

// Usage:
logger := slog.New(traceHandler{Handler: slog.NewJSONHandler(os.Stdout, nil)})
slog.SetDefault(logger)
```

→ `slog.InfoContext(ctx, "user created", "user_id", uid)` 會自動帶 `trace_id`。

**效果**：Grafana Loki 的 log line 有 `trace_id` 欄位 → Grafana Tempo ↔ Loki 自動 deep link（Tempo 點 "Logs for this span" 直接過濾 Loki）。

### FE Faro 的 log correlation

Faro web-sdk 的 `pushLog()` API 會自動帶當前 active span 的 trace id（前提：`@grafana/faro-web-tracing` 啟動）。不需額外設定。

---

## Decision 4 — Resource Attributes

每個 service 必帶：

| Attribute | FE `whitelabel-web` (Faro) | FE `whitelabel-dashboard` (Next Node) | BE `whitelabel-api` (Go) |
|---|---|---|---|
| `service.name` | `whitelabel-web` | `whitelabel-dashboard` | `whitelabel-api` |
| `service.namespace` | `whitelabel` | `whitelabel` | `whitelabel` |
| `service.version` | `NEXT_PUBLIC_FARO_APP_VERSION` | `process.env.VERCEL_GIT_COMMIT_SHA` | build-time `-ldflags "-X main.version=$GIT_SHA"` |
| `deployment.environment.name` | `VERCEL_ENV` (→ `production\|preview\|development`) | `VERCEL_ENV` | `ENV` env var |
| `service.instance.id` | N/A（browser session） | `VERCEL_DEPLOYMENT_ID` | Fly/Vercel instance id |
| `telemetry.sdk.language` | auto (`webjs`) | auto (`nodejs`) | auto (`go`) |

### FE Faro config 範例（Phase 2 #112）

```typescript
// apps/dashboard/src/app/faro.ts  (Phase 2 新增)
import { initializeFaro, getWebInstrumentations } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

export function initFaro() {
  const url = process.env.NEXT_PUBLIC_FARO_COLLECTOR_URL;
  if (!url) return; // no-op in dev without collector

  initializeFaro({
    url,
    app: {
      name: "whitelabel-web",
      namespace: "whitelabel",
      version: process.env.NEXT_PUBLIC_FARO_APP_VERSION ?? "unknown",
      environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    },
    instrumentations: [
      ...getWebInstrumentations(),       // errors, web vitals, console, sessions
      new TracingInstrumentation(),      // fetch/XHR → traceparent header
    ],
  });
}
```

### FE Next Node runtime（修改 `packages/otel/src/tracing.ts`）

現在的 `resourceFromAttributes` 已經有 `ATTR_SERVICE_NAME / ATTR_SERVICE_VERSION / ATTR_DEPLOYMENT_ENVIRONMENT_NAME`。**Phase 2 需要補**：

```typescript
// packages/otel/src/tracing.ts  — 建議 diff
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAMESPACE,         // ← add
  ATTR_SERVICE_INSTANCE_ID,       // ← add
} from "@opentelemetry/semantic-conventions/incubating";

export interface InitTracingConfig {
  serviceName: string;
  serviceNamespace?: string;      // ← add, default "whitelabel"
  serviceInstanceId?: string;     // ← add
  environment?: string;
  serviceVersion?: string;
}

// Inside initTracing():
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: config.serviceName,
  [ATTR_SERVICE_NAMESPACE]: config.serviceNamespace ?? "whitelabel",
  ...(config.serviceVersion && { [ATTR_SERVICE_VERSION]: config.serviceVersion }),
  ...(config.serviceInstanceId && { [ATTR_SERVICE_INSTANCE_ID]: config.serviceInstanceId }),
  ...(config.environment && { [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: config.environment }),
});
```

然後在 `apps/dashboard/instrumentation.ts`：

```typescript
// apps/dashboard/instrumentation.ts  — 建議 diff
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initTracing } = await import("@whitelabel/otel");
    initTracing({
      serviceName: "whitelabel-dashboard",
      serviceVersion: process.env.VERCEL_GIT_COMMIT_SHA,
      serviceInstanceId: process.env.VERCEL_DEPLOYMENT_ID,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    });
  }
}
```

### BE Go resource 範例（Phase 3 #113）

見 Decision 2 的 code snippet，`resource.New` 內已包含：
- `ServiceName("whitelabel-api")`
- `ServiceNamespace("whitelabel")`
- `ServiceVersion(version)` — 從 `-ldflags "-X main.version=$GIT_SHA"` 注入
- `DeploymentEnvironmentName(env)` — 從 `ENV` env var

建議再補 `ServiceInstanceID` 從 `HOSTNAME`（Fly/Vercel 都會設）。

---

## Comparison with alternatives (quick check)

| 決定 | 被否決的替代 | 為什麼否決 |
|---|---|---|
| D1: pure name + attr (B) | A（環境後綴）| Tempo 搜尋 O(n × envs) |
| D1: pure name + attr (B) | C（前綴）| 與 `service.namespace` 重疊 |
| D1: 三個 service.name | 共用一個 `whitelabel-dashboard` | Browser RUM 與 SSR 性質不同，mixed metrics 無意義 |
| D2: W3C Trace Context | B3 (Zipkin) / Jaeger propagator | Faro default 是 W3C；Go OTel default 也是 W3C；加 B3 只為了相容性包袱 |
| D2: `exaring/otelpgx` | `XSAM/otelsql` | pgx 是 Phase 3 的直接選擇，用 pgx 原生 Tracer hook 而非 `database/sql` wrapper |
| D3: trace_id = OTel hex | 獨立 correlation id (UUID) | 多一層 mapping 無價值；Tempo 直接吃 hex |
| D4: env 分流用 `deployment.environment.name` | 多 OTel endpoint (每 env 一個) | 多 endpoint = 多 secret，增加配置面積 |

---

## Open questions（Phase 2/3 實作時再決定）

- **Sampling 策略**：Phase 2 Faro 走 0.1 還是 1.0？BE 走 parentbased + 0.1 還是 tail-based？本文件不做決定 — 交 Phase 5 #115 依流量決定。
- **Log body 結構**：slog 用 JSON handler 已決定；欄位 naming convention（snake_case vs camelCase）放在另一份 docs decision，待 Phase 3 BE kick-off 前決定。
- **Span attribute naming**：業務欄位（`user.id`、`tenant.id`）的命名——OTel 有 user agent conventions 但沒 tenant。建議 Phase 3 BE 用 `enduser.id`（OTel standard）、`whitelabel.tenant.id`（self-namespaced）。此為 Phase 3 子任務不在本文範圍。

---

## Files to touch (summary)

**Phase 2 (#112)** — 3 files changed, 1 new：

- `packages/otel/src/tracing.ts` — add `serviceNamespace` / `serviceInstanceId` config fields (見 Decision 4 的 diff)
- `apps/dashboard/instrumentation.ts` — 補 `serviceVersion / serviceInstanceId` 讀 Vercel env
- `apps/dashboard/src/app/faro.ts` — **new** (見 Decision 4 的 snippet)
- `.env.example` — `NEXT_PUBLIC_FARO_COLLECTOR_URL`, `NEXT_PUBLIC_FARO_APP_VERSION`, `NEXT_PUBLIC_VERCEL_ENV`

**Phase 3 (#113)** — all new files in `apps/server/`：

- `apps/server/tracing.go` — **new**（見 Decision 2 snippet）
- `apps/server/errors.go` — **new**（RFC 7807 + trace_id；見 Decision 3 snippet）
- `apps/server/slog_handler.go` — **new**（見 Decision 3 snippet）
- `apps/server/go.mod` — 加 `go.opentelemetry.io/otel` stack + `otelhttp` + `exaring/otelpgx`
- `apps/server/main.go` — 包 handler 用 `otelhttp.NewHandler`

**Phase 5 (#115)** — Grafana Cloud dashboards（非本決策範圍）。

---

## References

- OpenTelemetry Semantic Conventions — Resource: https://opentelemetry.io/docs/specs/semconv/resource/
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- `packages/otel/src/tracing.ts:52-60`（目前的 resource 設定）
- `apps/dashboard/instrumentation.ts:3-8`（目前的 initTracing call）
- `apps/server/main.go:77-94`（目前 BE 無 OTel 的狀態）
- Parent: #111 Phase 1
- Downstream: #112 Phase 2 (FE Faro), #113 Phase 3 (BE Go + OTel), #115 Phase 5 (observability dashboards)
