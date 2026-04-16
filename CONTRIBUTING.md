# Contributing

This repository is **operated entirely by AI agents**. There are no human code
reviewers. The rules below optimize for **audit trail + CI gating + clean
history** rather than human approval ceremony.

> For the full rationale behind these rules, see the branching-strategy
> discussion linked from Epic #109. This file is the executable summary.

---

## Roles

All commits come from AI agents acting under one of these personas:

| Role | Responsibility |
|------|----------------|
| `arch` | Dispatcher, decomposes issues, reviews and merges PRs |
| `fe` | Frontend code (`apps/dashboard`, `packages/ui`) |
| `be` | Backend code (`apps/server`, `packages/otel`) |
| `ops` | CI/CD, infrastructure, deployment (`.github`, Vercel, Neon, Grafana) |
| `design` | UX, visual, accessibility specs |
| `qa` | Tests and verification reports (`test-plans/`) |
| `debug` | Observability instrumentation and incident forensics |

ARCH is both the author of dispatch PRs and the merge authority. Approvals
are **not** required on PRs — the merge gate is CI.

---

## Branching model: Trunk-Based

- Only **`main`** is permanent.
- Every change lands via a short-lived branch and a squash-merged PR.
- No `develop`, no `release/*`, no `hotfix/*` until post–Phase 8 (see Epic #109).

### Branch name format

```
<type>/<issue>-<short-slug>
```

Accepted `<type>` prefixes:

| Prefix | Use |
|--------|-----|
| `feat/` | New feature |
| `fix/` | Bug fix |
| `refactor/` | Behavior-preserving rework |
| `chore/` | Dependency bumps, file moves, renames |
| `docs/` | Docs only |
| `test/` | Tests only |
| `ops/` | CI / infra |
| `agent/<role>/` | Agent-managed work (primary branch type in this repo) |

Agent-managed branches must include the role: `agent/fe/112-login-page`,
`agent/be/113-auth-endpoints`, etc.

Existing dispatcher tooling may still emit the pre-existing form
`agent/<role>-<YYYYMMDDHHMM>/issue-<N>` — that variant is accepted.

### Rules

- Every branch must correspond to an open GitHub issue.
- Branches should live ≤ 3 days. If blocked, abandon and reopen.
- Merged branches are **auto-deleted**.
- Unmerged `agent/*` and `qa/*` branches are nightly-swept once merged.

---

## Commit messages

Conventional commits, required form:

```
<type>(<scope>?): <subject>
```

- `<type>`: one of the branch-type prefixes (`feat`, `fix`, `refactor`,
  `chore`, `docs`, `test`, `ops`).
- `<scope>` (optional): `fe`, `be`, `ui`, `otel`, `ops`, etc.
- `<subject>`: imperative, lowercase, no trailing period.

The **final commit** on a branch (or the squash-merge commit title) must
include `(closes #<issue>)`.

Example: `feat(be): RBAC middleware (closes #113)`

---

## Pull requests

### Requirements

- Every change lands through a PR. Direct push to `main` is blocked for
  all users, including administrators.
- All required CI checks must pass.
- `main` must be up to date (linear history enforced).
- PR body must follow the template in `.github/pull_request_template.md`.
- PR title matches the squash-merge commit message format above.

### Merge strategy

- **Squash merge only.** Rebase-merge and regular-merge are disabled.
- One PR = one commit on `main`.
- Squash-merge commit title uses the conventional-commit format.

### Review

- No approval requirement. ARCH self-merges after CI is green.
- The PR template fields (summary, test plan, risk & rollback) are the
  audit trail — fill them in honestly; an agent revisiting a bug
  months later will read them.

---

## Local development

```bash
pnpm install
pnpm dev                          # Start the dashboard at :3000
pnpm build                        # Production build
pnpm --filter dashboard exec tsc --noEmit
cd apps/server && go test ./...
```

### Pre-flight before pushing

The CI suite (`.github/workflows/ci.yml`) runs:

1. `pnpm --filter dashboard exec tsc --noEmit`
2. `pnpm --filter @whitelabel/otel typecheck`
3. `pnpm --filter dashboard build`
4. `go vet ./... && go test -race ./...` (in `apps/server`)

`@whitelabel/ui` typecheck is **temporarily disabled** pending Phase 0
(#110) cleanup of untracked shadcn files.

---

## Phase mapping (Epic #109)

Each Phase issue (#110–#118) spawns 3–15 short-lived PRs. There are no
long-lived "phase branches". Cross-phase dependencies are expressed in PR
descriptions (`Blocked by #N`), not in branch topology.

| Phase | Issue | Typical branches |
|-------|-------|------------------|
| 0 | #110 | `chore/*`, `refactor/*`, `ops/*` |
| 1 | #111 | `ops/*`, `feat/*` |
| 2 | #112 | `feat/*`, one `refactor/112-remove-sentry` |
| 3 | #113 | `feat/*`, `refactor/*` |
| 4 | #114 | `feat/*`, `ops/114-migrate-ci` |
| 5 | #115 | `feat/*` |
| 6 | #116 | `test/*` |
| 7 | #117 | `ops/*` |
| 8 | #118 | `ops/*`, `docs/*` |

---

## Cross-cutting changes

Any change that touches multiple packages or replaces a system (e.g.
Sentry → Faro) must be executed as **at most two PRs**:

1. Additive PR — new thing lives alongside the old.
2. Removal PR — old thing is deleted after ≤ 3-day parallel run.

Both PRs must link to the same tracking issue and include an explicit
rollback plan.

---

## Stale branch policy

- Merged `agent/*` and `qa/*` branches are deleted nightly by
  `.github/workflows/stale-branch-cleanup.yml`.
- Unmerged branches older than 14 days are flagged in the weekly ARCH
  report (not auto-deleted — may contain abandoned work worth salvaging).

---

## Summary card

```
Model      : Trunk-Based, short-lived branches, squash-merge only.
Gate       : CI green. No approval required.
Branches   : <type>/<issue>-<slug>  (agent/<role>/... for AI work)
Commits    : <type>(<scope>?): <subject>  →  squash-merge ends with (closes #N)
Merge auth : ARCH
Cleanup    : nightly sweep of merged agent/* and qa/*
```
