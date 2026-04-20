// refresh-storm.js — stress the Postgres refresh_blacklist read path.
//
// Each VU, at first iteration, does login → logout once. That writes a
// JTI into refresh_blacklist. The captured cookie is then replayed on
// every subsequent iteration; the server should return 401 "refresh
// token revoked" every time. What we're measuring is how fast Postgres
// + pgx can answer the SELECT EXISTS check under concurrent read load.
//
// Env:
//   BASE_URL      https://whitelabel-admin-api.vercel.app
//   SEED_USERS    admin@example.com:password,editor@example.com:password,viewer@example.com:password
import http from 'k6/http';
import { check, sleep } from 'k6';
import exec from 'k6/execution';

const BASE_URL = __ENV.BASE_URL || 'https://whitelabel-admin-api.vercel.app';
const SEED_USERS = (__ENV.SEED_USERS || 'admin@example.com:password,editor@example.com:password,viewer@example.com:password')
  .split(',')
  .map((s) => {
    const [email, password] = s.split(':');
    return { email, password };
  });

export const options = {
  scenarios: {
    refresh_storm: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s',  target: 20  },
        { duration: '60s',  target: 50  },
        { duration: '120s', target: 100 },
        { duration: '60s',  target: 0   },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    'http_req_failed{name:POST /api/auth/refresh}': ['rate<0.01'],
    'http_req_duration{name:POST /api/auth/refresh}': ['p(95)<1500', 'p(99)<3000'],
    'checks{check:refresh returns 401}': ['rate>0.99'],
  },
  tags: { scenario: 'refresh-storm', target: BASE_URL },
};

let blacklistedCookie = null;

function loginAndLogoutOnce() {
  const user = SEED_USERS[exec.vu.idInTest % SEED_USERS.length];
  const login = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(user), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'setup login' },
  });
  if (login.status !== 200) {
    console.warn(`VU ${exec.vu.idInTest} login ${login.status}`);
    return null;
  }
  const cookieVal = login.cookies.whitelabel_refresh
    ? login.cookies.whitelabel_refresh[0].value
    : null;
  if (!cookieVal) return null;
  http.post(`${BASE_URL}/api/auth/logout`, null, {
    headers: { Cookie: `whitelabel_refresh=${cookieVal}` },
    tags: { name: 'setup logout' },
  });
  return cookieVal;
}

export default function () {
  if (blacklistedCookie === null) {
    blacklistedCookie = loginAndLogoutOnce();
    if (blacklistedCookie === null) return;
  }

  const res = http.post(`${BASE_URL}/api/auth/refresh`, null, {
    headers: { Cookie: `whitelabel_refresh=${blacklistedCookie}` },
    tags: { name: 'POST /api/auth/refresh' },
  });
  check(res, {
    'refresh returns 401': (r) => r.status === 401,
    'refresh body says revoked': (r) => (r.body || '').includes('revoked'),
  });
  sleep(0.2);
}
