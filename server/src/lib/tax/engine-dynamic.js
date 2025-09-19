// server/src/lib/tax/engine-dynamic.js
// Motore di calcolo fiscale parametrico

const r2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

/**
 * Calcola imposta progressiva su base scaglioni
 */
function progressiveTax(base, rows) {
  // rows ordinate per from asc; to null = Infinity
  let tax = 0;
  let remaining = base;
  for (const r of rows) {
    const lo = r.from;
    const hi = (r.to ?? Infinity);
    if (base <= lo) break;
    const width = Math.max(0, Math.min(base, hi) - lo);
    if (width > 0) tax += width * r.rate + (r.fixed ?? 0);
  }
  return r2(tax);
}

/**
 * Interpolazione lineare tra punti
 */
function interpolate(points, x) {
  const pts = [...points].sort((a, b) => a.x - b.x);
  if (pts.length === 0) return 0;
  if (x <= pts[0].x) return pts[0].y;
  const last = pts[pts.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 0; i < pts.length - 1; i++) {
    const A = pts[i], B = pts[i + 1];
    if (x >= A.x && x <= B.x) {
      const t = (x - A.x) / (B.x - A.x);
      return r2(A.y + t * (B.y - A.y));
    }
  }
  return last.y;
}

/**
 * Calcola bonus L.207/24
 */
function bonusL207(R, bands) {
  const b = [...bands].sort((a, b) => a.max - b.max).find(b => R <= b.max);
  return b ? r2(R * b.pct) : 0;
}

/**
 * Calcola ulteriore detrazione L.207/24
 */
function ulterioreDetrazioneL207(R, full, full_to, fade_to) {
  if (R <= 20000) return 0;
  if (R <= full_to) return full;
  if (R < fade_to) return r2(full * (fade_to - R) / (fade_to - full_to));
  return 0;
}

/**
 * Formula standard detrazione art.13
 */
function detrazioneArt13Default(R) {
  if (R <= 15000) return 1955;
  if (R <= 28000) return 1910 + 1190 * ((28000 - R) / 13000);
  if (R <= 35000) return 65 + 1910 * ((50000 - R) / 22000);
  if (R <= 50000) return 1910 * ((50000 - R) / 22000);
  return 0;
}

/**
 * Calcola detrazione con override opzionale
 */
function detrazioneWithOverride(R, override, fallback) {
  if (override && override.length) return r2(interpolate(override, R));
  const f = fallback ?? detrazioneArt13Default;
  return r2(f(R));
}

/**
 * Calcola contributi dal lordo
 */
function contributiFromLordo(G, mode, pts, rows) {
  if (mode === 'LOOKUP' && pts) return r2(interpolate(pts, G));
  if (mode === 'PIECEWISE' && rows) return progressiveTax(G, rows); // scaglioni su lordo
  return 0;
}

/**
 * Calcolo fiscale da lordo
 */
function computeFromLordoDynamic(G, p) {
  const fondoRate = p.fondoRate ?? 0.005;
  const CS = contributiFromLordo(G, p.contribMode, p.contribPoints, p.contribBrackets);
  const R = r2(G - CS);

  const irpefLorda = progressiveTax(R, p.irpefBrackets);
  const detStd = detrazioneWithOverride(R, p.detrazOverride, p.detrazStd);
  const detL207 = ulterioreDetrazioneL207(R, p.l207Full, p.l207FullTo, p.l207FadeTo);
  const irpefNet = r2(Math.max(0, irpefLorda - detStd - detL207));

  const addReg = p.addRegionBrackets?.length ? progressiveTax(R, p.addRegionBrackets) : 0;
  const addCity = p.addCityBrackets?.length ? progressiveTax(R, p.addCityBrackets) : 0;

  const bonus = bonusL207(R, p.l207Bands);
  const fondo = r2(G * fondoRate);

  const netto = r2(G - CS - irpefNet - addReg - addCity - fondo + bonus);

  return {
    lordo: r2(G),
    netto,
    contributi: CS,
    imponibile: R,
    irpefLorda,
    detrazioniStd: detStd,
    ulterioreDetrazione: detL207,
    irpefNet,
    addRegion: addReg,
    addCity: addCity,
    fondo,
    bonus
  };
}

/**
 * Calcolo fiscale da netto (risolutore binario)
 */
function computeFromNettoDynamic(targetNet, p) {
  let lo = 0, hi = Math.max(targetNet * 3, 200000);
  for (let i = 0; i < 70; i++) {
    const mid = (lo + hi) / 2;
    const res = computeFromLordoDynamic(mid, p);
    if (res.netto >= targetNet) hi = mid; else lo = mid;
  }
  return computeFromLordoDynamic(hi, p);
}

/**
 * Trasforma righe DB in formato BracketRow
 */
function transformBracketRows(rows) {
  return rows
    .sort((a, b) => a.from_amount - b.from_amount)
    .map(row => ({
      from: Number(row.from_amount),
      to: row.to_amount ? Number(row.to_amount) : null,
      rate: Number(row.rate),
      fixed: Number(row.fixed || 0)
    }));
}

/**
 * Trasforma punti DB in formato interpolazione
 */
function transformPoints(points) {
  return points
    .sort((a, b) => a.gross - b.gross)
    .map(point => ({
      x: Number(point.gross),
      y: Number(point.contrib || point.detrazione)
    }));
}

/**
 * Trasforma bande L.207 in formato Bands
 */
function transformL207Bands(bands) {
  return bands.map(band => ({
    max: Number(band.max_amount),
    pct: Number(band.pct)
  }));
}

module.exports = {
  computeFromLordoDynamic,
  computeFromNettoDynamic,
  transformBracketRows,
  transformPoints,
  transformL207Bands,
  detrazioneArt13Default
};
