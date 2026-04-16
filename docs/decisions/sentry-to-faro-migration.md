# Sentry → Faro Migration — Plan & Rollback Criteria

> **Status**: Plan recommended — pending ARCH sign-off
> **Parent**: #110 Phase 0 / #125 DEBUG task
> **Related phases**: #112 Phase 2 (Faro wiring), #115 Phase 5 (observability end-to-end)
> **Author**: `debug-20260416-0857496`
> **Date**: 2026-04-16

## TL;DR

**推薦：階段並行，在 Phase 2 加入 Faro、保留 Sentry 到 Phase 5 驗收完成後一次性拆除。**

並行窗口以「階段驗收」為閘門而非日曆天數：Phase 2（#112）完成時 Faro 上線、Sentry 不拆；Phase 5（#115）完成觀測全鏈路驗收後再拆 Sentry。整個並行期橫跨大約 2–3 週實作時間，但在此期間專案尚未上線正式使用者（Phase 8 才部署），因此「production 並行成本」其實是 **CI / preview build size + dev cognitive load**，不是使用者效能或費用。

---

## Context

### Current footprint (as of 2026-04-16)

`@sentry/nextjs@^10.48.0` 已整合，Sentry 呼叫面很薄：

| File | Lines | Role |
|------|------:|------|
| `apps/dashboard/sentry.client.config.ts` | 15 | Browser `Sentry.init`，`tracesSampleRate: 0.1`，`replays*: 0`。DSN 由 `NEXT_PUBLIC_SENTRY_DSN ?? SENTRY_DSN` 控制，未設時 `enabled: false`。 |
| `apps/dashboard/sentry.server.config.ts` | 12 | Node runtime `Sentry.init`，同樣 0.1 sampling。 |
| `apps/dashboard/sentry.edge.config.ts` | 12 | Edge runtime `Sentry.init`。 |
| `apps/dashboard/src/app/global-error.tsx` | 24 | **唯一一個業務呼叫**：`Sentry.captureException(error)`（line 13）。 |
| `apps/dashboard/next.config.ts` | 39 | 包 `withSentryConfig(nextConfig, { org, project, authToken, silent, widenClientFileUpload, sourcemaps })`。 |

**觀察 1：Sentry 在程式碼裡幾乎只做 `init` + 一個 `captureException`。** 其餘追蹤 / performance / breadcrumb 全部走 Sentry 的自動 instrumentation。這代表拆除 Sentry 的程式碼改動很小，主要工作在 build wrapper 與 source-map upload。

**觀察 2：OTel 已經在同一個 runtime 裡跑了。** `apps/dashboard/instrumentation.ts` 透過 `@whitelabel/otel` 初始化 `NodeSDK` + `OTLPTraceExporter`，吐 OTLP/HTTP 到 `OTEL_EXPORTER_OTLP_ENDPOINT`（尚未設定時會優雅停用）。這表示 backend-side traces 其實已經可以獨立於 Sentry 存在；Sentry 在 node runtime 的角色是 **error 事件的 ingest 與 source-map 對位**，不是 tracing backbone。

**觀察 3：`next.config.ts` 的 source-map upload 已經 gated：** 沒有 `SENTRY_AUTH_TOKEN` 時會 `sourcemaps.disable = true`（line 36–38），所以 local / preview build 不會因缺 Sentry secrets 失敗。這是一個現成的 kill-switch。

### 專案所處階段 (關鍵脈絡)

這不是「生產環境做熱切換」的題目。根據 issue tracker：

- **#110 Phase 0**（當前）— 清理 + 決策。未部署正式使用者流量。
- **#111 Phase 1** — Vercel + Neon + Grafana Cloud 連通。
- **#112 Phase 2** — FE 重構，明確提到 "Faro + 登入頁 + Middleware + React Query"。**Faro 在這裡第一次真正跑起來**。
- **#115 Phase 5** — 可觀測性全鏈路，Faro → OTel Go correlations + dashboards。**這是 Faro 驗收的自然時間點**。
- **#118 Phase 8** — Production deploy。

