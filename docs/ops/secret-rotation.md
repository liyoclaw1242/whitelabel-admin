# Secret Rotation

## Rotation Schedule

| Secret | Rotation Period | Reason |
|--------|----------------|--------|
| `JWT_PRIVATE_KEY` / `JWT_PUBLIC_KEY` | 90 days | RS256 keypair — compromise window mitigation |
| `CF_API_TOKEN` | 180 days | Cloudflare API token — limited blast radius (KV only) |
| `RESEND_API_KEY` | 180 days | Email sending — low risk, rotate on schedule |
| `DATABASE_URL` | On compromise only | Neon connection string — rotate password via Neon dashboard |
| `OTEL_EXPORTER_OTLP_HEADERS` | On compromise only | Grafana ingest auth — low risk (write-only) |
| `GRAFANA_FARO_APP_KEY` | On compromise only | Faro app key — public by design (client-side) |
| `VERCEL_TOKEN` | 180 days | Vercel deploy token — high privilege |

## JWT Key Rotation Procedure

### 1. Generate New Keypair

```bash
cd apps/server
go run ./cmd/keygen
```

### 2. Update Vercel Env (per environment)

```bash
vercel env rm JWT_PRIVATE_KEY production --yes
vercel env rm JWT_PUBLIC_KEY production --yes
printf '%s' "$(cat private.pem)" | vercel env add JWT_PRIVATE_KEY production
printf '%s' "$(cat public.pem)" | vercel env add JWT_PUBLIC_KEY production
```

Repeat for preview and development.

### 3. Redeploy

```bash
vercel redeploy <latest-deployment-url>
```

### 4. Verify

Existing sessions using the old public key will fail validation. Users will need to re-login. This is expected and acceptable for a 90-day rotation.

## Cloudflare API Token Rotation

1. Cloudflare dashboard → My Profile → API Tokens
2. Create new token with same permissions (Account > Workers KV Storage > Edit)
3. Update Vercel env: `vercel env rm CF_API_TOKEN production --yes && printf '<new-token>' | vercel env add CF_API_TOKEN production`
4. Repeat for preview/development
5. Redeploy
6. Delete old token in Cloudflare dashboard

## Emergency Rotation (Compromise)

If a secret is compromised:

1. **Immediately** rotate the affected secret using the steps above
2. Redeploy all environments
3. If JWT keys compromised: all active sessions are invalidated (users re-login)
4. If DATABASE_URL compromised: reset password in Neon dashboard, update all environments
5. Document the incident in a GitHub issue
