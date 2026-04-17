# Migration Rollback

## When to Use `.down.sql`

Safe for schema-only changes with no data loss risk:

- Adding a column (down = drop column, no user data in it yet)
- Creating a new table (down = drop table)
- Adding an index (down = drop index)

Run:

```bash
DATABASE_URL="<target-url>" go run ./cmd/migrate down 1
```

## When to Intervene Manually

Required for data-destructive changes or production recovery:

- Dropping a column that has user data
- Renaming a table or column (down.sql can't restore lost references)
- Any migration that ran partially (dirty state)
- Production incident where rollback timing matters

## Production Rollback Procedure

### 1. Pause Deploys

Disable auto-deploy on Vercel to prevent new code from running against the rolled-back schema.

```bash
# In Vercel dashboard: Settings → Git → Disable auto-deploy
# Or cancel any in-flight deployments
```

### 2. Run Rollback

```bash
DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate down 1
```

To roll back multiple steps:

```bash
DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate down <N>
```

### 3. Verify

```bash
DATABASE_URL="$NEON_PROD_URL" go run ./cmd/migrate version
```

Confirm the schema version matches the code that's currently deployed.

### 4. Resume Deploys

Re-enable auto-deploy on Vercel. If the rollback was triggered by a bad merge, revert the merge commit first.

## Who to Notify

- **ARCH agent**: route an issue with `status:blocked` describing the incident
- **Repo owner** (@liyoclaw1242): for any production data loss or extended downtime
- **Stakeholder reviewers**: see project memory for handles per repo

## Dirty State Recovery

If a migration failed partway (golang-migrate marks the version as "dirty"):

```bash
# Force the version to the last known-good migration number
DATABASE_URL="<url>" go run ./cmd/migrate force <version>
```

Then re-run or roll back from the clean state.
