/**
 * KPI utilities — rev2 compatibile (versione debug)
 * 
 * Versione semplificata per identificare il problema specifico
 */

// ============================
// Helpers numerici e date UTC
// ============================

/** Arrotonda un valore con n decimali; restituisce null se non numerico. */
function round(v, d = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

/** Inizio giorno UTC (00:00:00.000). */
function startOfDayUTC(date) {
  const d = new Date(date instanceof Date ? date.getTime() : Date.parse(date));
  if (isNaN(d)) return new Date(NaN);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** Fine giorno UTC (23:59:59.999). */
function endOfDayUTC(date) {
  const d = new Date(date instanceof Date ? date.getTime() : Date.parse(date));
  if (isNaN(d)) return new Date(NaN);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

/** Somma giorni in UTC. */
function addDaysUTC(date, days) {
  const d = new Date(date instanceof Date ? date.getTime() : Date.parse(date));
  if (isNaN(d)) return new Date(NaN);
  d.setUTCDate(d.getUTCDate() + Number(days || 0));
  return d;
}

// ==========================================
// Periodi: week / month / quarter / season / custom (tutto UTC)
// ==========================================

/**
 * buildPeriodRange(period, customStart, customEnd)
 * Ritorna oggetto con { startDate, endDate } (UTC inclusivi) e alias { periodStart, periodEnd } per compatibilità.
 */
function buildPeriodRange(period = 'week', customStart, customEnd) {
  const now = new Date();
  const todayUTC = startOfDayUTC(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())));

  let start, end;
  switch ((period || '').toLowerCase()) {
    case 'week': {
      end = endOfDayUTC(todayUTC);
      start = startOfDayUTC(addDaysUTC(todayUTC, -6));
      break;
    }
    case 'month': {
      end = endOfDayUTC(todayUTC);
      start = startOfDayUTC(addDaysUTC(todayUTC, -29));
      break;
    }
    case 'quarter': {
      end = endOfDayUTC(todayUTC);
      start = startOfDayUTC(addDaysUTC(todayUTC, -89));
      break;
    }
    case 'season': {
      const seasonStart = new Date(Date.UTC(todayUTC.getUTCFullYear(), 7, 1)); // 1 Agosto anno corrente
      start = startOfDayUTC(seasonStart);
      end = endOfDayUTC(todayUTC);
      break;
    }
    case 'custom': {
      if (!customStart || !customEnd) throw new Error('Custom range richiede customStart e customEnd');
      const s = new Date(customStart);
      const e = new Date(customEnd);
      if (isNaN(s) || isNaN(e)) throw new Error('Date custom non valide');
      start = startOfDayUTC(s);
      end = endOfDayUTC(e);
      break;
    }
    default: {
      end = endOfDayUTC(todayUTC);
      start = startOfDayUTC(addDaysUTC(todayUTC, -6));
    }
  }
  // oggetto compatibile
  const out = { startDate: start, endDate: end };
  // alias legacy
  out.periodStart = out.startDate;
  out.periodEnd = out.endDate;
  return out;
}

// ==========================
// Filtri sessione (mapping)
// ==========================

/**
 * Versione semplice: normalizza alcune varianti note e ritorna il valore
 * CANONICO con capitalizzazione corretta usato nel DB. Se il valore è "all" o falsy, ritorna null
 * per non applicare alcun filtro.
 */
function parseSessionTypeFilterSimple(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (v.toLowerCase() === 'all' || v.toLowerCase() === 'tutte' || v.toLowerCase() === 'tutti') return null;

  // Mappa sinonimi -> canonico (con capitalizzazione corretta dal DB)
  const synonyms = {
    Allenamento: ['allenamento', 'Allenamento', 'training', 'Training', 'pratica', 'Pratica'],
    Partita: ['gara', 'Gara', 'partita', 'Partita', 'match', 'Match'],
    Prepartita: ['prepartita', 'Prepartita', 'pregara', 'Pregara', 'rifinitura', 'Rifinitura'],
    Recupero: ['recupero', 'Recupero', 'recovery', 'Recovery']
  };

  for (const [canonical, list] of Object.entries(synonyms)) {
    if (list.includes(v)) return canonical;
  }
  // Ritorna il valore originale per compatibilità
  return v;
}

/** Per query ORM: { session_name: { in: [...] } } (il chiamante deve incapsulare sul campo). */
function parseSessionTypeFilter(value) {
  const s = parseSessionTypeFilterSimple(value);
  if (!s) return null;
  return { in: [s] };
}

// ======================
// KPI: HSR e Sprint/90
// ======================

/**
 * computeHSR(rows, opts)
 * - Se presenti le fasce 15-20/20-25/>25 km/h, usa solo quelle.
 * - Altrimenti usa distance_over_15_kmh_m.
 * - Fallback opzionale da sprint_distance_m * hsrFactor (default 2.5).
 * - Clamp ≤ total_distance_m.
 */
function computeHSR(rows, opts = {}) {
  const hsrFactor = Number(opts.hsrFactor ?? 2.5);
  if (!rows || !Array.isArray(rows)) return 0;
  return rows.reduce((sum, p) => {
    const td = Number(p?.total_distance_m) || 0;
    const hasBins = ['distance_15_20_kmh_m', 'distance_20_25_kmh_m', 'distance_over_25_kmh_m']
      .some((k) => p && p[k] != null);

    let hsr = 0;
    if (hasBins) {
      hsr = (Number(p?.distance_15_20_kmh_m) || 0)
          + (Number(p?.distance_20_25_kmh_m) || 0)
          + (Number(p?.distance_over_25_kmh_m) || 0);
    } else {
      hsr = Number(p?.distance_over_15_kmh_m) || 0;
    }

    if (!hsr && Number(p?.sprint_distance_m) > 0) {
      hsr = Math.round(Number(p.sprint_distance_m) * hsrFactor);
    }
    return sum + Math.min(hsr, td);
  }, 0);
}

/**
 * Sprint per 90 minuti: (somma sprint / somma minuti) * 90
 * Fallback robusto:
 * 1) Usa sprint_count se presente
 * 2) Altrimenti usa high_intensity_runs come proxy del numero sprint
 * 3) Altrimenti stima da sprint_distance_m / 30m
 */
function computeSprintPer90(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return 0;
  const SPRINT_MEAN_DISTANCE_M = 30; // stima media distanza per sprint

  const totalSprints = rows.reduce((sum, r) => {
    const fromCount = Number(r?.sprint_count);
    if (Number.isFinite(fromCount) && fromCount > 0) return sum + fromCount;

    const fromHIR = Number(r?.high_intensity_runs);
    if (Number.isFinite(fromHIR) && fromHIR > 0) return sum + fromHIR;

    const fromDist = Number(r?.sprint_distance_m);
    if (Number.isFinite(fromDist) && fromDist > 0) return sum + Math.round(fromDist / SPRINT_MEAN_DISTANCE_M);

    return sum;
  }, 0);

  const minutes = rows.reduce((s, r) => s + (Number(r?.duration_minutes) || 0), 0);
  return minutes > 0 ? (totalSprints * 90) / minutes : 0;
}

/** Distanza per minuto sul set di righe (compat helper). */
function computeDistancePerMinute(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return 0;
  const dist = rows.reduce((s, r) => s + (Number(r?.total_distance_m) || 0), 0);
  const minutes = rows.reduce((s, r) => s + (Number(r?.duration_minutes) || 0), 0);
  return minutes > 0 ? dist / minutes : 0;
}

/** Player load per minuto sul set di righe (compat helper). */
function computePlayerLoadPerMinute(rows) {
  if (!rows || !Array.isArray(rows) || rows.length === 0) return 0;
  const load = rows.reduce((s, r) => s + (Number(r?.player_load ?? r?.training_load ?? 0) || 0), 0);
  const minutes = rows.reduce((s, r) => s + (Number(r?.duration_minutes) || 0), 0);
  return minutes > 0 ? load / minutes : 0;
}

// =============
// KPI: ACWR
// =============

/** Serie ACWR giornaliera: (sum7 / sum28). */
function calculateACWR(sessions) {
  if (!Array.isArray(sessions) || sessions.length === 0) return [];
  const items = sessions
    .filter((s) => s && s.session_date)
    .map((s) => ({ date: new Date(s.session_date), load: Number(s.player_load ?? s.training_load ?? 0) || 0 }))
    .filter((x) => !isNaN(x.date));
  if (items.length === 0) return [];

  const byDay = new Map();
  for (const it of items) {
    const key = Date.UTC(it.date.getUTCFullYear(), it.date.getUTCMonth(), it.date.getUTCDate());
    byDay.set(key, (byDay.get(key) || 0) + it.load);
  }

  const days = Array.from(byDay.entries()).sort((a, b) => a[0] - b[0]);
  const out = [];

  for (let i = 0; i < days.length; i++) {
    const [key] = days[i];
    const end = new Date(key);
    const start7 = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 6);
    const start28 = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate() - 27);

    let sum7 = 0, sum28 = 0;
    for (let j = 0; j <= i; j++) {
      const [k, v] = days[j];
      if (k >= start7 && k <= key) sum7 += v;
      if (k >= start28 && k <= key) sum28 += v;
    }
    const acwr = sum28 > 0 ? sum7 / sum28 : 0;
    out.push({ date: new Date(key), acwr });
  }
  return out;
}

