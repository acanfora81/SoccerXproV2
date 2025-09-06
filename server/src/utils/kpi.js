// server/src/utils/kpi.js
const { dlog, dwarn, derr } = require("./logger");

/**
 * Calcola HSR (High Speed Running) - Distanza percorsa sopra i 15 km/h
 * @param {Array} rows - Array di sessioni con dati di velocità
 * @returns {number} Distanza totale HSR in metri
 */
function computeHSR(rows) {
  if (!rows || !Array.isArray(rows)) return 0;
  
  return rows.reduce((sum, p) => {
    // Calcola HSR dalle zone di velocità (15+ km/h)
    let hsr = (Number(p?.distance_over_15_kmh_m) || 0) +
              (Number(p?.distance_15_20_kmh_m) || 0) +
              (Number(p?.distance_20_25_kmh_m) || 0) +
              (Number(p?.distance_over_25_kmh_m) || 0);
    
    // Validazione: HSR non può essere maggiore della distanza totale
    const totalDistance = Number(p?.total_distance_m) || 0;
    if (totalDistance > 0 && hsr > totalDistance) {
      dwarn(`HSR (${hsr}m) maggiore della distanza totale (${totalDistance}m)`);
      hsr = totalDistance * 0.3; // Stima conservativa: 30% della distanza totale
    }
    
    // Se ancora 0, stima da sprint distance (fallback)
    if (hsr === 0 && Number(p?.sprint_distance_m) > 0) {
      hsr = Math.round(Number(p.sprint_distance_m) * 2.5);
    }
    
    return sum + hsr;
  }, 0);
}

/**
 * Calcola il numero di sprint per 90 minuti
 * @param {Array} rows - Array di sessioni con dati di sprint
 * @returns {number} Sprint normalizzati per 90 minuti
 */
function computeSprintPer90(rows) {
  if (!rows || !Array.isArray(rows)) return 0;
  
  const totSprints = rows.reduce((sum, p) => {
    // Priorità: sprint_count > derivazione da accelerazioni > fallback
    let sprints = Number(p?.sprint_count) || 0;
    
    // Stima da accelerazioni intense se sprint_count non disponibile
    if (sprints === 0 && Number(p?.num_acc_over_3_ms2) > 0) {
      sprints = Math.round(Number(p.num_acc_over_3_ms2) * 0.7); // Stima conservativa
    }
    
    // Validazione: numero ragionevole di sprint per sessione
    if (sprints > 100) {
      dwarn(`Numero sprint anomalo: ${sprints} per sessione`);
      sprints = 100; // Cap massimo ragionevole
    }
    
    return sum + sprints;
  }, 0);
  
  const totalMinutes = rows.reduce((sum, p) => sum + (Number(p?.duration_minutes) || 0), 0);
  return totalMinutes > 0 ? (totSprints * 90) / totalMinutes : 0;
}

/**
 * Calcola ACWR (Acute:Chronic Workload Ratio) per un giocatore
 * Usa finestre rolling di 7 giorni (acuto) e 28 giorni (cronico)
 * 
 * @param {Array} sessions - Array di sessioni individuali con training_load
 * @returns {Array} Array di oggetti con ACWR calcolato per ogni data
 */
