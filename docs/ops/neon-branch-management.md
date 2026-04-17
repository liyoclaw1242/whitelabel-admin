# Neon Branch Management

## Branch Layout

| Neon Branch | Environment | Vercel Secret | Purpose |
|-------------|-------------|---------------|---------|
| `main` | Production | `NEON_PROD_URL` | Live data, migrated on push to main |
| `preview` | Preview / Dev | `NEON_PREVIEW_URL` | PR preview deploys + local dev |
| `dev` | Development | `NEON_DEV_URL` | Shared dev experiments (optional) |

## Reset Preview Branch

Use when preview data is stale or migrations drifted from main.

```bash
# Via Neon dashboard: Branches → preview → Reset from parent
# Or via CLI (if neonctl is installed):
neonctl branches reset preview --parent
```

After reset, re-run migrations against the preview branch:

```bash
DATABASE_URL="<NEON_PREVIEW_URL>" go run ./cmd/migrate up
```

## Fork for Isolated Migration Testing

Create a throwaway branch from main to test a migration before merging:

```bash
neonctl branches create --name test-migration-123 --parent main
```

Run the migration against the fork:

```bash
DATABASE_URL="<fork-connection-string>" go run ./cmd/migrate up
```

Verify, then delete:

```bash
neonctl branches delete test-migration-123
```

## Manual Rollback

See `migration-rollback.md` for the full procedure.

Quick rollback (last migration only):

```bash
DATABASE_URL="<target-branch-url>" go run ./cmd/migrate down 1
```