> **這個順序對本決定影響極大：** 「並行期」其實是 *開發階段並行*，不是 *生產環境並行*。後者的成本是 data 重複 ingest、bill 加倍；前者的成本是 dev bundle 增加一個 SDK、CI 多一份 source-map upload。完全不同的 trade-off。

---

## Faro 可以取代 Sentry 哪些工作？

| Sentry 能力 | Faro (Grafana) 等價物 | 備註 |
|---|---|---|
| Client-side JS error capture | `@grafana/faro-web-sdk` → Loki (`{service_name="faro"} \| kind="error"`) | 需驗證 stack trace + sourcemap 對位品質，見 rollback criteria。 |
| Browser performance / Web Vitals | Faro web-sdk built-in (CLS/LCP/FID → Prometheus) | Phase 5 需搭一次 dashboard 驗證。 |
| Session replay | **無直接等價物** | 專案目前 `replaysSessionSampleRate: 0` / `replaysOnErrorSampleRate: 0`，**沒用 replay**，可忽略。 |
| Server-side error capture | `global-error.tsx` 可改用 OTel `recordException(span, error)` 或 Loki structured log；節點側 `@whitelabel/otel` 已有 `NodeSDK`。 | 需 Phase 2 時順手換 `Sentry.captureException` → OTel 等價呼叫。 |
| Traces (server) | `@whitelabel/otel` → OTLP → Tempo (已到位) | Sentry v10 的 `@sentry/opentelemetry` bridge 理論上可以共存；本專案不需要因為 OTel 已經是主力。 |
| Source-map 對位 (client) | Faro web-sdk 靠 Grafana Alloy 上傳 sourcemaps（或 build-time 上傳到 Grafana Cloud）。 | **最高風險項**。見 rollback criteria。 |
| Release tracking | Grafana Cloud 的 release 管理 + Alloy 搭配 Git SHA | Phase 5 需驗證。 |

### 不能取代的部分

- **Session replay**：若未來需要，得另尋工具（非本次遷移範圍）。
- **Sentry 的 issue de-dup + fingerprinting**：Loki 上的 error 分組要自己用 LogQL 寫。Phase 5 驗收必須涵蓋「同一類 error 出現 100 次」時能否仍然合理呈現。

---

## Options

### Option A — 一次性拆除（Big-bang，在 Phase 2 開始時就刪 Sentry）

Phase 2 開始時：刪掉 4 個 Sentry 檔 + `withSentryConfig` wrapper，同時加入 Faro。之後都只靠 Faro + OTel。

| Dimension | Assessment |
|---|---|
| 實作時間 | 最短。一個 PR 包含 remove Sentry + add Faro。 |
| 風險 | **高**。Faro 的 sourcemap pipeline 在 Phase 5 前都沒有真正壓力測試過。Phase 2 如果爆了前端錯誤，沒有 fallback 可看。 |
| 驗收難度 | 困難。無 baseline 可對照「Sentry 原本抓得到、Faro 抓不到」的差距。 |
| 可回退性 | 有，但要 git revert 一包改動。 |
| Cognitive load | 最低（只有一個錯誤追蹤系統）。 |

### Option B — 階段並行（Phase 2 加 Faro；Phase 5 驗收後拆 Sentry）— **推薦**

Phase 2 FE 重構時把 Faro web-sdk 加進來並走同一份 login flow；**保留 Sentry 三個 config 不動**，等 Phase 5 把 Faro dashboards + alerts 拉通、用實測錯誤事件驗收後，再在 Phase 5 尾或 Phase 6 初一次性拆 Sentry。

| Dimension | Assessment |
|---|---|
| 實作時間 | 中。Phase 2 多一個 SDK 的 wiring 工作；Phase 5 驗收項加幾條；一個獨立小 PR 拆 Sentry。 |
| 風險 | **低**。Faro 有問題時 Sentry 還在抓錯，Phase 5 驗收可以量化比對。 |
| 驗收難度 | 最低。有 Sentry 當 baseline 做 A/B 對照：同一週期內 Faro 應當抓到 >95% Sentry 抓到的 client error。 |
| 可回退性 | **最佳**。要回 Sentry 只要不執行 "拆除 PR" 即可。 |
| Cognitive load | Phase 2–5 期間略高（兩個 SDK 同時跑），但僅限於 dev / preview。 |
| Bundle 成本 | Client: Sentry browser bundle (~40–50 KB gzip) + Faro web-sdk (~25–30 KB gzip) 並存。**但此期間沒有正式流量**，bundle 成本實際只體現在 preview build 與 dev HMR 時間。 |
| Build 複雜度 | `next.config.ts` 的 `withSentryConfig` 保留；額外 Faro script tag / init 在 `app/layout.tsx` 加入。 |

