# k6 load tests

Four scenarios, ramping from a trivial smoke to a real Postgres
contention test. All target the deployed production BE by default
(`whitelabel-admin-api.vercel.app`). Run them in order; if an earlier
scenario fails its thresholds, don't push harder.

| Scenario | File | Peak VUs | Duration | What it presses |
|---|---|---|---|---|
| smoke | `smoke.js` | 1 | 30s | Is the target alive? |
| health-load | `health-load.js` | 100 | ~9 min | Cold pgx pool ping under pure read load |
| auth-flow | `auth-flow.js` | 50 | ~9 min | JWT verify + `/me` + occasional full login chain |
| refresh-storm | `refresh-storm.js` | 100 | ~5 min | Postgres `refresh_blacklist` EXISTS check |

## Prereqs

```sh
brew install k6            # k6 >= 1.7
```

Seed accounts used by the two auth-touching scenarios are the three
seeded by migration 000009 (admin/editor/viewer, password `password`).

## Running

```sh
./run.sh all                   # everything, ~22 min
./run.sh smoke                 # just the smoke
./run.sh health-load
./run.sh auth-flow
./run.sh refresh-storm
```

Per-run JSON summaries land in `../k6-runs/`. Open the Grafana
dashboards in another tab while the test runs:

- <https://liyoclaw1242.grafana.net/d/golden-signals-whitelabel>
- <https://liyoclaw1242.grafana.net/d/auth-monitor-whitelabel>

## Env overrides

```sh
BASE_URL=http://localhost:4400 ./run.sh smoke                     # local vercel dev
BASE_URL=https://whitelabel-admin-dashboard.vercel.app ./run.sh smoke
SEED_USERS='a@x.com:pw,b@x.com:pw' ./run.sh auth-flow             # bring your own users
PCT_FULL_CYCLE=50 ./run.sh auth-flow                              # half the iterations do full login
```

## Thresholds

Sized for a driver running reasonably close to the target (< 100ms
network RTT). For a driver far from the target — e.g. an APAC laptop
hitting Vercel iad1 functions that talk to Neon ap-southeast-1 — the
base latency alone can be 500-800 ms; widen `p(95)` thresholds
accordingly when re-running, or accept the threshold breach as a known
driver-location artefact (see `docs/testing/k6-runs/*.md`).

| Scenario | Metric | Threshold |
|---|---|---|
| smoke | http_req_duration p95 | < 2.5 s |
| smoke | http_req_failed | rate < 1% |
| health-load | http_req_duration p95 / p99 | < 2.5 s / 5 s |
| health-load | http_req_failed | rate < 1% |
| auth-flow | /me p95 / p99 | < 3 s / 6 s |
| auth-flow | /me failed | rate < 2% |
| refresh-storm | /refresh p95 / p99 | < 1.5 s / 3 s |
| refresh-storm | blacklist returns 401 | > 99% of calls |

## Known caveats

- `/api/auth/login` has a 5 req/min per (IP+email) rate limit. Scripts
  do one login per seed user in `setup()` or one per VU at init to stay
  under it.
- Neon free tier: 100 compute hours/month. One full `run.sh all`
  spends well under 1 hour of active compute.
- Vercel Hobby fn max duration is 10 s; none of these scenarios
  approach it.
- Audit middleware currently WARN-logs every pre-auth request
  (issue #200). Expect 5-10× WARN log volume during runs until fixed.

## Archiving a baseline

After a representative run:

```sh
mkdir -p ../k6-runs/baselines
cp ../k6-runs/20260420-*.json ../k6-runs/baselines/
```

Write a markdown summary next to the JSON (see
`docs/testing/k6-runs/20260420-031554-health-load.md` as a template)
with p95/p99 per endpoint and the driver location. Future regressions
diff against this baseline.
