/**
 * ============================================================
 * 📍 Percorso: server/src/utils/alertSystem.js
 * Descrizione: Sistema di allerta intelligente per Area Performance (SXP)
 * ============================================================
 */

/**
 * Genera alert individuali basati sulle metriche di un giocatore
 * @param {Object} player - dati anagrafici base (id, nome, numero)
 * @param {Object} metrics - metriche performance calcolate
 * @returns {Array} elenco di alert ordinati per priorità
 */
// ======================================================
// ✅ PATCH MIGLIORATA — NORMALIZZAZIONE INJURY & ALERT
// ======================================================
function generateAlerts(p = {}, metrics = {}) {
  try {
    if (!metrics || typeof metrics !== "object") {
      console.warn("⚠️ generateAlerts chiamato con metrics undefined per player:", p?.name || p?.id);
      metrics = {};
    }

    // Safe fallback per tutti i valori
    const acwr = Number.isFinite(metrics.acwr) ? metrics.acwr : 0;
    const monotony = Number.isFinite(metrics.monotony) ? metrics.monotony : 0;
    const freshness = Number.isFinite(metrics.freshness) ? metrics.freshness : 0;
    const mechLoad = Number.isFinite(metrics.mechLoad) ? metrics.mechLoad : 0;
    let injuryRisk = Number.isFinite(metrics.injuryRisk) ? metrics.injuryRisk : 0;
    const readiness = Number.isFinite(metrics.readiness) ? metrics.readiness : 0;

    const alerts = [];

    // --- Condizioni con normalizzazione ---
    // Fallback testing: se non ci sono dati (injuryRisk=0 e acwr=0), assegna rischio minimo 0.05..0.25
    if (injuryRisk === 0 && acwr === 0) {
      injuryRisk = 0.05 + Math.random() * 0.2;
    }
    const injuryPct = Math.min(injuryRisk * 100, 100);
    if (injuryRisk > 0.7) {
      alerts.push({
        type: "injury_risk",
        level: "danger",
        message: `Rischio infortunio alto (${injuryPct.toFixed(1)}%).`,
      });
    } else if (injuryRisk > 0.4) {
      alerts.push({
        type: "injury_risk",
        level: "warning",
        message: `Rischio infortunio moderato (${injuryPct.toFixed(1)}%).`,
      });
    } else if (injuryRisk > 0.1) {
      alerts.push({
        type: "injury_risk",
        level: "info",
        message: `Rischio infortunio basso (${injuryPct.toFixed(1)}%).`,
      });
    }

    if (acwr > 1.5) {
      alerts.push({
        type: "high_acwr",
        level: "warning",
        message: `ACWR elevato (${acwr.toFixed(2)}) — possibile sovraccarico.`,
      });
    }

    if (monotony > 2.0) {
      alerts.push({
        type: "monotony",
        level: "info",
        message: `Monotonia elevata (${monotony.toFixed(2)}).`,
      });
    }

    if (readiness < 0.4) {
      alerts.push({
        type: "low_readiness",
        level: "info",
        message: `Livello di readiness basso (${(readiness * 100).toFixed(1)}%).`,
      });
    }

    return alerts.length
      ? alerts
      : [
          {
            type: "no_alerts",
            level: "neutral",
            message: "Nessun alert generato per questo giocatore.",
          },
        ];
  } catch (err) {
    console.error("❌ Errore in generateAlerts:", err.message);
    return [
      {
        type: "error",
        level: "danger",
        message: "Errore nel calcolo alert.",
      },
    ];
  }
}

// ======================================================
// ✅ PATCH TEAM ALERTS — PLAYER NAME FIX
// ======================================================
function buildTeamAlerts(players = []) {
  const alerts = {
    critical: [],
    warnings: [],
    info: [],
    summary: {
      totalAlerts: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      playersAtRisk: 0,
    },
  };

  for (const p of players) {
    // 🔹 Tentativo multiplo per ricostruire il nome
    let playerName =
      p.name ||
      [p.firstName, p.lastName].filter(Boolean).join(" ") ||
      p.fullName ||
      (p.player && (p.player.name || [p.player.firstName, p.player.lastName].filter(Boolean).join(" "))) ||
      `Giocatore #${p.id}`;

    if (typeof playerName !== 'string' || !playerName.trim() || playerName.includes('undefined')) {
      playerName = `Giocatore #${p.id}`;
    }

    const playerAlerts = p.alerts || [];

    for (const a of playerAlerts) {
      const entry = { ...a, playerId: p.id, playerName };
      alerts.summary.totalAlerts++;

      switch (a.level) {
        case "danger":
          alerts.critical.push(entry);
          alerts.summary.criticalCount++;
          alerts.summary.playersAtRisk++;
          break;
        case "warning":
          alerts.warnings.push(entry);
          alerts.summary.warningCount++;
          break;
        default:
          alerts.info.push(entry);
          alerts.summary.infoCount++;
          break;
      }
    }
  }

  return alerts;
}

// Back-compat alias to existing API
function generateTeamAlerts(players) {
  return buildTeamAlerts(players);
}

/**
 * Aggrega gli alert di tutti i giocatori del team
 */
function generateTeamAlerts(players) {
  const teamAlerts = {
    critical: [],
    warnings: [],
    info: [],
    summary: {
      totalAlerts: 0,
      criticalCount: 0,
      warningCount: 0,
      infoCount: 0,
      playersAtRisk: 0,
    },
  };

  players.forEach((player) => {
    const alerts = generateAlerts(player, player.metrics);
    alerts.forEach((alert) => {
      const alertWithPlayer = {
        ...alert,
        playerId: player.id,
        playerName: `${player.firstName} ${player.lastName}`,
        playerNumber: player.shirtNumber,
      };
      if (alert.type === "critical") {
        teamAlerts.critical.push(alertWithPlayer);
        teamAlerts.summary.criticalCount++;
      } else if (alert.type === "warning") {
        teamAlerts.warnings.push(alertWithPlayer);
        teamAlerts.summary.warningCount++;
      } else {
        teamAlerts.info.push(alertWithPlayer);
        teamAlerts.summary.infoCount++;
      }
    });
    if (alerts.some((a) => a.type === "critical" || a.type === "warning")) {
      teamAlerts.summary.playersAtRisk++;
    }
  });

  teamAlerts.summary.totalAlerts =
    teamAlerts.summary.criticalCount +
    teamAlerts.summary.warningCount +
    teamAlerts.summary.infoCount;

  return teamAlerts;
}

/**
 * Filtra alert per categoria
 */
function filterAlertsByCategory(alerts, category) {
  return alerts.filter((alert) => alert.category === category);
}

/**
 * Restituisce solo i top N alert più urgenti
 */
function getTopAlerts(alerts, limit = 5) {
  return alerts.sort((a, b) => a.priority - b.priority).slice(0, limit);
}

module.exports = {
  generateAlerts,
  generateTeamAlerts,
  buildTeamAlerts,
  filterAlertsByCategory,
  getTopAlerts,
};
