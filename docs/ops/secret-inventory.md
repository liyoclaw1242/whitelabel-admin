# Secret Inventory

Last updated: 2026-04-17 by `ops-20260415-1506114`

## Vercel Environment Variables

| Variable | Dev | Preview | Prod | Source | Notes |
|----------|-----|---------|------|--------|-------|
| `DATABASE_URL` | Yes | Yes | Yes | Neon (#138) | Pooled connection per branch |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Yes | Yes | Yes | Grafana Cloud (#138) | Tempo OTLP HTTP ingest |
| `OTEL_EXPORTER_OTLP_HEADERS` | Yes | Yes | Yes | Grafana Cloud (#138) | Basic auth header |
| `GRAFANA_FARO_URL` | Yes | Yes | Yes | Grafana Cloud (#138) | Faro collect endpoint |
| `GRAFANA_FARO_APP_KEY` | Yes | Yes | Yes | Grafana Cloud (#138) | Faro app identifier |
| `NEXT_PUBLIC_GRAFANA_FARO_URL` | Yes | Yes | Yes | Grafana Cloud (#138) | Client-side Faro URL |
| `NEXT_PUBLIC_GRAFANA_FARO_APP_KEY` | Yes | Yes | Yes | Grafana Cloud (#138) | Client-side Faro key |
| `JWT_PRIVATE_KEY` | Yes | Yes | Yes | Generated via `apps/server/cmd/keygen` | Per-env RS256 private key |
| `JWT_PUBLIC_KEY` | Yes | Yes | Yes | Generated via `apps/server/cmd/keygen` | Per-env RS256 public key |
| `BACKEND_URL` | Yes | Yes | Yes | Set to server project alias | Dashboard's Next.js rewrite proxy target |
| `NEXT_PUBLIC_USE_MOCK_API` | No | No | Yes | OPS (#162) | Temporary — remove when real API live |

Cloudflare envs (`CF_API_TOKEN`, `CF_ACCOUNT_ID`, `CF_KV_NAMESPACE_ID`)
were removed when the refresh blacklist moved from Cloudflare KV to a
Postgres table (`refresh_blacklist`, migration 000010). See the
`pkg/blacklist/pg.go` impl.

### Not Yet Set

| Variable | Reason | Blocker |
|----------|--------|---------|
| `RESEND_API_KEY` | Transactional email | Resend account — deferred; notification flows not wired yet |

## GitHub Actions Secrets

| Secret | Purpose | Set By |
|--------|---------|--------|
| `NEON_PROD_URL` | Production Neon connection | User (#138) |
| `NEON_PREVIEW_URL` | Preview Neon connection | User (#138) |
| `NEON_DEV_URL` | Dev Neon connection | User (#138) |

### Not Yet Set

| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel CLI deploy in release.yml |
| `VERCEL_ORG_ID` | Vercel org for release.yml |
| `VERCEL_PROJECT_ID` | Vercel project for release.yml |

## Local Development

See `apps/dashboard/.env.local.example` for the complete variable list with defaults.