/** Valore ACWR puntuale a una refDate (default: max data). */
function computeACWRAt(sessions, refDate) {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;
  let maxDate = null;
  const items = sessions
    .filter((s) => s && s.session_date)
    .map((s) => {
      const d = new Date(s.session_date);
      if (!maxDate || d > maxDate) maxDate = d;
      return { date: d, load: Number(s.player_load ?? s.training_load ?? 0) || 0 };
    })
    .filter((x) => !isNaN(x.date));

  const ref = refDate ? new Date(refDate) : maxDate;
  if (!ref || isNaN(ref)) return 0;

  const end = endOfDayUTC(ref);
  const start7 = startOfDayUTC(addDaysUTC(ref, -6));
  const start28 = startOfDayUTC(addDaysUTC(ref, -27));

  let sum7 = 0, sum28 = 0;
  for (const it of items) {
    if (it.date >= start7 && it.date <= end) sum7 += it.load;
    if (it.date >= start28 && it.date <= end) sum28 += it.load;
  }
  return sum28 > 0 ? sum7 / sum28 : 0;
}

/**
 * Alias di compatibilità: alcuni moduli si aspettano `computeACWR(allLoads, periodEnd)`
 * Ritorna ACWR (sum7/sum28) al giorno `periodEnd` (o all'ultima data se non passato).
 */