### Option C — 不拆 Sentry，改用 Sentry-only + `@sentry/opentelemetry` bridge（放棄遷移 Faro）

Sentry v10 有 `@sentry/opentelemetry`，理論上可以當 OTel error collector 用，不需要 Faro。

| Dimension | Assessment |
|---|---|
| 對齊 Phase 5 目標 | **不吻合**。#115 明確是 "Faro → OTEL Go Correlations + Dashboards"；使用 Sentry 不符合 Grafana Cloud 單一 pane-of-glass 設計意圖。 |
| 成本 | Sentry quota 費用 vs. 已開通的 Grafana Cloud 免費額度（Phase 0 checklist 中 OPS 已被指派開通 Grafana Cloud stack）。 |
| 結論 | 只有在 Phase 5 發現 Faro 根本不夠用時才啟動，屬於 rollback 的極端情境，不是 Day-1 選項。 |

---

## Comparison

| Dimension | A — 一次性 | **B — 階段並行** | C — 不遷移 |
|---|---|---|---|
| Phase 2 風險 | 高 | **低** | n/a |
| 驗收可量化 | 否（無 baseline） | **是（A/B 對比）** | n/a |
| Bundle in prod | 最小 | 小（Sentry 僅於 dev/preview，上線前會拆） | 中（Sentry 保留） |
| 費用 (Grafana 已開通) | 最少 | 短期 2 份後長期 1 份 | Sentry quota |
| 與 #115 目標一致 | 是 | **是** | 否 |
| Rollback 成本 | 高（revert 大 PR） | **低（只要不執行拆除 PR）** | 無需 rollback |

---

## Recommendation

### **Option B — 階段並行**

**Verdict: RECOMMENDED — Option B**

並行到 Phase 5 驗收通過為止，再一次性拆 Sentry。

### Why

1. **A/B 驗收是唯一可量化的方法。** 沒有 Sentry 當 baseline，Phase 5 的「Faro 夠不夠用」只能主觀判斷；有了 baseline 可以寫成具體門檻（見 Rollback Criteria）。
2. **並行成本在此專案幾乎為零。** 唯一的實際成本（client bundle size）只體現在 preview / dev，Phase 8 才上線正式流量，屆時 Sentry 早已拆除。
3. **Sentry wrapper 本身已經有 kill-switch。** 沒有 `SENTRY_AUTH_TOKEN` 就自動停用 source-map upload；env 層面關 Sentry 只要清 `SENTRY_DSN`。因此 "並行期" 不等於 "雙倍 ingest" —— 可以選擇只開 preview。
4. **符合 Phase 5 目標語意。** #115 的 acceptance 包括 "Faro → OTEL correlations"；在 Phase 5 驗收 Faro 的同時還留著 Sentry，能直接拿 Sentry 的錯誤事件當 ground truth 對照。

### Why not A

主要是**驗收不可量化**。在一個還沒有上線流量的專案裡先拆 Sentry，等於把「Faro 到底吃不吃得到錯誤 + sourcemap 對位對不對」這個 unknown 留到 Phase 8 上線後才發現 —— 那個時候成本最高。

### Why not C

與 Phase 5 設計意圖衝突，且 OPS 已被指派開通 Grafana Cloud（#110 Phase 0 checklist）。C 只作為 rollback 極端分支存在。

---

## Rollback Criteria (quantitative)

並行期結束前，**Faro 必須同時滿足以下全部門檻**，才能在 Phase 5 尾部執行「拆除 Sentry」PR。任一未達，延後拆除並在 issue 上標記 blocker；連續兩次驗收週期（約 1 週）仍未達，則升級為 Option C（保留 Sentry）。

