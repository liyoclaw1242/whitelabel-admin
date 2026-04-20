// health-load.js — pure read pressure on /api/health.
// Drives the pgx pool ping + Neon compute without involving auth, so
// what we measure is the request-path baseline.
//
// Stages: 0→10→50 (hold)→100 (hold)→0 over ~9 min.
//
// Env:
//   BASE_URL   defaults to https://whitelabel-admin-api.vercel.app
//
// Thresholds (fail the run if breached). These are sized to a
// driver running near the target. If you run k6 from far away
// (APAC laptop against iad1 functions against ap-southeast-1 DB),
// widen p95 to ~2.5 s or override on the command line.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'https://whitelabel-admin-api.vercel.app';

const non2xx = new Counter('health_non_2xx');

export const options = {
  stages: [
    { duration: '60s',  target: 10  },
    { duration: '60s',  target: 50  },
    { duration: '180s', target: 50  },
    { duration: '60s',  target: 100 },
    { duration: '120s', target: 100 },
    { duration: '60s',  target: 0   },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2500', 'p(99)<5000'],
    checks: ['rate>0.99'],
  },
  tags: { scenario: 'health-load', target: BASE_URL },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'GET /api/health' },
  });
  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'db connected': (r) => r.json('db') === 'connected',
  });
  if (!ok) non2xx.add(1);
  sleep(1);
}
