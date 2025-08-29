// server/src/utils/gpsDeriver.js
// Modulo per la derivazione intelligente dei dati GPS mancanti

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const nz = (v) => (Number.isFinite(v) ? v : 0);
const safeDiv = (n, d) => (d > 0 ? n / d : 0);
const round = (v, d = 0) => Number(v.toFixed(d));

/** profili HSR% per stimare split quando mancano */
const HSR_PROFILES = {
  Portiere: { train: 0.03, match: 0.05 },
  Difensore:{ train: 0.12, match: 0.18 },
  Centrocampista:{ train: 0.16, match: 0.24 },
  Attaccante:{ train: 0.14, match: 0.22 },
  default:{ train: 0.13, match: 0.20 }
};

// ripartizione tipica di HSR in zone (somma = 1)
const HSR_SPLIT = { z15_20: 0.60, z20_25: 0.35, z25p: 0.05 };

function roleOf(pos) {
  const p = (pos||"").toLowerCase();
  if (p.includes("port")) return "Portiere";
  if (p.includes("dif")) return "Difensore";
  if (p.includes("centro") || p.includes("mid")) return "Centrocampista";
  if (p.includes("att") || p.includes("forw")) return "Attaccante";
  return "default";
}

function isMatchFlag(v) {
  const x = (v||"").toLowerCase();
  return x==="yes" || x==="true" || x==="1" || x==="match" || x==="partita";
}