| 門檻 | 量化指標 | 驗證方式 |
|---|---|---|
| **R1. Error ingestion parity** | 於 Phase 5 驗收視窗內，Faro 擷取的 client-side JS errors ≥ **95%** 的同視窗內 Sentry issues 數（以 fingerprint 去重後比對）。 | 同步注入一組已知 errors（例如 `throw` 10 個不同的 Error），計數 Faro Loki `{service_name="faro"} \| json \| kind="error"` vs Sentry issues 出現數。 |
| **R2. Source-map 對位** | 對上述注入錯誤，Faro 的 stack trace ≥ **90%** 行號能對回原始碼（非 minified）。 | 人工抽檢 10 個錯誤的 stack trace 是否指回 `apps/dashboard/src/**/*.tsx`。 |
| **R3. Alert 觸發時間** | Grafana alert 從 error 發生到觸發 ≤ **60 s** P95。 | `sum(rate({service_name="faro"} \|= "error"[1m]))` rule + synthetic error injection。 |
| **R4. Dashboard 可觀測面** | Phase 5 dashboards 至少涵蓋：error rate、p99 LCP、JS bundle parse time、backend trace 關聯 click-through。 | #115 acceptance checklist。 |
| **R5. 成本信號** | Grafana Cloud free-tier 在 Phase 6 load testing 週內未觸發 throttling。 | Grafana usage dashboard + OPS 確認。 |

任一未達的處理：

- **R1 / R2 failed** → 延後拆除 Sentry 一週，檢查 `@grafana/faro-web-sdk` 版本與 Alloy sourcemap pipeline。
- **R3 failed** → 調整 alerting rule interval，不一定需要 rollback。
- **R4 failed** → dashboards 缺項不影響拆除決定，但須在此 issue 留筆並創 follow-up。
- **R5 failed** → 啟用 Option C 分支（保留 Sentry）並開 budget 討論。

---

## Migration Steps

### Phase 2（#112，FE 重構 + Faro wiring）— 預估 0.5–1 day 的觀測工作，嵌入 FE 任務

新增：

1. `apps/dashboard/package.json` dependencies: add `@grafana/faro-web-sdk`, `@grafana/faro-web-tracing`。
2. `apps/dashboard/src/app/faro.ts`（新檔）— 匯出 `initFaro()`，讀 `NEXT_PUBLIC_FARO_COLLECTOR_URL` + `NEXT_PUBLIC_FARO_APP_NAME`；未設時 no-op。
3. `apps/dashboard/src/app/layout.tsx` —— 在 root layout 呼叫 `initFaro()`（client component 或 `Script` beforeInteractive）。
4. `apps/dashboard/src/app/global-error.tsx` —— 補 `faro.api.pushError(error)` 在現有 `Sentry.captureException(error)` **旁邊**（並行）。不刪既有 Sentry 呼叫。
5. `.env.example` / `apps/dashboard/.env.example` —— 新增 `NEXT_PUBLIC_FARO_COLLECTOR_URL`、`NEXT_PUBLIC_FARO_APP_NAME`、`NEXT_PUBLIC_FARO_APP_VERSION`。
6. OPS（在 #122 中）—— 確認 Grafana Cloud Faro collector URL 已拿到。

**不改變**：Sentry 三個 config、`withSentryConfig`、source-map upload 邏輯。

**驗收**：preview build 綠 + 故意 `throw new Error("phase-2 smoke")` 同時在 Sentry issues 與 Grafana Loki `{service_name="faro"}` 看到。

### Phase 5（#115，observability 全鏈路驗收）— 預估 1 day 專門驗收

1. 執行 Rollback Criteria 表中的 R1–R5 驗收，寫入 Phase 5 的 QA 檢查清單。
2. 若全部通過：跑「拆除 Sentry」PR（下一節）。
3. 若未通過：保留 Sentry，在 issue 留筆延後。

### Phase 5 尾 — 拆除 Sentry PR（預估 0.5 day）

**刪除**：

- `apps/dashboard/sentry.client.config.ts`
- `apps/dashboard/sentry.server.config.ts`
- `apps/dashboard/sentry.edge.config.ts`
- `apps/dashboard/package.json` 依賴 `@sentry/nextjs`

**修改**：

