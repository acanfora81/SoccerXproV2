/**
 * Consistency Test: TeamDashboard (tab Giocatore) vs Vista Giocatori
 * Confronta i KPI per uno specifico giocatore (ID fornito) nello stesso periodo.
 * Periodo: 2025-07-01 → 2025-08-31
 */

import http from 'http';
import { request as httpsRequest } from 'https';

const BASE_URL = 'http://localhost:3001';
const PLAYER_ID = Number(process.env.TEST_PLAYER_ID || '1');
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

function pctDiff(a, b) {
  if (a === 0 && b === 0) return 0;
  if (b === 0) return Infinity;
  return Math.abs((a - b) / b) * 100;
}

async function run() {
  console.log('\n🧪 Consistency Test (Giocatore): TeamDashboard vs Vista Giocatori');
  console.log(`Giocatore ID: ${PLAYER_ID}`);
  console.log('Periodo: 2025-07-01 → 2025-08-31');

  // Login per ottenere i cookie
  const loginRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/auth/login`, { method: 'POST' }, TEST_USER);
  if (loginRes.status !== 200) {
    console.error('❌ Errore login:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const cookieHeader = (loginRes.cookies || []).map((c) => c.split(';')[0]).join('; ');

  // Vista Giocatori: prendi il record del giocatore
  const playersRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/performance/stats/players?${PERIOD_QUERY}`, { headers: { Cookie: cookieHeader } });
  if (playersRes.status !== 200) {
    console.error('❌ Errore Players API:', playersRes.status, playersRes.data);
    process.exit(1);
  }
  const p = (playersRes.data?.players || []).find((x) => Number(x?.id) === PLAYER_ID);
  if (!p) {
    console.error('❌ Giocatore non trovato nella Vista Giocatori');
    process.exit(1);
  }

  const vg = {
    hsr: Math.round(Number(p?.hsr) || 0),
    plMin: Number(p?.plMin) || 0,
    topSpeed: Number(p?.topSpeed) || 0,
    sprintPer90: Number(p?.sprintPer90) || 0,
  };

  console.log('\n📦 Vista Giocatori:');
  console.log('  - HSR:', vg.hsr);
  console.log('  - PL/min:', vg.plMin.toFixed(3));
  console.log('  - Vel. max:', vg.topSpeed.toFixed(2), 'km/h');
  console.log('  - Sprint/90:', vg.sprintPer90.toFixed(2));

  // TeamDashboard (tab Giocatore)
  const dashRes = await makeHttpOrHttpsRequest(`${BASE_URL}/api/dashboard/stats/player/${PLAYER_ID}?${PERIOD_QUERY}`, { headers: { Cookie: cookieHeader } });
  if (dashRes.status !== 200) {
    console.error('❌ Errore Dashboard Player API:', dashRes.status, dashRes.data);
    process.exit(1);
  }
  const data = dashRes.data?.data || {};
  const td = {
    hsr: Math.round(Number(data?.speed?.totalHSR) || 0),
    plMin: Number(data?.intensity?.avgPlayerLoadPerMin) || 0,
    // Nota: top speed nella dashboard è media max per sessione; può differire dal massimo puro.
    avgMaxSpeed: Number(data?.summary?.avgMaxSpeed) || 0,
  };

  console.log('\n📊 TeamDashboard (tab Giocatore):');
  console.log('  - HSR:', td.hsr);
  console.log('  - PL/min:', td.plMin.toFixed(3));
  console.log('  - Vel. max (media max):', td.avgMaxSpeed.toFixed(2), 'km/h');

  // Confronti con tolleranze
  const diffHSR = pctDiff(vg.hsr, td.hsr);
  const diffPLM = pctDiff(vg.plMin, td.plMin);

  const okHSR = Number.isFinite(diffHSR) && diffHSR <= 1.5; // 1.5% tolleranza
  const okPLM = Number.isFinite(diffPLM) && diffPLM <= 1.5;

  console.log('\n🔎 Risultati confronto:');
  console.log(`  - HSR: ${okHSR ? 'OK' : 'DIFF'} (diff=${diffHSR.toFixed(2)}%)`);
  console.log(`  - PL/min: ${okPLM ? 'OK' : 'DIFF'} (diff=${diffPLM.toFixed(2)}%)`);
  if (!okHSR) console.warn('    → Verificare calcolo HSR (somma fasce vs distanza>15 km/h).');
  if (!okPLM) console.warn('    → Verificare calcolo PL/min (media semplice vs pesata).');

  // Exit code
  process.exitCode = okHSR && okPLM ? 0 : 2;
}

run().catch((err) => {
  console.error('❌ Errore esecuzione test:', err);
  process.exit(1);
});


