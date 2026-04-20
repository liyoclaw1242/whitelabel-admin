// smoke.js — minimal "does the target respond?" check.
// 1 VU × 30s against /api/health. Run first, before any heavier load.
//
// Env:
//   BASE_URL   defaults to https://whitelabel-admin-api.vercel.app
//
// Exit 0 = target is up and within SLO; non-zero = something's broken
// before we even start applying load.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://whitelabel-admin-api.vercel.app';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<2500'],        // tolerant of APAC driver
    checks: ['rate>0.99'],
  },
  tags: { scenario: 'smoke', target: BASE_URL },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'GET /api/health' },
  });
  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has db:connected': (r) => r.json('db') === 'connected',
  });
  sleep(1);
}