- `apps/dashboard/next.config.ts` —— 移除 `withSentryConfig` wrapper，改 `export default nextConfig;`。一併刪除 `import { withSentryConfig } from "@sentry/nextjs";`（line 2）與 wrapper 設定（lines 25–39）。
- `apps/dashboard/src/app/global-error.tsx` —— 刪掉 `import * as Sentry from "@sentry/nextjs";`（line 3）與 `Sentry.captureException(error);`（line 13）。此時 `faro.api.pushError(error)` 已是唯一的 error 送出路徑。
- `.env.example` —— 刪除 `SENTRY_DSN`、`NEXT_PUBLIC_SENTRY_DSN`、`SENTRY_ORG`、`SENTRY_PROJECT`、`SENTRY_AUTH_TOKEN` 五個 keys。
- `pnpm-lock.yaml` —— 重跑 `pnpm install`。

**Vercel / CI env 清理**（OPS 協作）：

- 移除 preview / prod 的 `SENTRY_*` env vars（共 5 項）。
- 保留 `NEXT_PUBLIC_FARO_*` 三項。

**驗收** = `pnpm build` 綠 + preview 部署後注入 synthetic error，只在 Faro 看到（Sentry 端收不到）。

---

## Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Phase 2 Faro 初版 bundle 膨脹影響 preview 測試 | Faro web-sdk ~30 KB gzip，加在 beforeInteractive 或 layout 只影響 initial JS 一次；可接受。 |
| `@sentry/nextjs` + `withSentryConfig` 在 Next canary 上突然 break | 已經發生過類似 canary 升級 break lint 的案例（#110 checklist 提到）。並行期如果 Sentry wrapper 先掛，可直接拆；這反而讓 B 更安全（有 fallback）。 |
| Faro collector URL / token 未備好 | OPS #122 已列為 deliverable；若該 issue 延遲，本決定的 Phase 2 Faro wiring 會跟著延遲但不影響 Sentry 現狀。 |
| Grafana Cloud free-tier 吃不下 Phase 6 load test | Rollback Criteria R5；屆時啟用 Option C。 |
| `Sentry.captureException` 是 `global-error.tsx` 的唯一 error sink —— 若先拆 Sentry 再加 Faro 會有 gap | Migration Steps 強制「先加 Faro 再拆 Sentry」—— `global-error.tsx` 在並行期同時寫兩邊，拆除 PR 中才移除 Sentry 那一行。**這是此計畫最關鍵的排序。** |

---

## Files touched (summary)

**Phase 2 additions** (4 files changed, 0 deleted)：

- `apps/dashboard/package.json` — +2 deps
- `apps/dashboard/src/app/faro.ts` — new
- `apps/dashboard/src/app/layout.tsx` — +1 import / call
- `apps/dashboard/src/app/global-error.tsx` — +1 faro call (beside existing Sentry)
- `.env.example` — +3 keys

**Phase 5 removal** (5 files changed, 3 deleted)：

- `apps/dashboard/sentry.client.config.ts` — **delete**
- `apps/dashboard/sentry.server.config.ts` — **delete**
- `apps/dashboard/sentry.edge.config.ts` — **delete**
- `apps/dashboard/next.config.ts` — remove `withSentryConfig` wrapper
- `apps/dashboard/src/app/global-error.tsx` — remove Sentry import + call
- `apps/dashboard/package.json` — remove `@sentry/nextjs`
- `.env.example` — remove 5 `SENTRY_*` keys
- `pnpm-lock.yaml` — regenerate

---

## References

- `apps/dashboard/sentry.client.config.ts:1-15`
- `apps/dashboard/sentry.server.config.ts:1-12`
- `apps/dashboard/sentry.edge.config.ts:1-12`
- `apps/dashboard/src/app/global-error.tsx:3,13`
- `apps/dashboard/next.config.ts:2,25-39`
- `apps/dashboard/instrumentation.ts:1-10`（OTel already wired）
- `packages/otel/src/tracing.ts`（OTLP exporter, ready）
- Parent: #110 Phase 0 checklist
- Related: #112 Phase 2 (Faro wiring), #115 Phase 5 (observability end-to-end)
- Origin of Sentry: #83 (closed), #84 (closed, OTel+Sentry integration QA)