function calculateACWR(sessions) {
  if (!sessions || sessions.length === 0) return [];

  // Ordina sessioni per data
  sessions.sort((a, b) => new Date(a.session_date) - new Date(b.session_date));

  // Raggruppa per giocatore
  const sessionsByPlayer = {};
  for (const s of sessions) {
    const playerId = s.playerId || s.player_id;
    if (!sessionsByPlayer[playerId]) sessionsByPlayer[playerId] = [];
    sessionsByPlayer[playerId].push(s);
  }

  const results = [];

  // Calcola ACWR per ogni giocatore
  for (const playerId of Object.keys(sessionsByPlayer)) {
    const playerSessions = sessionsByPlayer[playerId];

    for (let i = 0; i < playerSessions.length; i++) {
      const currentDate = new Date(playerSessions[i].session_date);

      // Finestra ultimi 7 giorni (acuto) - CORRETTO
      const acuteWindow = playerSessions.filter(s => {
        const d = new Date(s.session_date);
        const diffDays = (currentDate - d) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 7;
      });

      // Finestra ultimi 28 giorni (cronico) - CORRETTO
      const chronicWindow = playerSessions.filter(s => {
        const d = new Date(s.session_date);
        const diffDays = (currentDate - d) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays < 28;
      });

      // Calcola carichi medi giornalieri
      const acuteLoad = acuteWindow.reduce((sum, s) => {
        const load = s.training_load || s.player_load || 0;
        return sum + load;
      }, 0) / 7; // Media su 7 giorni

      const chronicLoad = chronicWindow.reduce((sum, s) => {
        const load = s.training_load || s.player_load || 0;
        return sum + load;
      }, 0) / 28; // Media su 28 giorni

      // Calcola ACWR con gestione sicura della divisione
      let acwr = null;
      let riskLevel = 'N/A';
      
      if (chronicLoad > 0) {
        acwr = acuteLoad / chronicLoad;
        
        // Classificazione del rischio secondo letteratura scientifica
        if (acwr < 0.8) {
          riskLevel = 'Sotto-carico (rischio medio)';
        } else if (acwr >= 0.8 && acwr <= 1.3) {
          riskLevel = 'Ottimale (rischio basso)';
        } else if (acwr > 1.3 && acwr <= 1.5) {
          riskLevel = 'Carico elevato (rischio medio)';
        } else {
          riskLevel = 'Sovraccarico (rischio alto)';
        }
      }

      results.push({
        playerId: Number(playerId),
        date: currentDate.toISOString().split("T")[0],
        acuteLoad: round(acuteLoad, 2),
        chronicLoad: round(chronicLoad, 2),
        acwr: round(acwr, 2),
        riskLevel,
        sessionsInAcute: acuteWindow.length,
        sessionsInChronic: chronicWindow.length
      });
    }
  }

  return results;
}

/**
 * Calcola la distanza per minuto (intensità del lavoro)
 * @param {Array} rows - Array di sessioni
 * @returns {number} Metri per minuto medi
 */
function computeDistancePerMinute(rows) {
  if (!rows || !Array.isArray(rows)) return 0;
  
  const totalDistance = rows.reduce((sum, p) => sum + (Number(p?.total_distance_m) || 0), 0);
  const totalMinutes = rows.reduce((sum, p) => sum + (Number(p?.duration_minutes) || 0), 0);
  
  return totalMinutes > 0 ? totalDistance / totalMinutes : 0;
}

/**
 * Calcola il PlayerLoad per minuto
 * @param {Array} rows - Array di sessioni
 * @returns {number} PlayerLoad per minuto medio
 */
function computePlayerLoadPerMinute(rows) {
  if (!rows || !Array.isArray(rows)) return 0;
  
  const totalLoad = rows.reduce((sum, p) => sum + (Number(p?.player_load) || 0), 0);
  const totalMinutes = rows.reduce((sum, p) => sum + (Number(p?.duration_minutes) || 0), 0);
  
  return totalMinutes > 0 ? totalLoad / totalMinutes : 0;
}

/**
 * Costruisce il range di date per il periodo specificato
 * @param {string} period - Tipo di periodo (week, month, quarter, season, custom)
 * @param {Date} customStart - Data inizio per periodo custom
 * @param {Date} customEnd - Data fine per periodo custom
 * @returns {Object} Oggetto con periodStart e periodEnd
 */
