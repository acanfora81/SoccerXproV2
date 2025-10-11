/**
 * ============================================================
 * 📍 Percorso: server/src/utils/advancedMetrics.js
 * Descrizione: Metriche avanzate per Area Performance (SXP)
 * ============================================================
 */

// ========================================
// A. GESTIONE DEL CARICO
// ========================================

function calculateMonotony(dailyLoads) {
  if (!dailyLoads || dailyLoads.length < 3) return 0;
  const mean = dailyLoads.reduce((a, b) => a + b, 0) / dailyLoads.length;
  const variance =
    dailyLoads.reduce((sum, load) => sum + Math.pow(load - mean, 2), 0) /
    dailyLoads.length;
  const stdDev = Math.sqrt(variance);
  return stdDev > 0 ? Number((mean / stdDev).toFixed(2)) : 0;
}

function calculateTrainingStrain(weeklyLoad, monotony) {
  return Number((weeklyLoad * monotony).toFixed(0));
}

function calculateFreshness(chronicLoad, acuteLoad) {
  return Number((chronicLoad - acuteLoad).toFixed(0));
}

// ========================================
// B. ANALISI NEUROMUSCOLARE
// ========================================

function calculateMechanicalLoad(accelerations, decelerations, playerLoad) {
  if (!playerLoad || playerLoad === 0) return 0;
  const weightedLoad = accelerations * 1.2 + decelerations * 1.8;
  return Number((weightedLoad / playerLoad).toFixed(2));
}

function calculateAccelDensity(totalAccelerations, durationMinutes) {
  if (!durationMinutes || durationMinutes === 0) return 0;
  return Number((totalAccelerations / durationMinutes).toFixed(2));
}

function calculateEDI(sprintDistance, totalDistance) {
  if (!totalDistance || totalDistance === 0) return 0;
  return Number(((sprintDistance / totalDistance) * 100).toFixed(2));
}

function calculateSprintEfficiency(sprintCount, sprintDistance) {
  if (!sprintCount || sprintCount === 0) return 0;
  return Number((sprintDistance / sprintCount).toFixed(1));
}

// ========================================
// C. ANALISI CARDIACA AVANZATA
// ========================================

function calculateTRIMP(duration, avgHR, restingHR = 60, maxHR = 190, gender = "M") {
  if (!duration || !avgHR || avgHR <= restingHR) return 0;
  const hrReserve = (avgHR - restingHR) / (maxHR - restingHR);
  const k = gender === "M" ? 1.92 : 1.67;
  return Number((duration * hrReserve * 0.64 * Math.exp(k * hrReserve)).toFixed(0));
}

function calculateCardiacEfficiency(totalDistance, avgHR, duration) {
  if (!avgHR || !duration || avgHR === 0 || duration === 0) return 0;
  const totalBeats = avgHR * duration;
  return Number((totalDistance / totalBeats).toFixed(2));
}

// ========================================
// D. PERFORMANCE QUALITATIVA
// ========================================

function calculateTechnicalLoad(sprints, hsr, playerLoad) {
  if (!playerLoad || playerLoad === 0) return 0;
  return Number((((sprints * 100 + hsr * 10) / playerLoad) * 100).toFixed(0));
}

function calculatePowerWeight(metabolicPower, playerWeight) {
  if (!playerWeight || playerWeight === 0) return 0;
  return Number((metabolicPower / playerWeight).toFixed(2));
}

// ========================================
// E. PREVENZIONE INFORTUNI
// ========================================

// ======================================================
// ✅ PATCH DEFINITIVA — NORMALIZZAZIONE INJURY RISK
// ======================================================
function calculateInjuryRisk({ acwr = 0, monotony = 0, mechLoad = 0, freshness = 0 }) {
  try {
    // Calcolo rischio infortuni normalizzato (0..1)
    let risk = 0.4 * acwr + 0.3 * monotony + 0.2 * mechLoad - 0.1 * freshness;
    if (!Number.isFinite(risk)) risk = 0;
    risk = Math.max(0, Math.min(risk, 1));
    return Number(risk.toFixed(2));
  } catch (err) {
    console.error("❌ Errore in calculateInjuryRisk:", err.message);
    return 0;
  }
}

function getInjuryRiskAlert(riskScore) {
  if (riskScore < 20)
    return { level: "low", color: "success", message: "Rischio basso" };
  if (riskScore < 40)
    return { level: "moderate", color: "warning", message: "Monitorare" };
  if (riskScore < 60)
    return {
      level: "high",
      color: "danger",
      message: "Rischio elevato - Ridurre carico",
    };
  return { level: "critical", color: "danger", message: "CRITICO - Riposo necessario" };
}

// ========================================
// F. READINESS & WELLNESS
// ========================================

function calculateReadiness(wellness, metrics) {
  const { sleepQuality = 5, muscleSoreness = 5, fatigueLevel = 5, stress = 5 } = wellness;
  const { rpe = 5, acwr = 1.0, freshness = 0 } = metrics;
  const wellnessScore =
    (sleepQuality * 0.35 +
      (10 - muscleSoreness) * 0.3 +
      (10 - fatigueLevel) * 0.25 +
      (10 - stress) * 0.1) *
    4;
  const performanceScore =
    ((10 - Math.abs(rpe - 5.5) * 2) * 2 +
      (acwr >= 0.8 && acwr <= 1.3 ? 20 : acwr > 1.5 ? 5 : 10) +
      (freshness > 0 ? 20 : Math.max(0, 20 + freshness / 25))) *
    0.6;
  return Math.min(Math.round(wellnessScore + performanceScore), 100);
}

function getReadinessLevel(readinessScore) {
  if (readinessScore >= 80)
    return {
      level: "optimal",
      color: "success",
      message: "Pronto per allenamento intenso",
    };
  if (readinessScore >= 60)
    return { level: "good", color: "success", message: "Buona forma" };
  if (readinessScore >= 40)
    return { level: "moderate", color: "warning", message: "Moderare intensità" };
  return { level: "low", color: "danger", message: "Recupero consigliato" };
}

// ========================================
// EXPORT
// ========================================

module.exports = {
  calculateMonotony,
  calculateTrainingStrain,
  calculateFreshness,
  calculateMechanicalLoad,
  calculateAccelDensity,
  calculateEDI,
  calculateSprintEfficiency,
  calculateTRIMP,
  calculateCardiacEfficiency,
  calculateTechnicalLoad,
  calculatePowerWeight,
  calculateInjuryRisk,
  getInjuryRiskAlert,
  calculateReadiness,
  getReadinessLevel,
};
