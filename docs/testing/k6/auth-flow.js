// auth-flow.js — realistic signed-in session pressure.
// setup() logs in once per seed user (amortises the 5 req/min/IP+email
// rate limit so we don't trip it from inside default()). Each VU then
// reuses a pre-issued access token and exercises /api/auth/me, which
// is the hot path for every page load of an authenticated dashboard.
//
// Every N% of iterations (PCT_FULL_CYCLE) a VU performs the full
// login→/me→logout chain, exercising the Postgres blacklist write
// path, so the test isn't purely "read with a cached token".
//
// Env:
//   BASE_URL            https://whitelabel-admin-api.vercel.app
//   SEED_USERS          admin@example.com:password,editor@example.com:password,viewer@example.com:password
//   PCT_FULL_CYCLE      20 — percent of iterations doing login→logout; default 20
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'https://whitelabel-admin-api.vercel.app';
const SEED_USERS = (__ENV.SEED_USERS || 'admin@example.com:password,editor@example.com:password,viewer@example.com:password')
  .split(',')
  .map((s) => {
    const [email, password] = s.split(':');
    return { email, password };
  });
const PCT_FULL_CYCLE = Number(__ENV.PCT_FULL_CYCLE || 20);

export const options = {
  stages: [
    { duration: '60s',  target: 10 },
    { duration: '60s',  target: 30 },
    { duration: '180s', target: 30 },
    { duration: '60s',  target: 50 },
    { duration: '120s', target: 50 },
    { duration: '60s',  target: 0  },
  ],
  thresholds: {
    'http_req_failed{name:GET /api/auth/me}': ['rate<0.02'],
    'http_req_duration{name:GET /api/auth/me}': ['p(95)<3000', 'p(99)<6000'],
    checks: ['rate>0.98'],
  },
  tags: { scenario: 'auth-flow', target: BASE_URL },
};

export function setup() {
  const tokens = [];
  for (const u of SEED_USERS) {
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(u), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'setup login' },
    });
    if (res.status === 200) {
      tokens.push(res.json('access_token'));
    } else {
      console.error(`setup login failed for ${u.email}: ${res.status} ${res.body}`);
    }
  }
  if (tokens.length === 0) throw new Error('setup: no tokens obtained');
  return { tokens };
}

export default function (data) {
  const token = data.tokens[__VU % data.tokens.length];

  // 80% of iterations: just GET /me (the hot path)
  if (Math.random() * 100 >= PCT_FULL_CYCLE) {
    const res = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'GET /api/auth/me' },
    });
    check(res, {
      '/me is 200': (r) => r.status === 200,
      '/me has user.email': (r) => r.json('user.email') !== undefined,
    });
    sleep(1);
    return;
  }

  // 20% of iterations: full login → me → logout chain.
  // Picks a seed user round-robin so we share the (ip,email) rate-limit budget.
  const user = SEED_USERS[__VU % SEED_USERS.length];
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'POST /api/auth/login' },
  });
  const rateLimited = loginRes.status === 429;
  check(loginRes, {
    'login 200 or 429': (r) => r.status === 200 || r.status === 429,
  });
  if (rateLimited || loginRes.status !== 200) {
    sleep(2);
    return;
  }
  const freshToken = loginRes.json('access_token');
  const cookies = loginRes.cookies;

  const meRes = http.get(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${freshToken}` },
    tags: { name: 'GET /api/auth/me' },
  });
  check(meRes, { '/me is 200 after login': (r) => r.status === 200 });

  const cookieHeader = cookies.whitelabel_refresh
    ? `whitelabel_refresh=${cookies.whitelabel_refresh[0].value}`
    : '';
  const logoutRes = http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: { Cookie: cookieHeader },
    tags: { name: 'POST /api/auth/logout' },
  });
  check(logoutRes, { 'logout 204': (r) => r.status === 204 });

  sleep(1);
}