function buildPeriodRange(period, customStart, customEnd) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Fine del giorno corrente

  switch (period) {
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - 6); // Ultimi 7 giorni incluso oggi
      start.setHours(0, 0, 0, 0);
      return { periodStart: start, periodEnd: today };
    }

    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      return { periodStart: start, periodEnd: today };
    }

    case "quarter": {
      // Calcola il trimestre corrente
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const start = new Date(today.getFullYear(), currentQuarter * 3, 1);
      start.setHours(0, 0, 0, 0);
      return { periodStart: start, periodEnd: today };
    }

    case "season": {
      // Stagione calcistica (agosto - maggio)
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth();
      let seasonStart;
      
      if (currentMonth >= 7) { // Agosto o dopo
        seasonStart = new Date(currentYear, 7, 1); // 1 agosto anno corrente
      } else { // Prima di agosto
        seasonStart = new Date(currentYear - 1, 7, 1); // 1 agosto anno precedente
      }
      seasonStart.setHours(0, 0, 0, 0);
      return { periodStart: seasonStart, periodEnd: today };
    }

    case "custom": {
      // 🔧 FIX: Gestione robusta delle date per evitare problemi di fuso orario
      let start = null;
      let end = null;
      
      // 🔧 DEBUG: Log delle date di input
      dlog(`🔍 buildPeriodRange custom - Input: startDate="${customStart}", endDate="${customEnd}"`);
      
      if (customStart) {
        // Assicurati che la data sia interpretata come UTC per evitare problemi di fuso orario
        start = new Date(customStart + 'T00:00:00.000Z');
        dlog(`🔍 buildPeriodRange custom - periodStart: ${start.toISOString()}`);
      }
      
      if (customEnd) {
        // Assicurati che la data sia interpretata come UTC e includa tutto il giorno
        end = new Date(customEnd + 'T23:59:59.999Z');
        dlog(`🔍 buildPeriodRange custom - periodEnd: ${end.toISOString()}`);
      }
      
      // 🔧 DEBUG: Verifica che il 31/08 sia incluso se richiesto
      if (customEnd && customEnd.includes('08-31')) {
        const testDate = new Date('2025-08-31T00:00:00.000Z');
        const isIncluded = testDate >= start && testDate <= end;
        dlog(`🔍 Verifica inclusione 31/08: ${isIncluded} (testDate: ${testDate.toISOString()}, range: ${start.toISOString()} - ${end.toISOString()})`);
      }
      
      return {
        periodStart: start,
        periodEnd: end,
      };
    }

    default:
      return { periodStart: null, periodEnd: null };
  }
}

/**
 * Parsing del filtro per tipo di sessione (nomi specifici)
 * @param {string} sessionType - Tipo di sessione da filtrare
 * @returns {Object|undefined} Oggetto filtro per Prisma o undefined
 */
function parseSessionTypeFilter(sessionType) {
  // Mapping con i valori effettivi del database (colonna 'session_name')
  const typeMap = {
    // Categorie generali
    'training': ['Aerobico', 'Intermittente', 'Palestra+Campo', 'Situazionale', 'Pre-gara', 'Rigenerante'],
    'allenamento': ['Aerobico', 'Intermittente', 'Palestra+Campo', 'Situazionale', 'Pre-gara', 'Rigenerante'],
    'match': ['Campionato/Amichevole'],
    'partita': ['Campionato/Amichevole'],
    'test': ['Test', 'Valutazione'],
    
    // Tipi specifici
    'aerobico': ['Aerobico'],
    'intermittente': ['Intermittente'],
    'palestra+campo': ['Palestra+Campo'],
    'situazionale': ['Situazionale'],
    'pre-gara': ['Pre-gara'],
    'rigenerante': ['Rigenerante'],
    'campionato/amichevole': ['Campionato/Amichevole'],
    'campionato': ['Campionato/Amichevole'],
    'amichevole': ['Campionato/Amichevole']
  };

  const key = (sessionType || 'all').toLowerCase();
  
  if (key === 'all' || !typeMap[key]) {
    return undefined; // Nessun filtro = tutte le sessioni
  }
  
  return { in: typeMap[key] };
}

