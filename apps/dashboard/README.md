# Dashboard

Next.js 16 App Router frontend for the whitelabel admin project.

Deployed as `whitelabel-admin-dashboard` on Vercel, git-linked to this
repo's `apps/dashboard/` rootDirectory. The Ignored Build Step on that
project skips deploys when no files under `apps/dashboard/`, `packages/`,
or `pnpm-lock.yaml` changed.

## Local dev

```sh
pnpm --filter dashboard dev
```

## Backend proxy

`/api/*` is rewritten to `BACKEND_URL` in `next.config.ts`.
