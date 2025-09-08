const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const EMAIL = process.env.TEST_EMAIL || 'REPLACE_EMAIL';
const PASSWORD = process.env.TEST_PASSWORD || 'REPLACE_PASSWORD';

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookies = setCookie.split(',').map(s => s.split(';')[0]).join('; ');
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, cookies, data, status: res.status };
}

async function fetchDossier(playerId, qs, cookies) {
  const res = await fetch(`${BASE_URL}/api/performance/player/${playerId}/dossier?${qs}`, {
    headers: { Cookie: cookies }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

(async () => {
  try {
    if (EMAIL === 'REPLACE_EMAIL') {
      console.error('❌ Impostare TEST_EMAIL e TEST_PASSWORD nelle env');
      process.exit(1);
    }
    const qs = 'period=custom&startDate=2025-07-01&endDate=2025-08-31';
    const playerId = Number(process.env.PLAYER_ID || 1);
    console.log('🔐 Login con', EMAIL);
    const { ok, cookies, status, data } = await login();
    if (!ok) {
      console.error('❌ Login failed:', status, data);
      process.exit(1);
    }
    console.log('🔎 Fetch dossier:', { playerId, qs });
    const resp = await fetchDossier(playerId, qs, cookies);
    if (!resp.ok) {
      console.error('❌ Dossier API failed:', resp.status, resp.data);
      process.exit(1);
    }
    const summary = resp.data?.summary || {};
    console.log('✅ Dossier Summary:', {
      plPerMin: summary.plPerMin,
      hsrTot: summary.hsrTot,
      sprintPer90: summary.sprintPer90,
      topSpeedMax: summary.topSpeedMax,
      distTot: summary.distTot,
      minutesTot: summary.minutesTot,
      stepsTot: summary.stepsTot
    });
    const zeros = Object.entries({
      plPerMin: summary.plPerMin,
      hsrTot: summary.hsrTot,
      sprintPer90: summary.sprintPer90,
      topSpeedMax: summary.topSpeedMax,
      distTot: summary.distTot,
      minutesTot: summary.minutesTot
    }).filter(([,v]) => Number(v) === 0);
    if (zeros.length) {
      console.log('⚠️ Valori a zero:', zeros.map(([k]) => k).join(', '));
    } else {
      console.log('🎉 Nessun valore principale a zero');
    }
  } catch (err) {
    console.error('❌ Error:', err?.message);
    process.exit(1);
  }
})();


