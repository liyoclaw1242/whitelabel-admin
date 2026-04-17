# Branch Protection Rules

## Current Status

Branch protection requires GitHub Pro plan or a public repo. As of Phase 7, the repo is private on a free plan, so these rules are **documented but not enforced**.

When the repo upgrades to Pro or goes public, apply these rules to `main`:

## Intended Rules for `main`

| Rule | Value |
|------|-------|
| Require pull request before merging | Yes |
| Required approvals | 1 |
| Require status checks to pass | Yes |
| Required checks | `lint`, `typecheck`, `vitest`, `go-test`, `build` |
| Require branches to be up to date | Yes |
| Require conversation resolution | No (agent PRs don't have conversations) |
| Allow force pushes | No |
| Allow deletions | No |

## How to Apply

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["lint","typecheck","vitest","go-test","build"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null
```

## Notes

- `migrate-preview` is intentionally excluded from required checks — it will fail until `cmd/migrate` (#164) ships
- `e2e` runs on `deployment_status`, not on PR, so it can't be a required check
- Agent PRs (from the agent-team system) are auto-merged by ARCH after QA pass — the 1-approver rule is satisfied by ARCH's merge action
