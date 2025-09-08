/**
 * Consistency Test: Players View vs Team Dashboard
 * Compares aggregated values from /api/performance/stats/players with /api/dashboard/stats/team
 * Period: 2025-07-01 to 2025-08-31
 */

import http from 'http';
import { request as httpsRequest } from 'https';

const BASE_URL = 'http://localhost:3001';
const PERIOD_QUERY = 'period=custom&startDate=2025-07-01&endDate=2025-08-31';
const TEST_USER = {
  email: process.env.TEST_EMAIL || 'acanfora19811@gmail.com',
  password: process.env.TEST_PASSWORD || 'test',
};

function makeHttpOrHttpsRequest(url, options = {}, bodyObj) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const isHttps = u.protocol === 'https:';
    const mod = isHttps ? httpsRequest : http.request;
    const req = mod(u, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      const setCookie = res.headers['set-cookie'];
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, cookies: setCookie });
        } catch (e) {
          resolve({ status: res.statusCode, data, cookies: setCookie });
        }
      });
    });
    req.on('error', reject);
    if (bodyObj) req.write(JSON.stringify(bodyObj));
    req.end();
  });
}

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(JSON.stringify(options.body));
    req.end();
  });
}

function pctDiff(a, b) {
  if (a === 0 && b === 0) return 0;
  if (b === 0) return Infinity;
  return Math.abs((a - b) / b) * 100;
}

async function run() {
  console.log('\n🧪 Consistency Test: Players View vs Team Dashboard');
  console.log('Periodo: 2025-07-01 → 2025-08-31');

  // 0) Login to obtain cookies
  const loginRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/auth/login`, { method: 'POST' }, TEST_USER);
  if (loginRes.status !== 200) {
    console.error('❌ Login error:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const cookieHeader = (loginRes.cookies || []).map((c) => c.split(';')[0]).join('; ');

  // 1) Fetch Players View data (authenticated)
  const playersRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/performance/stats/players?${PERIOD_QUERY}`, { headers: { Cookie: cookieHeader } });
  if (playersRes.status !== 200) {
    console.error('❌ Players API error:', playersRes.status, playersRes.data);
    process.exit(1);
  }

  const players = Array.isArray(playersRes.data?.players) ? playersRes.data.players : [];
  const sumHSRPlayers = Math.round(players.reduce((s, p) => s + (Number(p?.hsr) || 0), 0));
  const maxTopSpeedPlayers = Math.max(0, ...players.map((p) => Number(p?.topSpeed) || 0));
  const avgPlMinPlayers = players.length > 0
    ? players.reduce((s, p) => s + (Number(p?.plMin) || 0), 0) / players.length
    : 0;

  console.log('📦 Players View Aggregates:');
  console.log('  - Sum HSR (players):', sumHSRPlayers);
  console.log('  - Max Top Speed (players):', maxTopSpeedPlayers.toFixed(2), 'km/h');
  console.log('  - Avg PL/min (players simple avg):', avgPlMinPlayers.toFixed(3));

  // 2) Fetch Team Dashboard data
  const teamRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/dashboard/stats/team?${PERIOD_QUERY}&aggregate=true`, { headers: { Cookie: cookieHeader } });
  if (teamRes.status !== 200) {
    console.error('❌ Team Dashboard API error:', teamRes.status, teamRes.data);
    process.exit(1);
  }

  const teamData = teamRes.data?.data || {};
  const teamSpeed = teamData.speed || {};
  const teamSummary = teamData.summary || {};

  const totalHSRTeam = Math.round(Number(teamSpeed.totalHSR) || 0);
  const avgMaxSpeedTeam = Number(teamSummary.avgMaxSpeed) || 0;
  const avgPlMinTeam = Number(teamData.intensity?.avgPlayerLoadPerMin) || 0;

  console.log('📊 Team Dashboard Aggregates:');
  console.log('  - Total HSR (team):', totalHSRTeam);
  console.log('  - Avg Max Speed (team):', avgMaxSpeedTeam.toFixed(2), 'km/h');
  console.log('  - Avg PL/min (team):', avgPlMinTeam.toFixed(3));

  // 3) Comparisons with tolerances
  const tolPctHSR = 1.5; // Allow 1.5% diff due to rounding/aggregation paths
  const diffHSR = pctDiff(sumHSRPlayers, totalHSRTeam);
  const hsrOk = Number.isFinite(diffHSR) && diffHSR <= tolPctHSR;

  // Note: top speed and PL/min use different aggregation logics.
  // We log them for operator review instead of asserting strict equality.

  console.log('\n🔎 Comparison Results:');
  console.log(`  - HSR consistency: ${hsrOk ? 'OK' : 'MISMATCH'} (diff=${diffHSR.toFixed(2)}%)`);
  if (!hsrOk) {
    console.warn('    → Investigate differences in HSR computation (players vs dashboard speed builder).');
  }

  // Exit code semantics
  if (!hsrOk) {
    process.exitCode = 2;
  } else {
    process.exitCode = 0;
  }
}

run().catch((err) => {
  console.error('❌ Test execution error:', err);
  process.exit(1);
});


