// Simple script to login and fetch dossier data for a player
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password' })
  });
  const setCookie = res.headers.get('set-cookie') || '';
  const cookies = setCookie.split(',').map(s => s.split(';')[0]).join('; ');
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, cookies, data, status: res.status };
}

async function fetchDossier(playerId, qs) {
  const { ok, cookies, status } = await login();
  if (!ok) {
    console.error('❌ Login failed, status:', status);
    process.exit(1);
  }
  const res = await fetch(`${BASE_URL}/api/performance/player/${playerId}/dossier?${qs}`, {
    headers: { Cookie: cookies }
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

(async () => {
  try {
    const qs = 'period=custom&startDate=2025-07-01&endDate=2025-08-31';
    const playerId = 1;
    console.log('🔎 Fetch dossier:', { playerId, qs });
    const { ok, status, data } = await fetchDossier(playerId, qs);
    if (!ok) {
      console.error('❌ Dossier API failed:', status, data);
      process.exit(1);
    }
    const summary = data?.summary || {};
    console.log('✅ Dossier Summary:', {
      plPerMin: summary.plPerMin,
      hsrTot: summary.hsrTot,
      sprintPer90: summary.sprintPer90,
      topSpeedMax: summary.topSpeedMax,
      distTot: summary.distTot,
      minutesTot: summary.minutesTot,
      stepsTot: summary.stepsTot
    });
    const anyZero = [
      summary.plPerMin,
      summary.hsrTot,
      summary.sprintPer90,
      summary.topSpeedMax,
      summary.distTot,
      summary.minutesTot
    ].some(v => Number(v) === 0);
    console.log(anyZero ? '⚠️ Alcuni valori sono zero' : '🎉 Tutti i valori principali sono valorizzati');
  } catch (err) {
    console.error('❌ Error:', err?.message);
    process.exit(1);
  }
})();


