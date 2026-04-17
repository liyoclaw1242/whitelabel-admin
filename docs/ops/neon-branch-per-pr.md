# Neon Branch-per-PR Strategy

## Chosen Approach: Option A — Neon GitHub Integration

The Neon GitHub integration auto-creates a database branch for each PR and cleans up on merge/close. This is the recommended approach for preview isolation.

## Current State

Currently using a **shared preview branch** for all PRs:
- `NEON_PREVIEW_URL` points to a single `preview` Neon branch
- All PRs share the same preview database

## Enabling Branch-per-PR

### Prerequisites

1. Install the [Neon GitHub Integration](https://neon.tech/docs/guides/neon-github-integration)
2. Connect to the `whitelabel-admin` repo
3. Configure branch creation rules

### Setup Steps

1. In Neon dashboard: Settings → Integrations → GitHub → Connect
2. Select the `liyoclaw1242/whitelabel-admin` repo
3. Configure:
   - Create branch on: PR opened
   - Delete branch on: PR merged or closed
   - Parent branch: `main`

### CI Changes Needed

Once enabled, update `migrate-preview` in `.github/workflows/ci.yml`:

```yaml
migrate-preview:
  steps:
    - run: go run ./cmd/migrate up
      env:
        DATABASE_URL: ${{ secrets.NEON_PREVIEW_URL_PR_${{ github.event.pull_request.number }} }}
```

Or use the Neon integration's automatic env injection if supported.

### Cleanup

The Neon integration handles cleanup automatically when PRs are merged or closed. No manual intervention needed.

## Environment Isolation Matrix

| Env | Neon Branch | JWT Keys | Grafana Stack | Faro Endpoint |
|-----|-------------|----------|---------------|---------------|
| Development | `dev` | dev-keypair | shared dev | dev collect URL |
| Preview (current) | `preview` (shared) | preview-keypair | shared dev | dev collect URL |
| Preview (future) | `pr-{N}` fork from main | preview-keypair | shared dev | dev collect URL |
| Production | `main` | prod-keypair | prod | prod collect URL |

Each environment's JWT keypair MUST be independent. Never share private keys across environments.