function computeACWR(allLoads, periodEnd) {
  return computeACWRAt(allLoads, periodEnd);
}

// =====================
// Statistiche base
// =====================

function calculateStats(arr, { useSample = false } = {}) {
  const vals = (Array.isArray(arr) ? arr : []).map(Number).filter(Number.isFinite);
  const n = vals.length;
  if (n === 0) return { min: null, max: null, mean: null, stddev: null };
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const mean = vals.reduce((s, v) => s + v, 0) / n;
  const denom = useSample && n > 1 ? (n - 1) : n;
  const variance = denom > 0 ? vals.reduce((s, v) => s + (v - mean) ** 2, 0) / denom : 0;
  const stddev = Math.sqrt(variance);
  return { min, max, mean, stddev };
}

// =====================
// Validazione sessione
// =====================

function validateSessionData(session) {
  const issues = [];
  const td = Number(session?.total_distance_m) || 0;
  const dur = Number(session?.duration_minutes) || 0;
  const type = (session?.session_type || '').toLowerCase();

  if (dur > 0) {
    const mpm = td / dur;
    const maxMpm = type === 'partita' ? 300 : 250;
    if (mpm > maxMpm) issues.push(`Distanza/minuto anomala: ${round(mpm, 1)} m/min`);
    if (type === 'partita' && mpm < 20) issues.push(`Distanza/minuto troppo bassa per una partita: ${round(mpm, 1)} m/min`);
  }

  const vmax = Number(session?.max_speed_kmh) || 0;
  if (vmax > 40) issues.push(`Velocità massima improbabile: ${round(vmax, 1)} km/h`);
  if (type === 'partita' && vmax < 20) issues.push(`Velocità massima troppo bassa per una partita: ${round(vmax, 1)} km/h`);

  // HSR RAW (per controllo)
  const hasBins = ['distance_15_20_kmh_m', 'distance_20_25_kmh_m', 'distance_over_25_kmh_m']
    .some((k) => session && session[k] != null);
  const rawHSR = hasBins
    ? (Number(session?.distance_15_20_kmh_m) || 0)
    + (Number(session?.distance_20_25_kmh_m) || 0)
    + (Number(session?.distance_over_25_kmh_m) || 0)
    : (Number(session?.distance_over_15_kmh_m) || 0);

  if (rawHSR > td) issues.push(`HSR (${round(rawHSR, 0)} m) maggiore della distanza totale (${round(td, 0)} m)`);

  const sprintCount = Number(session?.sprint_count) || 0;
  if (sprintCount > 100) issues.push(`Numero sprint anomalo: ${sprintCount}`);

  return issues;
}

// ============================================================
// 📈 FUNZIONI AGGIUNTIVE - TREND, PERCENTILI, PERFORMANCE LEVEL
// ============================================================

/**
 * Calcola il trend percentuale tra due valori
 * @returns {number} variazione in %
 */
function calculateTrend(currentValue, previousValue) {
  if (!previousValue || previousValue === 0) return 0;
  const change = ((currentValue - previousValue) / previousValue) * 100;
  return Math.max(-100, Math.min(100, Number(change.toFixed(1))));
}

/**
 * Calcola i trend per tutti i KPI principali
 */
