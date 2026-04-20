# Grafana as code

Every JSON in this directory is synced to
[`liyoclaw1242.grafana.net`](https://liyoclaw1242.grafana.net) by
`scripts/grafana-sync.sh`. The script **upserts** (no delete-then-recreate
dance — the APIs support in-place update) and **prunes orphans** (anything
in the target folder that's no longer in the repo is removed on the next
sync).

## What's in the folder

| File | Shape | Where it lands |
|---|---|---|
| `golden-signals.json` | Dashboard (RED-method) | folder `whitelabel-alerts` |
| `auth-monitor.json`   | Dashboard (auth-flow specific) | folder `whitelabel-alerts` |
| `alerting-rules.json` | Alert rule group (6 rules) | folder `whitelabel-alerts`, rule group `whitelabel-alerts` |

Shape detection is automatic: files with `.dashboard` → `POST /api/dashboards/db`;
files with `.rules` → per-rule upsert on `/api/v1/provisioning/alert-rules`.

Datasource placeholders `${DS_TEMPO}` / `${DS_LOKI}` are substituted at
sync time with the stack's real datasource UIDs
(`grafanacloud-traces` / `grafanacloud-logs` by default).

## Sync triggers

- **Auto**: `.github/workflows/grafana-sync.yml` runs on every push to
  `main` that touches `docs/grafana/**`, the sync script itself, or the
  workflow. Required repo secret: `GRAFANA_TOKEN`. Optional repo
  variables: `GRAFANA_URL`, `GRAFANA_FOLDER`, `DS_TEMPO_UID`, `DS_LOKI_UID`.
- **Manual (local)**: set `GRAFANA_TOKEN` and `GRAFANA_URL` then run
  `./scripts/grafana-sync.sh`. Pass `--no-prune` to skip the orphan
  cleanup.
- **Manual (CI)**: `gh workflow run grafana-sync.yml` (uses the
  `workflow_dispatch` trigger).

## Adding a dashboard

1. Export the dashboard JSON from Grafana (Dashboards → share → export →
   check "Export for sharing externally" so datasource UIDs are emitted
   as `${DS_TEMPO}` style placeholders).
2. Drop the JSON here with a descriptive filename.
3. Commit + push to main.
4. Workflow applies it; ignore orphan prune mentions if this is the
   first time (it won't affect anything).

## Adding an alert rule

1. Edit `alerting-rules.json` (or create a new `*.json` with the same
   `{folder, interval, rules: [...]}` shape — both are supported).
2. Make sure each Tempo query's `model` has `"queryType": "traceql"`.
3. Datasource UIDs inside each rule MUST be one of the placeholders
   `${DS_TEMPO}` / `${DS_LOKI}` or `__expr__` (for math/reduce nodes).
4. Commit + push.

## Known issue

4 of the 6 rules in `alerting-rules.json` evaluate with `health: error`
because their math nodes expect scalars but the TraceQL queries return
time series — they need Reduce expressions between the queries and the
math. Tracked in issue #195 (`agent:ops`, `status:ready`).
