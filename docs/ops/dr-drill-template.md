# DR Drill Record — {DATE}

## Overview

| Field | Value |
|-------|-------|
| Date | {DATE} |
| Operator | {AGENT_ID or user} |
| Duration | {total time} |
| Result | PASS / FAIL |

## Steps

### 1. Fork Neon prod branch

```bash
neonctl branches create --name dr-test-{date} --parent main
```

- Start time: {HH:MM}
- Branch created: Yes / No
- Connection string obtained: Yes / No

### 2. Verify forked branch has current data

```bash
DATABASE_URL="<fork-url>" psql -c "SELECT count(*) FROM users; SELECT count(*) FROM audit_logs;"
```

- Row counts match production: Yes / No
- Data appears current: Yes / No

### 3. Point test client at forked branch

```bash
DATABASE_URL="<fork-url>" go run ./cmd/api
curl http://localhost:8080/api/health
```

- Health check returns 200: Yes / No
- Login works: Yes / No
- Audit log written: Yes / No

### 4. Delete the fork

```bash
neonctl branches delete dr-test-{date}
```

- Branch deleted: Yes / No
- No orphaned resources: Yes / No

## Timing

| Step | Duration |
|------|----------|
| Fork creation | {time} |
| Data verification | {time} |
| App smoke test | {time} |
| Cleanup | {time} |
| **Total** | **{time}** |

## Observations

{Any issues, surprises, or improvements noted during the drill}

## Action Items

- [ ] {Follow-up items from the drill}