function calculateAllTrends(currentPeriod, previousPeriod) {
  return {
    plPerMin: calculateTrend(currentPeriod.plPerMin, previousPeriod.plPerMin),
    hsrTot: calculateTrend(currentPeriod.hsrTot, previousPeriod.hsrTot),
    sprintPer90: calculateTrend(currentPeriod.sprintPer90, previousPeriod.sprintPer90),
    topSpeedMax: calculateTrend(currentPeriod.topSpeedMax, previousPeriod.topSpeedMax),
    acwr: calculateTrend(currentPeriod.acwr, previousPeriod.acwr),
    totalDistance: calculateTrend(currentPeriod.totalDistance, previousPeriod.totalDistance),
    monotony: calculateTrend(currentPeriod.monotony, previousPeriod.monotony),
    freshness: calculateTrend(currentPeriod.freshness, previousPeriod.freshness),
    mechLoad: calculateTrend(currentPeriod.mechLoad, previousPeriod.mechLoad),
    injuryRisk: calculateTrend(currentPeriod.injuryRisk, previousPeriod.injuryRisk),
  };
}

/**
 * Restituisce direzione e colore del trend
 */
function getTrendIndicator(trendValue, higherIsBetter = true) {
  const abs = Math.abs(trendValue);
  const isPositive = trendValue > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  if (abs < 5) {
    return { direction: "neutral", color: "text-gray-400", icon: "minus", message: "Stabile" };
  }
  return {
    direction: isPositive ? "up" : "down",
    color: isGood ? "text-green-500" : "text-red-500",
    icon: isPositive ? "arrowUp" : "arrowDown",
    message: `${isPositive ? "+" : ""}${trendValue.toFixed(1)}%`,
  };
}

/**
 * Calcola percentile di un giocatore rispetto ai valori del suo ruolo
 */
function calculatePercentile(playerValue, roleValues) {
  if (!roleValues || roleValues.length === 0) return 50;
  const sorted = [...roleValues].sort((a, b) => a - b);
  const countBelow = sorted.filter((v) => v < playerValue).length;
  const countEqual = sorted.filter((v) => v === playerValue).length;
  return Math.round(((countBelow + 0.5 * countEqual) / sorted.length) * 100);
}

/**
 * Calcola i percentili di ruolo per un giocatore
 */
async function calculateRolePercentiles(player, allPlayers) {
  const sameRole = allPlayers.filter((p) => p.position === player.position);
  if (sameRole.length < 2) {
    return {
      plPerMin: 50,
      hsrTot: 50,
      sprintPer90: 50,
      topSpeedMax: 50,
      acwr: 50,
      mechLoad: 50,
      edi: 50,
    };
  }

  return {
    plPerMin: calculatePercentile(player.stats.plPerMin, sameRole.map((p) => p.stats.plPerMin)),
    hsrTot: calculatePercentile(player.stats.hsrTot, sameRole.map((p) => p.stats.hsrTot)),
    sprintPer90: calculatePercentile(player.stats.sprintPer90, sameRole.map((p) => p.stats.sprintPer90)),
    topSpeedMax: calculatePercentile(player.stats.topSpeedMax, sameRole.map((p) => p.stats.topSpeedMax)),
    acwr: calculatePercentile(player.stats.acwr, sameRole.map((p) => p.stats.acwr)),
    mechLoad: calculatePercentile(player.stats.mechLoad, sameRole.map((p) => p.stats.mechLoad)),
    edi: calculatePercentile(player.stats.edi, sameRole.map((p) => p.stats.edi)),
  };
}

/**
 * Determina il livello qualitativo in base al percentile
 */
function getPerformanceLevel(percentile) {
  if (percentile >= 90)
    return { level: "excellent", color: "text-green-600", bgColor: "bg-green-100", message: "Eccellente", icon: "trendUp" };
  if (percentile >= 75)
    return { level: "good", color: "text-green-500", bgColor: "bg-green-50", message: "Buono", icon: "arrowUp" };
  if (percentile >= 50)
    return { level: "average", color: "text-blue-500", bgColor: "bg-blue-50", message: "Nella media", icon: "minus" };
  if (percentile >= 25)
    return { level: "below", color: "text-orange-500", bgColor: "bg-orange-50", message: "Sotto media", icon: "arrowDown" };
  return { level: "poor", color: "text-red-500", bgColor: "bg-red-50", message: "Critico", icon: "trendDown" };
}

// =====================
// Export API
// =====================

module.exports = {
  // base utils
  round,
  startOfDayUTC,
  endOfDayUTC,
  addDaysUTC,
  // periodi
  buildPeriodRange,
  // mapping sessione
  parseSessionTypeFilterSimple,
  parseSessionTypeFilter,
  // KPI
  computeHSR,
  computeSprintPer90,
  computeDistancePerMinute,
  computePlayerLoadPerMinute,
  // ACWR (nuovo + alias compat)
  calculateACWR,
  computeACWRAt,
  computeACWR, // alias compat
  // statistiche e validazione
  calculateStats,
  validateSessionData,
  // trend e percentili
  calculateTrend,
  calculateAllTrends,
  getTrendIndicator,
  calculatePercentile,
  calculateRolePercentiles,
  getPerformanceLevel,
};
