# Whitelabel Admin

A white-label admin dashboard with a split Next.js front-end and Go
serverless back-end, deployed as two Vercel projects that share one
Neon Postgres database.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Go 1.25+
- golang-migrate (`brew install golang-migrate`)
- libpq / `psql` (only needed for manual Neon queries; `brew install libpq`)

## Repository layout

```
whitelabel-admin/
├── apps/
│   ├── dashboard/          # Next.js App Router (FE)
│   ├── server/             # Go serverless (BE)
│   └── storybook/          # Storybook 8 + Vite (component gallery)
├── packages/
│   ├── ui/                 # @whitelabel/ui — shared shadcn v4 components
│   └── otel/               # @whitelabel/otel — shared OTel config for dashboard
├── docs/
│   ├── runbook.md          # On-call + rotation procedures
│   ├── grafana/            # Dashboards + alert rules (JSON)
│   ├── ops/                # secret-inventory, dr-drill-template, migration-rollback, …
│   ├── decisions/          # ADRs
│   └── api/openapi.yaml    # Source of truth for BE contract
└── .github/workflows/      # ci.yml / migrate.yml / release.yml / e2e.yml
```

See [`arch.md`](arch.md) for the full architecture write-up.

## Local development

### Frontend (apps/dashboard)

```bash
pnpm install
pnpm dev                        # Next.js dev on http://localhost:3000
```

Copy `apps/dashboard/.env.local.example` → `apps/dashboard/.env.local`
and fill in at minimum:

```
BACKEND_URL=http://localhost:8080          # or your deployed server alias
NEXT_PUBLIC_GRAFANA_FARO_URL=...           # optional — disables RUM if blank
NEXT_PUBLIC_GRAFANA_FARO_APP_KEY=...
```

### Backend (apps/server)

```bash
cd apps/server

# Option A: local net/http server (cmd/api/main.go)
export DATABASE_URL="<Neon pooled URL>"
export JWT_PRIVATE_KEY="$(cat private.pem)"
export JWT_PUBLIC_KEY="$(cat public.pem)"
go run ./cmd/api                 # listens on :8080

# Option B: simulate Vercel Go runtime
vercel dev --listen 4400         # reads apps/server/.env.local via shell, see below
```

For `vercel dev`, `.env.local` in `apps/server/` **does not** get
loaded by the Go runtime — export the vars in your shell or use
`set -a; source .env.local; set +a; vercel dev`.

### Migrations

```bash
cd apps/server
cp .env.migrate.example .env.migrate   # then fill in DATABASE_URL_DIRECT (NON-pooled)
./scripts/migrate.sh up                # up / down [N] / version / force <N>
```

Or directly against any branch:

```bash
DATABASE_URL="<direct URL>" go run ./cmd/migrate up
```

Migrations live at `apps/server/migrations/*.sql` and are embedded via
`migrations/embed.go`, so the deployed binary runs without the source
tree present.

### Generating a JWT keypair

```bash
cd apps/server
go run ./cmd/keygen              # prints PRIVATE KEY + PUBLIC KEY PEM blocks to stdout
```

## Deployment

Two Vercel projects, both git-linked to `main` on this repo:

| Project | Root | Hosts | Alias |
|---|---|---|---|
| `whitelabel-admin-server` | `apps/server/` | Go serverless (`api/catchall.go`) | `whitelabel-admin-api.vercel.app` |
| `whitelabel-admin-dashboard` | `apps/dashboard/` | Next.js | `whitelabel-admin-dashboard.vercel.app` |

Each project has an **Ignored Build Step** that skips the deploy when
no files under the relevant paths changed, so a pure FE commit doesn't
rebuild the Go server and vice versa. A tag push (`git tag v* &&
git push --tags`) triggers `.github/workflows/release.yml` for the full
CI → migrate-prod → smoke cycle.

### Test accounts (seeded via migration 000009)

All with password `password` (update after first login):

| Email | Role |
|---|---|
| admin@example.com | admin (all 11 permissions) |
| editor@example.com | editor (items:* + users:read) |
| viewer@example.com | viewer (items:read + users:read) |

## Observability

- **Traces** (BE): Grafana Cloud Tempo via OTLP/HTTP — see `apps/server/pkg/otel/provider.go`
- **RUM** (FE): Grafana Faro — see `apps/dashboard/src/components/providers/FaroProvider.tsx`
- **Dashboards**: `docs/grafana/*.json` (import via Grafana UI)
- **Alert rules**: provisioned via `POST /api/v1/provisioning/alert-rules` — see the runbook for the service-account token flow

## Key docs

- [`arch.md`](arch.md) — architecture, folder structure, data flows, tech debt
- [`docs/runbook.md`](docs/runbook.md) — on-call procedures
- [`docs/ops/secret-inventory.md`](docs/ops/secret-inventory.md) — which secrets live where
- [`docs/ops/dr-drill-template.md`](docs/ops/dr-drill-template.md) — DR drill checklist
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — branch / commit / PR conventions
