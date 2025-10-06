// ================================================
// 📦 KPI Calculation Service - Soccer X Pro
// ================================================
// Scopo: calcolare indicatori derivati coerenti con la pipeline esistente,
// SENZA toccare la logica di import, mapping o dossier già funzionante.
// Tutte le funzioni restituiscono numeri coerenti o null in caso di dati mancanti.

const calcDistancePerMin = (total_distance, duration_minutes) => {
  if (!total_distance || !duration_minutes || duration_minutes <= 0) return 0;
  return Number((total_distance / duration_minutes).toFixed(2));
};

// Rapporto tra distanza ad alta intensità e distanza totale
const calcIntensityRatio = (hsr_distance, sprint_distance, total_distance) => {
  if (!total_distance || total_distance <= 0) return 0;
  const high = (hsr_distance || 0) + (sprint_distance || 0);
  return Number(((high / total_distance) * 100).toFixed(1));
};

// Efficienza: carico per metro percorso
const calcEfficiencyIndex = (player_load, total_distance) => {
  if (!player_load || !total_distance) return null;
  return Number((player_load / total_distance).toFixed(3));
};

// Rapporto Sprint/HSR
const calcSprintHSRRatio = (sprint_distance, hsr_distance) => {
  if (!hsr_distance) return null;
  return Number((sprint_distance / hsr_distance).toFixed(2));
};

// ACWR medio su finestra dati
const calcAcwrAverage = (acwrValues = []) => {
  if (!acwrValues.length) return null;
  return Number((acwrValues.reduce((a, b) => a + b, 0) / acwrValues.length).toFixed(2));
};

// Proxy "Efficienza metabolica": distanza percorsa per carico
const calcMetabolicEfficiency = (total_distance, player_load) => {
  if (!total_distance || !player_load || player_load <= 0) return 0;
  return Number((total_distance / player_load).toFixed(3));
};

// Proxy "Indice di sforzo cardiaco": rapporto HR medio su carico
const calcCardioEffortIndex = (hr_avg, player_load) => {
  if (!hr_avg || !player_load || player_load <= 0) return 0;
  return Number(((hr_avg / player_load) * 100).toFixed(1));
};

// ================================================
// ✅ Tutte le funzioni sono pure, riutilizzabili e compatibili
// con qualsiasi endpoint o modulo dossier.
// ================================================

module.exports = {
  calcDistancePerMin,
  calcIntensityRatio,
  calcEfficiencyIndex,
  calcSprintHSRRatio,
  calcAcwrAverage,
  calcMetabolicEfficiency,
  calcCardioEffortIndex,
};


