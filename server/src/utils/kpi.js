// server/src/utils/kpi.js
const { dlog, dwarn, derr } = require("./logger");

function computeHSR(rows) {
  return rows.reduce((sum, p) => {
    // Calcola HSR dalle zone di velocità (15+ km/h)
    let v = (Number(p?.distance_over_15_kmh_m) || 0) +
            (Number(p?.distance_15_20_kmh_m) || 0) +
            (Number(p?.distance_20_25_kmh_m) || 0) +
            (Number(p?.distance_over_25_kmh_m) || 0);
    
    // Se ancora 0, stima da sprint distance
    if (v === 0 && Number(p?.sprint_distance_m) > 0) {
      v = Math.round(Number(p.sprint_distance_m) * 2.5);
    }
    return sum + v;
  }, 0);
}

// 🔧 FIX: Sprint/90 CORRETTO - usa sprint_count o derivazione coerente
function computeSprintPer90(rows) {
  const totSprints = rows.reduce((sum, p) => {
    // 🔧 Priorità: sprint_count > derivazione da accelerazioni > fallback
    let sprints = Number(p?.sprint_count) || 0;
    if (sprints === 0 && Number(p?.num_acc_over_3_ms2) > 0) {
      sprints = Math.round(Number(p.num_acc_over_3_ms2) * 0.7); // Stima conservativa
    }
    return sum + sprints;
  }, 0);
  
  const totalMinutes = rows.reduce((sum, p) => sum + (Number(p?.duration_minutes) || 0), 0);
  return totalMinutes > 0 ? (totSprints * 90) / totalMinutes : 0;
}

function computeACWR(allLoads, periodEnd) {
  const end = new Date(periodEnd);
  const acuteStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const chronicStart = new Date(end.getTime() - 28 * 24 * 60 * 60 * 1000);

  const acute = allLoads
    .filter(p => new Date(p.session_date) >= acuteStart && new Date(p.session_date) <= end)
    .reduce((s, p) => s + (Number(p?.player_load) || 0), 0);

  const chronicSum = allLoads
    .filter(p => new Date(p.session_date) >= chronicStart && new Date(p.session_date) <= end)
    .reduce((s, p) => s + (Number(p?.player_load) || 0), 0);

  const chronicWeekly = chronicSum / 4; // media 4 settimane
  return chronicWeekly > 0 ? acute / chronicWeekly : 0;
}

function buildPeriodRange(period, customStart, customEnd) {
  const today = new Date();

  switch (period) {
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - 6); // ultimi 7 giorni inclusi
      return { periodStart: start, periodEnd: today };
    }

    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { periodStart: start, periodEnd: today };
    }

    case "quarter": {
      const currentMonth = today.getMonth();
      const quarterStartMonth = currentMonth - 2; // ultimi 3 mesi
      const start = new Date(today.getFullYear(), quarterStartMonth, 1);
      return { periodStart: start, periodEnd: today };
    }

    case "custom": {
      return {
        periodStart: customStart ? new Date(customStart) : null,
        periodEnd: customEnd ? new Date(customEnd) : null,
      };
    }

    default:
      return { periodStart: null, periodEnd: null };
  }
}

function parseSessionTypeFilter(sessionType) {
  // 🔧 FIX: Mapping corretto con i valori effettivi del database
  // Nota: la colonna nel database si chiama 'session_name'
  switch ((sessionType || 'all').toLowerCase()) {
    case 'training':
      return { in: ['Aerobico', 'Intermittente', 'Palestra+Campo', 'Situazionale', 'Pre-gara', 'Rigenerante'] };
    case 'match':
      return { in: ['Campionato/Amichevole'] };
    case 'test':
      return { in: ['Test', 'Valutazione'] }; // Per eventuali test futuri
    case 'allenamento':
      return { in: ['Aerobico', 'Intermittente', 'Palestra+Campo', 'Situazionale', 'Pre-gara', 'Rigenerante'] };
    case 'partita':
      return { in: ['Campionato/Amichevole'] };
    case 'aerobico':
      return { in: ['Aerobico'] };
    case 'intermittente':
      return { in: ['Intermittente'] };
    case 'palestra+campo':
      return { in: ['Palestra+Campo'] };
    case 'situazionale':
      return { in: ['Situazionale'] };
    case 'pre-gara':
      return { in: ['Pre-gara'] };
    case 'rigenerante':
      return { in: ['Rigenerante'] };
    case 'campionato/amichevole':
      return { in: ['Campionato/Amichevole'] };
    case 'all':
    default:
      return undefined; // Nessun filtro = tutte le sessioni
  }
}

// 🆕 NUOVO: Funzione per filtrare per session_type (valori semplificati)
function parseSessionTypeFilterSimple(sessionType) {
  // 🔧 FIX: Mapping per la colonna session_type (Allenamento/Partita)
  switch ((sessionType || 'all').toLowerCase()) {
    case 'allenamento':
      return 'Allenamento';
    case 'partita':
      return 'Partita';
    case 'all':
    default:
      return undefined; // Nessun filtro = tutte le sessioni
  }
}

const round = (v, d = 2) => Number.isFinite(v) ? Number(v.toFixed(d)) : null;

/**
 * Calcola l'ACWR (Acute:Chronic Workload Ratio) per giocatore.
 * Richiede dati di sessioni individuali, non aggregati.
 * 
 * sessions: [
 *   { playerId, session_date, training_load }
 * ]
 */
function calculateACWR(sessions) {
  if (!sessions || sessions.length === 0) return [];

  // Ordina sessioni per data
  sessions.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

  // Raggruppa per giocatore
  const sessionsByPlayer = {};
  for (const s of sessions) {
    if (!sessionsByPlayer[s.playerId]) sessionsByPlayer[s.playerId] = [];
    sessionsByPlayer[s.playerId].push(s);
  }

  const results = [];

  // Calcola ACWR per ogni giocatore
  for (const playerId of Object.keys(sessionsByPlayer)) {
    const playerSessions = sessionsByPlayer[playerId];

    for (let i = 0; i < playerSessions.length; i++) {
      const currentDate = new Date(playerSessions[i].session_date);

      // Finestra ultimi 7 giorni (acuto)
      const acuteWindow = playerSessions.filter(s => {
        const d = new Date(s.session_date);
        return d >= new Date(currentDate.getTime() - 6 * 86400000) && d <= currentDate;
      });

      // Finestra ultimi 28 giorni (cronico)
      const chronicWindow = playerSessions.filter(s => {
        const d = new Date(s.session_date);
        return d >= new Date(currentDate.getTime() - 27 * 86400000) && d <= currentDate;
      });

      const acuteLoad = acuteWindow.reduce((sum, s) => sum + (s.training_load || 0), 0) / Math.max(acuteWindow.length, 1);
      const chronicLoad = chronicWindow.reduce((sum, s) => sum + (s.training_load || 0), 0) / Math.max(chronicWindow.length, 1);

      const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : null;

      results.push({
        playerId: Number(playerId),
        date: currentDate.toISOString().split("T")[0],
        acuteLoad,
        chronicLoad,
        acwr
      });
    }
  }

  return results;
}

module.exports = {
  computeHSR,
  computeSprintPer90,
  computeACWR,
  buildPeriodRange,
  parseSessionTypeFilter,
  parseSessionTypeFilterSimple,
  round,
  calculateACWR
};
