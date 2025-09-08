const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const EMAIL = process.env.TEST_EMAIL || 'REPLACE_EMAIL';
const PASSWORD = process.env.TEST_PASSWORD || 'REPLACE_PASSWORD';

const qs = 'period=custom&startDate=2025-07-01&endDate=2025-08-31';
const playerId = 1;

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

async function getVistaPlayer() {
  const { ok, cookies } = await login();
  if (!ok) throw new Error('Login failed');
  const res = await fetch(`${BASE_URL}/api/dashboard/stats/player/${playerId}?${qs}`, { headers: { Cookie: cookies } });
  const data = await res.json();
  return data?.data || data;
}

async function getDossierPlayer() {
  const { ok, cookies } = await login();
  if (!ok) throw new Error('Login failed');
  const res = await fetch(`${BASE_URL}/api/performance/player/${playerId}/dossier?${qs}`, { headers: { Cookie: cookies } });
  const data = await res.json();
  return data;
}

function r2(v) { return Number.isFinite(Number(v)) ? Number(Number(v).toFixed(2)) : null; }

(async () => {
  try {
    if (EMAIL === 'REPLACE_EMAIL') throw new Error('Set TEST_EMAIL/TEST_PASSWORD');

    const vista = await getVistaPlayer();
    const dossier = await getDossierPlayer();

    const result = {
      plPerMin: { vista: r2(vista?.summary?.plPerMin), dossier: r2(dossier?.summary?.plPerMin) },
      hsrTot: { vista: r2(vista?.speed?.totalHSR ?? vista?.summary?.hsrTot), dossier: r2(dossier?.summary?.hsrTot) },
      topSpeedMax: { vista: r2(vista?.speed?.topSpeedMax ?? vista?.summary?.topSpeedMax), dossier: r2(dossier?.summary?.topSpeedMax) },
      distTot: { vista: Number(vista?.load?.totalDistance ?? 0), dossier: Number(dossier?.summary?.distTot ?? 0) },
      minutesTot: { vista: Number(vista?.summary?.totalMinutes ?? 0), dossier: Number(dossier?.summary?.minutesTot ?? 0) },
      cardioAvgHR: { vista: r2(vista?.cardio?.avgHR), dossier: r2(dossier?.cardio?.avgHR) },
      cardioMaxHR: { vista: r2(vista?.cardio?.maxHR), dossier: r2(dossier?.cardio?.maxHR) }
    };

    console.log('🔎 Confronto KPI (Player 1):');
    for (const [k, v] of Object.entries(result)) {
      const diff = (v.vista || 0) - (v.dossier || 0);
      const pct = v.vista ? Math.abs(diff) / Math.max(1e-9, v.vista) * 100 : 0;
      console.log(`  - ${k}: vista=${v.vista} dossier=${v.dossier} diff=${r2(diff)} (${r2(pct)}%)`);
    }
  } catch (err) {
    console.error('❌ Error:', err?.message);
    process.exit(1);
  }
})();


