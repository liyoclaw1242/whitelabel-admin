# Runbook — Whitelabel Admin

## 1. Token Management

### JWT Key Rotation (scheduled — every 90 days)

1. Generate new keypair:
   ```bash
   cd apps/server && go run ./cmd/keygen
   ```
2. Update Vercel env for the target environment:
   ```bash
   vercel env rm JWT_PRIVATE_KEY production --yes
   vercel env rm JWT_PUBLIC_KEY production --yes
   printf '%s' "$(cat private.pem)" | vercel env add JWT_PRIVATE_KEY production
   printf '%s' "$(cat public.pem)" | vercel env add JWT_PUBLIC_KEY production
   ```
3. Redeploy: `vercel redeploy <latest-deployment-url>`
4. All active sessions are invalidated — users must re-login

### Forced Logout-All

Blacklist all current refresh tokens by flushing the KV namespace:

```bash
# List all keys
curl -X GET "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces/$CF_KV_NAMESPACE_ID/keys" \
  -H "Authorization: Bearer $CF_API_TOKEN"

# Delete each key (or rotate JWT keys — all tokens become invalid)
```

Faster: rotate JWT keys (step above). All tokens fail validation immediately.

### Lost Key Emergency

If the private key is compromised:

1. **Immediately** rotate keys (see above)
2. Flush the KV blacklist (all refresh tokens are invalid anyway after key rotation)
3. Monitor login failure alert — expect a spike as users re-authenticate
4. Notify stakeholders via the on-call contacts

## 2. Migration

### New Migration Flow

1. Create migration files:
   ```bash
   cd apps/server
   go run ./cmd/migrate create <name>
   ```
2. Write `.up.sql` and `.down.sql` in `internal/db/migrations/`
3. Test locally: `DATABASE_URL="$NEON_DEV_URL" go run ./cmd/migrate up`
4. Open PR — `migrate-preview` CI job runs against preview DB
5. Merge — `migrate.yml` runs: preview → smoke → prod → verify

### Rollback Example

```bash
# Roll back last migration on production
DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate down 1

# Verify current version
DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate version
```

### Hotfix Path

For urgent schema fixes that can't wait for normal PR flow:

1. Pause Vercel auto-deploy (Settings → Git → disable)
2. Apply migration directly: `DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate up`
3. Verify the fix
4. Push the migration files to main via expedited PR
5. Re-enable auto-deploy

## 3. Disaster Recovery

### Neon Point-in-Time Recovery (PITR)

Neon retains 7 days of WAL history (free tier). To restore:

1. Neon dashboard → Branches → Create branch
2. Set "Branch from" to `main` at a specific timestamp
3. Name: `recovery-{date}-{time}`
4. Test the recovered branch with a local client
5. If valid: rename to `main` (or update `DATABASE_URL`)

### Neon Branch Restore (Fork)

```bash
# If neonctl is installed:
neonctl branches create --name dr-restore --parent main --point-in-time "2026-04-17T12:00:00Z"
```

### Vercel Rollback

1. Vercel dashboard → Deployments → find the last-known-good deploy
2. Click "..." → Promote to Production
3. Or via CLI: `vercel rollback`

### KV Backup

Cloudflare KV doesn't have built-in backup. To snapshot:

```bash
# Export all keys
curl "https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/storage/kv/namespaces/$CF_KV_NAMESPACE_ID/keys" \
  -H "Authorization: Bearer $CF_API_TOKEN" > kv-backup-$(date +%Y%m%d).json
```

The blacklist is ephemeral — losing it means revoked tokens become valid again until they expire naturally. Acceptable risk for the current scale.

## 4. Cost Monitoring

### Monthly Budgets

| Service | Free Tier | Warning Threshold | Action |
|---------|-----------|-------------------|--------|
| Grafana Cloud | 50 GB logs, 50 GB traces | 80% of quota | Reduce log verbosity |
| Neon | 0.5 GB storage, 100 hours compute | 80% of quota | Archive old branches |
| Vercel | 100 GB bandwidth, 100 hours edge | 80% of quota | Optimize static assets |
| Cloudflare KV | 100k reads/day, 1k writes/day | 80% of quota | Review blacklist TTL |
| Resend | 100 emails/day | 80 emails/day | Defer non-critical emails |

### Checking Usage

- **Grafana**: grafana.com → Org Settings → Usage
- **Neon**: console.neon.tech → Project → Usage
- **Vercel**: vercel.com → Settings → Usage
- **Cloudflare**: dash.cloudflare.com → Workers → KV → Analytics

### Budget Alert Setup

Set up billing alerts in each platform's dashboard. All platforms support email notifications at configurable thresholds.

## 5. On-Call Checklist

### Daily Dashboard Review

1. Open [Golden Signals dashboard](docs/grafana/golden-signals.json) in Grafana
2. Check:
   - [ ] p95 latency < 500ms
   - [ ] Error rate < 1%
   - [ ] No alert firing
3. Open [Auth Monitor dashboard](docs/grafana/auth-monitor.json)
4. Check:
   - [ ] Login failure rate < 10%
   - [ ] Refresh rotation healthy
   - [ ] No unusual 429 rate-limit spikes
   - [ ] No suspicious audit log entries (mass deletes, etc.)

### Weekly

- [ ] Review Neon branch count (clean up stale preview branches)
- [ ] Check KV blacklist size (should be < 1000 entries)
- [ ] Verify secret rotation calendar (next rotation due date)

### Escalation Contacts

| Level | Who | Channel |
|-------|-----|---------|
| L1 | OPS agent | GitHub issue with `bug` label |
| L2 | Repo owner (@liyoclaw1242) | Direct (see project memory for handles) |
| L3 | Stakeholder reviewers | Per-repo handles in project memory |