/**
 * Parsing del filtro per tipo di sessione semplificato
 * @param {string} sessionType - Tipo di sessione (Allenamento/Partita)
 * @returns {string|undefined} Valore filtro o undefined
 */
function parseSessionTypeFilterSimple(sessionType) {
  // Mapping per la colonna session_type (Allenamento/Partita)
  const typeMap = {
    'allenamento': 'Allenamento',
    'training': 'Allenamento',
    'partita': 'Partita',
    'match': 'Partita',
    'gara': 'Partita'
  };

  const key = (sessionType || 'all').toLowerCase();
  
  if (key === 'all' || !typeMap[key]) {
    return undefined; // Nessun filtro = tutte le sessioni
  }
  
  return typeMap[key];
}

/**
 * Arrotonda un valore a N decimali
 * @param {number} v - Valore da arrotondare
 * @param {number} d - Numero di decimali (default 2)
 * @returns {number|null} Valore arrotondato o null se non valido
 */
const round = (v, d = 2) => {
  if (!Number.isFinite(v)) return null;
  return Number(v.toFixed(d));
};

/**
 * Calcola statistiche aggregate per KPI
 * @param {Array} data - Array di valori numerici
 * @returns {Object} Oggetto con min, max, avg, stdDev
 */
function calculateStats(data) {
  if (!data || data.length === 0) {
    return { min: null, max: null, avg: null, stdDev: null };
  }

  const validData = data.filter(v => Number.isFinite(v));
  if (validData.length === 0) {
    return { min: null, max: null, avg: null, stdDev: null };
  }

  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const avg = validData.reduce((sum, v) => sum + v, 0) / validData.length;
  
  // Calcola deviazione standard
  const variance = validData.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / validData.length;
  const stdDev = Math.sqrt(variance);

  return {
    min: round(min, 2),
    max: round(max, 2),
    avg: round(avg, 2),
    stdDev: round(stdDev, 2)
  };
}

/**
 * Valida i dati di una sessione per anomalie
 * @param {Object} session - Dati della sessione
 * @returns {Array} Array di warning/errori trovati
 */
function validateSessionData(session) {
  const issues = [];

  // Validazione distanza
  const totalDistance = Number(session?.total_distance_m) || 0;
  const duration = Number(session?.duration_minutes) || 0;
  
  if (duration > 0) {
    const distancePerMin = totalDistance / duration;
    
    // Controlli di plausibilità
    if (distancePerMin > 300) {
      issues.push(`Distanza/minuto anomala: ${distancePerMin.toFixed(1)} m/min`);
    }
    
    if (distancePerMin < 20 && session?.session_type === 'Partita') {
      issues.push(`Distanza/minuto troppo bassa per una partita: ${distancePerMin.toFixed(1)} m/min`);
    }
  }

  // Validazione velocità massima
  const maxSpeed = Number(session?.max_speed_kmh) || 0;
  if (maxSpeed > 40) {
    issues.push(`Velocità massima improbabile: ${maxSpeed} km/h`);
  }

  // Validazione HSR vs distanza totale
  const hsr = computeHSR([session]);
  if (hsr > totalDistance) {
    issues.push(`HSR (${hsr}m) maggiore della distanza totale (${totalDistance}m)`);
  }

  // Validazione sprint
  const sprintCount = Number(session?.sprint_count) || 0;
  if (sprintCount > 100) {
    issues.push(`Numero sprint anomalo: ${sprintCount}`);
  }

  return issues;
}

// 🔧 BACKWARD COMPATIBILITY: Mantiene la funzione computeACWR originale per compatibilità
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

module.exports = {
  // Funzioni principali KPI
  computeHSR,
  computeSprintPer90,
  calculateACWR,
  computeACWR, // Backward compatibility
  computeDistancePerMinute,
  computePlayerLoadPerMinute,
  
  // Funzioni di utilità
  buildPeriodRange,
  parseSessionTypeFilter,
  parseSessionTypeFilterSimple,
  round,
  calculateStats,
  validateSessionData
};