function completeRow(r, opts = {}) {
  const flags = {};
  const mark = (k, v) => { flags[k] = v; };

  // ---- campi base ----
  const Player = (r.Player || "Sconosciuto").toString();
  const Position = (r.Position || "").toString();
  const Day = (r.Day || r["session_date"] || "").toString();
  const Match = isMatchFlag(r.Match || r["session_type"]?.toString()) ? "Yes" : "No";
  const Drill = (r.Drill || (Match==="Yes" ? "Match Day" : (opts?.defaultDrill || "Allenamento"))).toString();
  const Note = (r.Note || "").toString();

  const T = nz(r.T); mark("T", !("T" in r));
  const dist = nz(r["Distanza (m)"]); mark("Distanza (m)", !("Distanza (m)" in r));

  // ---- Dist/min ----
  let distPerMin = r["Dist/min"];
  if (!Number.isFinite(distPerMin)) {
    distPerMin = round(safeDiv(dist, T), 2);
    mark("Dist/min", true);
  } else mark("Dist/min", false);

  // ---- Pot. met. media ----
  let pmm = r["Pot. met. media"];
  if (!Number.isFinite(pmm)) {
    // fallback per tipo e ruolo
    const role = roleOf(Position);
    pmm = Match==="Yes"
      ? (role==="Portiere" ? 6.0 : 9.2)
      : (role==="Portiere" ? 5.5 : 8.2);
    pmm = round(pmm + (Math.random()*0.6-0.3), 2);
    mark("Pot. met. media", true);
  } else mark("Pot. met. media", false);

  // ---- Dist Equivalente e %Eq ----
  let distEq = r["Dist Equivalente"];
  if (!Number.isFinite(distEq)) {
    const eqA = opts?.eqA ?? 0.6;
    const eqB = opts?.eqB ?? 0.8;
    const eqC = opts?.eqC ?? 1.6;
    const dAcc2 = nz(r["D Acc > 2m/s2"]);
    const d35w  = nz(r["D>35 W"]);
    const ratioAcc = safeDiv(dAcc2, dist);
    const ratio35w = safeDiv(d35w, dist);
    const eqMultiplier = clamp(1 + eqA * (nz(pmm) - 6) / 10 + eqB * ratioAcc + eqC * ratio35w, 1.02, 1.25);
    distEq = Math.round(dist * eqMultiplier);
    mark("Dist Equivalente", true);
  } else mark("Dist Equivalente", false);

  let eqPct = r["%Eq Dist"];
  if (!Number.isFinite(eqPct)) {
    eqPct = round(safeDiv(distEq, dist) * 100, 2);
    mark("%Eq Dist", true);
  } else mark("%Eq Dist", false);

  // ---- Zone velocità ----
  let d15_20 = r["D 15-20 km/h"]; let d20_25 = r["D 20-25 km/h"]; let d25p = r["D > 25 km/h"];
  let dOver15 = r["D > 15 Km/h"]; let dOver20 = r["D > 20 km/h"];

  // Se mancano gli split, stima HSR per ruolo e tipo e riparti
  if (!Number.isFinite(d15_20) || !Number.isFinite(d20_25) || !Number.isFinite(d25p)) {
    const role = roleOf(Position);
    const hsrPct = HSR_PROFILES[role]?.[Match==="Yes" ? "match" : "train"] ?? HSR_PROFILES.default[Match==="Yes" ? "match" : "train"];
    const hsr = Math.round(dist * hsrPct);
    d15_20 = Math.round(hsr * HSR_SPLIT.z15_20);
    d20_25 = Math.round(hsr * HSR_SPLIT.z20_25);
    d25p   = Math.round(hsr * HSR_SPLIT.z25p);
    mark("D 15-20 km/h", true); mark("D 20-25 km/h", true); mark("D > 25 km/h", true);
  } else { mark("D 15-20 km/h", false); mark("D 20-25 km/h", false); mark("D > 25 km/h", false); }

  // D > 20, D > 15 coerenti
  if (!Number.isFinite(dOver20)) { dOver20 = nz(d20_25) + nz(d25p); mark("D > 20 km/h", true); } else mark("D > 20 km/h", false);
  if (!Number.isFinite(dOver15)) { dOver15 = nz(d15_20) + nz(d20_25) + nz(d25p); mark("D > 15 Km/h", true); } else mark("D > 15 Km/h", false);

  // Non superare la distanza totale
  const over15Sum = nz(d15_20) + nz(d20_25) + nz(d25p);
  if (over15Sum > dist) {
    const scale = dist / over15Sum;
    d15_20 = Math.floor(nz(d15_20) * scale);
    d20_25 = Math.floor(nz(d20_25) * scale);
    d25p   = Math.floor(nz(d25p) * scale);
    dOver20 = d20_25 + d25p;
    dOver15 = d15_20 + d20_25 + d25p;
  }

  // ---- Distanze metaboliche ----
  let d20w = r["D > 20 W/Kg"]; let d35w = r["D>35 W"];
  if (!Number.isFinite(d20w)) { d20w = Math.round(dist * (Match==="Yes" ? 0.16 : 0.12)); mark("D > 20 W/Kg", true); } else mark("D > 20 W/Kg", false);
  if (!Number.isFinite(d35w)) { d35w = Math.round(nz(d20w) * 0.35); mark("D>35 W", true); } else mark("D>35 W", false);

  // ---- Accelerazioni/decelerazioni (distanze e percentuali) ----
  let dAcc2 = r["D Acc > 2m/s2"]; let dDec2 = r["D Dec > -2m/s2"];
  if (!Number.isFinite(dAcc2)) { dAcc2 = Math.round(dist * 0.07); mark("D Acc > 2m/s2", true); } else mark("D Acc > 2m/s2", false);
  if (!Number.isFinite(dDec2)) { dDec2 = Math.round(dist * 0.07); mark("D Dec > -2m/s2", true); } else mark("D Dec > -2m/s2", false);

  const pctAcc2 = Number.isFinite(r["%D acc > 2m/s2"]) ? r["%D acc > 2m/s2"] : round(safeDiv(dAcc2, dist) * 100, 2);
  const pctDec2 = Number.isFinite(r["%D Dec > -2 m/s2"]) ? r["%D Dec > -2 m/s2"] : round(safeDiv(dDec2, dist) * 100, 2);
  mark("%D acc > 2m/s2", !("%D acc > 2m/s2" in r)); mark("%D Dec > -2 m/s2", !("%D Dec > -2 m/s2" in r));

  const accPerMin = Number.isFinite(r["D Acc/min > 2 m/s2"]) ? r["D Acc/min > 2 m/s2"] : round(safeDiv(dAcc2, T), 3);
  const decPerMin = Number.isFinite(r["D Dec/min > -2m/s2"]) ? r["D Dec/min > -2m/s2"] : round(safeDiv(dDec2, T), 3);
  mark("D Acc/min > 2 m/s2", !("D Acc/min > 2 m/s2" in r)); mark("D Dec/min > -2m/s2", !("D Dec/min > -2m/s2" in r));

  // Eventi >3 m/s2 e distanze associate
  let nAcc3 = r["Num Acc > 3 m/s2"]; let nDec3 = r["Num Dec <-3 m/s2"];
  if (!Number.isFinite(nAcc3)) { nAcc3 = Math.round((Match==="Yes"?22:16) * (dist/9000)); mark("Num Acc > 3 m/s2", true); } else mark("Num Acc > 3 m/s2", false);
  if (!Number.isFinite(nDec3)) { nDec3 = Math.round((Match==="Yes"?22:16) * (dist/9000)); mark("Num Dec <-3 m/s2", true); } else mark("Num Dec <-3 m/s2", false);

  let dAcc3 = r["D Acc > 3 m/s2"]; let dDec3 = r["D Dec < -3 m/s2"];
  if (!Number.isFinite(dAcc3)) { dAcc3 = Math.round(nz(nAcc3) * 7); mark("D Acc > 3 m/s2", true); } else mark("D Acc > 3 m/s2", false);
  if (!Number.isFinite(dDec3)) { dDec3 = Math.round(nz(nDec3) * 7); mark("D Dec < -3 m/s2", true); } else mark("D Dec < -3 m/s2", false);

  // ---- Tempo in zone di potenza (<5 e 5-10) ----
  let tLt5 = r["T/min <5 W/kg"]; let t5_10 = r["T/min 5-10 W/Kg"];
  if (!Number.isFinite(tLt5) || !Number.isFinite(t5_10)) {
    // profilo triangolare in base a pmm e tipo
    const bias = Match==="Yes" ? 0.85 : 0.75;
    const hiFrac = clamp((nz(pmm) - 8) / 6, 0.06, Match==="Yes" ? 0.38 : 0.30);
    const tHi = Math.round(T * hiFrac);
    const tMid = Math.round(T * (bias - hiFrac));
    const tLow = Math.max(T - tHi - tMid, 0);
    tLt5  = Number.isFinite(tLt5) ? tLt5 : tLow;
    t5_10 = Number.isFinite(t5_10) ? t5_10 : tMid;
    mark("T/min <5 W/kg", !("T/min <5 W/kg" in r));
    mark("T/min 5-10 W/Kg", !("T/min 5-10 W/Kg" in r));
  } else { mark("T/min <5 W/kg", false); mark("T/min 5-10 W/Kg", false); }

  // ---- Velocità ----
  let smax = r["SMax (kmh)"];
  if (!Number.isFinite(smax)) {
    smax = Match==="Yes" ? 30 : 28;
    if (roleOf(Position)==="Portiere") smax = 26;
    mark("SMax (kmh", true);
  }

  // ---- MaxPM5 ----
  let maxPM5 = r.MaxPM5;
  if (!Number.isFinite(maxPM5)) {
    maxPM5 = round(clamp(nz(pmm) * 1.6, 8, 22), 2);
    mark("MaxPM5", true);
  } else mark("MaxPM5", false);

  // ---- Training Load ----
  let TL = r["Training Load"];
  if (!Number.isFinite(TL)) {
    const hsrPct = safeDiv(nz(dOver20), dist);
    const density = safeDiv(nz(nAcc3) + nz(nDec3), T);
    const K1 = opts?.tlK1 ?? 0.5, K2 = opts?.tlK2 ?? 0.02;
    TL = Math.round(dist * (1 + K1 * hsrPct + K2 * density));
    mark("Training Load", true);
  } else mark("Training Load", false);

  // ---- RVP ----
  let rvp = r.RVP;
  if (!Number.isFinite(rvp)) {
    const sprintRatio = safeDiv(nz(d25p), dist);
    const dens = safeDiv(nz(nAcc3)+nz(nDec3), T);
    rvp = Math.round(clamp(50 + 60*safeDiv(nz(dOver20), dist) + 1.8*nz(pmm) + 8*sprintRatio + 4*dens, 45, 98));
    mark("RVP", true);
  } else mark("RVP", false);

  // ---- Output coerente ----
  const row = {
    Player, Position, T,
    "Distanza (m)": dist,
    "Dist Equivalente": distEq,
    "%Eq Dist": eqPct,
    "Dist/min": distPerMin,
    "Pot. met. media": pmm,
    "D > 20 W/Kg": d20w,
    "D Acc > 2m/s2": dAcc2,
    "D Dec > -2m/s2": dDec2,
    "D > 15 Km/h": dOver15,
    "%D acc > 2m/s2": pctAcc2,
    "%D Dec > -2 m/s2": pctDec2,
    "T/min <5 W/kg": tLt5,
    "T/min 5-10 W/Kg": t5_10,
    "D 15-20 km/h": d15_20,
    "D 20-25 km/h": d20_25,
    "D > 25 km/h": d25p,
    "SMax (kmh)": smax,
    "D Acc/min > 2 m/s2": accPerMin,
    "D Dec/min > -2m/s2": decPerMin,
    RVP: rvp,
    "D>35 W": d35w,
    "Training Load": TL,
    "D > 20 km/h": dOver20,
    "D Acc > 3 m/s2": dAcc3,
    "D Dec < -3 m/s2": dDec3,
    "Num Acc > 3 m/s2": nAcc3,
    "Num Dec <-3 m/s2": nDec3,
    MaxPM5: maxPM5,
    Day, Match, Drill, Note
  };

  // clamp numerici (non negativi)
  Object.keys(row).forEach(k => {
    const v = row[k];
    if (typeof v === "number") row[k] = Math.max(0, v);
  });

  return { row, imputationFlags: flags };
}

module.exports = { completeRow };

