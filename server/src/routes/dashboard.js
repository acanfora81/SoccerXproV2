// server/src/routes/dashboard.js
// ============================================================================
// Dashboard Team API - Multi-tenant via tenantContext (req.context.teamId)
// VERSIONE CORRETTA - Bug fix formule e calcoli
// ============================================================================

const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { parseSessionTypeFilter, parseSessionTypeFilterSimple, computeHSR } = require('../utils/kpi');

// 🔧 FIX: Aggiorna parsing dei filtri in dashboard.js per allineamento
function parseFiltersForDashboard(req) {
  const sessionType = req.query?.sessionType || 'all';
  const sessionName = req.query?.sessionName || 'all';
  const roles = (req.query?.roles || '').split(',').filter(Boolean);
  
  // 🔧 FIX: Mapping sessionType per database (con capitalizzazione corretta)
  const sessionTypeFilter = sessionType === 'all' ? null : 
    (sessionType === 'training' ? 'Allenamento' : 
     sessionType === 'match' ? 'Partita' : sessionType);
  
  // 🔧 FIX: Mapping sessionName diretto (è già corretto nel DB)
  const sessionNameFilter = sessionName === 'all' ? null : sessionName;
  
  console.log('🔵 [DEBUG] Dashboard filtri parsed:', {
    sessionType, sessionTypeFilter,
    sessionName, sessionNameFilter,
    roles
  }); // INFO DEV - rimuovere in produzione
  
  return {
    sessionTypeFilter,
    sessionNameFilter,
    roles
  };
}
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

// 🔍 DEBUG: Log di caricamento routes
console.log("🟢 Dashboard routes caricate...");

// ============================================================================
// STEP 1: Funzione unificata per costruire DashboardData
// ============================================================================
function buildDashboardData(rows, windowEnd) {
  return {
    summary: buildOverview(rows),
    eventsSummary: buildEventsSummary(rows), // 🔧 FIX: Aggiungi conteggio allenamenti e partite (corretto nome proprietà)
    load: buildLoad(rows),
    intensity: buildIntensity(rows),
    speed: buildSpeed(rows),
    accelerations: buildAccelerations(rows),
    cardio: buildCardio(rows),
    readiness: buildReadiness(rows, windowEnd)
  };
}

// === Derivation config ===
const CFG = {
  // CORRETTO: media lunghezza sprint reale (~25-30m, non 45m)
  AVG_SPRINT_LENGTH_M: 30,
  // CORRETTO: passi per metro più realistici
  STEPS_PER_M: 1.28,
  // soglie accelerazioni/decelerazioni
  ACC_FIELD: 'acc_events_per_min_over_3_ms2',
  DEC_FIELD: 'dec_events_per_min_over_minus3_ms2',
  ACC_FALLBACK: 'acc_events_per_min_over_2_ms2',
  DEC_FALLBACK: 'dec_events_per_min_over_minus2_ms2'
};

const r1 = (x) => round(x, 1);
const r2 = (x) => round(x, 2);

// -----------------------------
// Utils
// -----------------------------
const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);
const mean = (arr) => (arr.length ? sum(arr) / arr.length : 0);
const round = (v, d = 0) => {
  const p = Math.pow(10, d);
  return Math.round((Number(v) || 0) * p) / p;
};
const toNum = (v) => (v == null ? 0 : Number(v) || 0);
const clampInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

// 🔧 FIX: Funzioni UTC per evitare problemi di fuso orario
const startOfDay = (d) => { 
  const x = new Date(d); 
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), 0, 0, 0, 0)); 
};
const endOfDay = (d) => { 
  const x = new Date(d); 
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate(), 23, 59, 59, 999)); 
};
// 🔧 FIX: Date handling sicuro con UTC per evitare problemi di fuso orario
const parseDate = (v) => { 
  if (!v) return null; 
  try {
    // 🔧 FIX: Forza interpretazione UTC per evitare problemi di fuso orario
    const d = new Date(v + 'T00:00:00.000Z');
    return Number.isNaN(d.getTime()) ? null : d;
  } catch (error) {
    console.warn('Errore parsing data:', v, error);
    return null;
  }
};

// 🔧 FIX: Parsing session date sicuro
const parseSessionDate = (sessionDateStr) => {
  if (!sessionDateStr) return new Date();
  
  try {
    // Gestisce formato '2025-07-01 00:00:00'
    const dateOnly = sessionDateStr.toString().split(' ')[0];
    const parsed = new Date(dateOnly);
    
    if (Number.isNaN(parsed.getTime())) {
      console.warn('Data invalida:', sessionDateStr);
      return new Date();
    }
    
    return parsed;
  } catch (error) {
    console.warn('Errore parsing data:', sessionDateStr, error);
    return new Date();
  }
};

// 🔧 FIX: Funzioni per gestione unità coerente
const formatDistance = (meters) => ({
  meters: Math.round(meters),
  kilometers: Math.round(meters / 1000 * 100) / 100,
  display: meters > 10000 ? `${(meters/1000).toFixed(1)} km` : `${Math.round(meters)} m`
});

const formatSpeed = (metersPerSecond) => ({
  mps: metersPerSecond,
  kmh: Math.round(metersPerSecond * 3.6 * 100) / 100,
  display: `${Math.round(metersPerSecond * 3.6)} km/h`
});

function normalizePeriod({ period = 'week', startDate, endDate }) {
  // 🔧 DEBUG: Log delle date di input per custom period
  if (period === 'custom') {
    console.log(`🔍 normalizePeriod custom - Input: startDate="${startDate}", endDate="${endDate}"`);
  }
  
  const s = parseDate(startDate);
  const e = parseDate(endDate);
  if (s && e) {
    const result = { start: startOfDay(s), end: endOfDay(e), type: 'custom' };
    
    // 🔧 DEBUG: Log delle date elaborate per custom period
    if (period === 'custom') {
      console.log(`🔍 normalizePeriod custom - Elaborate: start=${result.start.toISOString()}, end=${result.end.toISOString()}`);
      
      // 🔧 DEBUG: Verifica che il 31/08 sia incluso se richiesto
      if (endDate && endDate.includes('08-31')) {
        const testDate = new Date('2025-08-31T00:00:00.000Z');
        const isIncluded = testDate >= result.start && testDate <= result.end;
        console.log(`🔍 Verifica inclusione 31/08: ${isIncluded} (testDate: ${testDate.toISOString()}, range: ${result.start.toISOString()} - ${result.end.toISOString()})`);
      }
    }
    
    return result;
  }

  const today = new Date();
  let from = new Date(today);
  switch ((period || '').toString().toLowerCase()) {
    case 'month':   from = new Date(today.getFullYear(), today.getMonth(), 1);   break;
    case 'quarter': 
      const currentQuarter = Math.floor(today.getMonth() / 3);
      from = new Date(today.getFullYear(), currentQuarter * 3, 1);
      break;
    case 'week':
    default:        from.setDate(from.getDate() - 7);
  }
  return { start: startOfDay(from), end: endOfDay(today), type: (period || 'week') };
}

function previousWindow({ start, end }) {
  const ms = end.getTime() - start.getTime();
  const prevEnd   = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - ms);
  return { start: startOfDay(prevStart), end: endOfDay(prevEnd) };
}

function percentTrend(curr, prev) {
  const c = Number(curr) || 0;
  const p = Number(prev) || 0;
  if (p === 0) {
    if (c === 0) return 0;
    return null; // Indica "n/a" per il frontend
  }
  return round(((c - p) / p) * 100, 1);
}

// -----------------------------
// Data access - VERSIONE MIGLIORATA
// -----------------------------

function deriveRow(r) {
  // 🔧 FIX: Gestione record vuoti (giorni senza sessioni)
  if (!r.playerId || !r.player) {
    // Record vuoto per giorno senza sessioni
    return {
      ...r,
      _est: { empty: true },
      // Tutti i campi derivati a 0
      high_intensity_distance_m: 0,
      sprint_count: 0,
      steps_count: 0,
      accelerations_count: 0,
      decelerations_count: 0,
      player_load_per_min: 0,
      session_rpe: 0,
      rpe: 0,
      avg_speed_kmh: 0
    };
  }

  const est = {}; // flag di stima
  const dur = toNum(r.duration_minutes);

  // 🔧 FIX: HSR standardizzato - una sola definizione coerente
  let hsr = toNum(r.high_intensity_distance_m);
  if (!hsr) {
    // 🔧 Priorità: distance_over_15_kmh_m > distance_over_20_kmh_m > zone20_25 + over25
    const over15 = toNum(r.distance_over_15_kmh_m);
    if (over15) {
      hsr = over15;
      est.hsr = 'distance_over_15_kmh_m';
    } else {
      const over20 = toNum(r.distance_over_20_kmh_m);
      if (over20) { 
        hsr = over20; 
        est.hsr = 'distance_over_20_kmh_m'; 
      } else {
        const z2025 = toNum(r.distance_20_25_kmh_m);
        const over25 = toNum(r.distance_over_25_kmh_m);
        if (z2025 || over25) {
          hsr = (z2025 || 0) + (over25 || 0);
          est.hsr = 'zone20_25 + over25';
        }
      }
    }
  }

  // ----- sprint_count (preferisci dati diretti) -----
  let sprint_count = clampInt(r.sprint_count);
  if (!sprint_count) {
    const sprint_dist = toNum(r.sprint_distance_m);
    if (sprint_dist) {
      sprint_count = Math.round(sprint_dist / CFG.AVG_SPRINT_LENGTH_M);
      est.sprint_count = `sprint_distance_m / ${CFG.AVG_SPRINT_LENGTH_M}`;
    }
  }

  // ----- steps_count (preferisci dati diretti) -----
  let steps_count = clampInt(r.steps_count);
  if (!steps_count) {
    const dist = toNum(r.total_distance_m);
    if (dist) {
      steps_count = Math.round(dist * CFG.STEPS_PER_M);
      est.steps_count = `total_distance_m * ${CFG.STEPS_PER_M}`;
    }
  }

  // ----- accelerazioni/decelerazioni -----
  let acc = clampInt(r.accelerations_count);
  let dec = clampInt(r.decelerations_count);

  // 🔧 FIX: Priorità ai campi numerici raw che contengono i dati reali
  if (!acc) {
    const accRaw = clampInt(r.num_acc_over_3_ms2);
    if (accRaw > 0) {
      acc = accRaw;
      est.accelerations_count = 'num_acc_over_3_ms2';
    } else {
      const accRate = r[CFG.ACC_FIELD] ?? r[CFG.ACC_FALLBACK];
      if (accRate != null && dur) {
        acc = Math.round(toNum(accRate) * dur);
        est.accelerations_count = `${accRate} * duration_minutes`;
      }
    }
  }
  
  if (!dec) {
    const decRaw = clampInt(r.num_dec_over_minus3_ms2);
    if (decRaw > 0) {
      dec = decRaw;
      est.decelerations_count = 'num_dec_over_minus3_ms2';
    } else {
      const decRate = r[CFG.DEC_FIELD] ?? r[CFG.DEC_FALLBACK];
      if (decRate != null && dur) {
        dec = Math.round(toNum(decRate) * dur);
        est.decelerations_count = `${decRate} * duration_minutes`;
      }
    }
  }

  // ----- player_load_per_min -----
  let plpm = toNum(r.player_load_per_min);
  if (!plpm && toNum(r.player_load) && dur) {
    plpm = r.player_load / dur;
    est.player_load_per_min = 'player_load / duration_minutes';
  }

  // ----- RPE (preferisci dati diretti dai CSV) -----
  let session_rpe = toNum(r.session_rpe);
  let rpe = toNum(r.rpe);
  
  // 🔧 FIX: Logica RPE migliorata - stima sempre da training_load se mancano dati diretti
  const trainingLoad = toNum(r.training_load);
  const hasDirectRPE = session_rpe > 0 || rpe > 0;
  
  if (!hasDirectRPE && trainingLoad > 0 && dur > 0) {
    // Stima RPE da training_load (formula migliorata)
    rpe = Math.max(1, Math.min(10, trainingLoad / 100)); // Divisore ottimizzato
    session_rpe = rpe * dur;
    est.rpe = 'estimated from training_load';
    est.session_rpe = 'rpe * duration_minutes';
  } else if (!session_rpe && rpe > 0 && dur > 0) {
    session_rpe = rpe * dur;
    est.session_rpe = 'rpe * duration_minutes';
  } else if (!rpe && session_rpe > 0 && dur > 0) {
    rpe = session_rpe / dur;
    est.rpe = 'session_rpe / duration_minutes';
  }

  // ----- avg_speed_kmh -----
  let avg_speed_kmh = toNum(r.avg_speed_kmh);
  if (!avg_speed_kmh && toNum(r.total_distance_m) && dur) {
    avg_speed_kmh = (r.total_distance_m / 1000) / (dur / 60);
    est.avg_speed_kmh = 'distance/duration';
  }

  return {
    ...r,
    _est: est,
    // fields derivati
    high_intensity_distance_m: hsr || 0,
    sprint_count,
    steps_count,
    accelerations_count: acc || 0,
    decelerations_count: dec || 0,
    player_load_per_min: plpm || 0,
    session_rpe: session_rpe || 0,
    rpe: rpe || 0,
    avg_speed_kmh: avg_speed_kmh || 0
  };
}

async function loadRows(prisma, teamId, startDate, endDate, sessionTypeFilter, sessionNameFilter, playerId = null) {
  console.log('🔍 loadRows chiamata con parametri:');
  console.log('  - teamId:', teamId);
  console.log('  - startDate:', startDate.toISOString());
  console.log('  - endDate:', endDate.toISOString());
  console.log('  - sessionTypeFilter:', sessionTypeFilter);
  console.log('  - sessionNameFilter:', sessionNameFilter);
  console.log('  - playerId:', playerId, 'type:', typeof playerId);
  
  
  // 🔧 FIX: Carica sessioni esistenti
  const whereClause = {
    player: { teamId },
    session_date: { gte: startDate, lte: endDate },
    ...(sessionTypeFilter && { session_type: sessionTypeFilter }),
    ...(sessionNameFilter && { session_name: sessionNameFilter }),
    ...(playerId && !isNaN(parseInt(playerId)) && { playerId: parseInt(playerId) }) // 🔧 FIX: Filtra per giocatore specifico con validazione
  };
  
  console.log('🔍 Where clause generata:', JSON.stringify(whereClause, null, 2));
  
  const existingSessions = await prisma.performanceData.findMany({
    where: whereClause,
    include: {
      player: { select: { id: true, firstName: true, lastName: true, position: true } }
    },
    orderBy: { session_date: 'asc' }
  });
  
  console.log('📊 Sessioni caricate dal database:', existingSessions.length);
  if (existingSessions.length > 0) {
    console.log('📊 Prime 5 sessioni caricate:');
    existingSessions.slice(0, 5).forEach((session, index) => {
      console.log(`  ${index + 1}. Giocatore: ${session.player?.firstName} ${session.player?.lastName} (ID: ${session.playerId}), Data: ${session.session_date.toISOString().split('T')[0]}, Tipo: ${session.session_type}, Nome: ${session.session_name}`);
    });
  }

  // 🔧 FIX: Genera array di tutti i giorni del periodo (anche vuoti)
  const allDays = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Cerca sessioni per questo giorno
    const daySessions = existingSessions.filter(session => {
      const sessionDay = new Date(session.session_date).toISOString().split('T')[0];
      return sessionDay === dayKey;
    });
    
    if (daySessions.length > 0) {
      // 🔧 AGGIUNGI: Raggruppa sessioni per giocatore e crea record aggregati
      const playersInDay = [...new Set(daySessions.map(s => s.playerId))];
      
      playersInDay.forEach(playerId => {
        const playerSessions = daySessions.filter(s => s.playerId === playerId);
        const player = playerSessions[0].player; // Prendi info giocatore dal primo record
        
        // Aggrega dati del giocatore per questo giorno
        const aggregatedSession = {
          id: `agg_${dayKey}_${playerId}`,
          session_date: new Date(dayKey),
          playerId: playerId,
          player: player,
          // Somma tutti i valori numerici
          total_distance_m: playerSessions.reduce((sum, s) => sum + (Number(s.total_distance_m) || 0), 0),
          player_load: playerSessions.reduce((sum, s) => sum + (Number(s.player_load) || 0), 0),
          duration_minutes: playerSessions.reduce((sum, s) => sum + (Number(s.duration_minutes) || 0), 0),
          top_speed_kmh: Math.max(...playerSessions.map(s => Number(s.top_speed_kmh) || 0)),
          high_intensity_runs: playerSessions.reduce((sum, s) => sum + (Number(s.high_intensity_runs) || 0), 0),
          sprint_distance_m: playerSessions.reduce((sum, s) => sum + (Number(s.sprint_distance_m) || 0), 0),
          distance_over_15_kmh_m: playerSessions.reduce((sum, s) => sum + (Number(s.distance_over_15_kmh_m) || 0), 0),
          distance_15_20_kmh_m: playerSessions.reduce((sum, s) => sum + (Number(s.distance_15_20_kmh_m) || 0), 0),
          distance_20_25_kmh_m: playerSessions.reduce((sum, s) => sum + (Number(s.distance_20_25_kmh_m) || 0), 0),
          distance_over_25_kmh_m: playerSessions.reduce((sum, s) => sum + (Number(s.distance_over_25_kmh_m) || 0), 0),
          num_acc_over_3_ms2: playerSessions.reduce((sum, s) => sum + (Number(s.num_acc_over_3_ms2) || 0), 0),
          num_dec_over_minus3_ms2: playerSessions.reduce((sum, s) => sum + (Number(s.num_dec_over_minus3_ms2) || 0), 0),
          avg_heart_rate: playerSessions.reduce((sum, s) => sum + (Number(s.avg_heart_rate) || 0), 0) / playerSessions.length,
          max_heart_rate: Math.max(...playerSessions.map(s => Number(s.max_heart_rate) || 0)),
          // Campi aggiuntivi per compatibilità
          session_type: playerSessions[0].session_type || 'Allenamento',
          session_name: playerSessions[0].session_name || 'Allenamento',
          notes: playerSessions.map(s => s.notes).filter(Boolean).join('; '),
          extras: playerSessions[0].extras || null
        };
        
        allDays.push(aggregatedSession);
      });
    } else {
      // 🔧 AGGIUNGI: Crea record vuoto per questo giorno (senza giocatori specifici)
      // Questo permette ai grafici di mostrare tutti i giorni del periodo
      const emptyDayRecord = {
        id: `empty_${dayKey}`,
        session_date: new Date(dayKey),
        playerId: null,
        player: null,
        // Tutti i valori a 0
        total_distance_m: 0,
        player_load: 0,
        duration_minutes: 0,
        top_speed_kmh: 0,
        high_intensity_runs: 0,
        sprint_distance_m: 0,
        distance_over_15_kmh_m: 0,
        distance_15_20_kmh_m: 0,
        distance_20_25_kmh_m: 0,
        distance_over_25_kmh_m: 0,
        num_acc_over_3_ms2: 0,
        num_dec_over_minus3_ms2: 0,
        avg_heart_rate: 0,
        max_heart_rate: 0,
        session_type: 'Allenamento',
        session_name: 'Allenamento',
        notes: '',
        extras: null
      };
      
      allDays.push(emptyDayRecord);
    }
    
    // Passa al giorno successivo
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log('🔵 [DEBUG] loadRows: generati', allDays.length, 'giorni per periodo', startDate.toISOString().slice(0, 10), '-', endDate.toISOString().slice(0, 10));
  
  return allDays;
}

// -----------------------------
// KPI builders - VERSIONE CORRETTA
// -----------------------------

// === HELPER SPRINT (fallback sicuro) ===
function getSprintCountRow(r) {
  const direct = Number(r?.sprint_count);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const hir = Number(r?.high_intensity_runs); // proxy se disponibile
  if (Number.isFinite(hir) && hir > 0) return hir;

  const sprintDist = Number(r?.sprint_distance_m); // stima da distanza sprint
  if (Number.isFinite(sprintDist) && sprintDist > 0) return Math.round(sprintDist / 30);

  return 0;
}

function buildOverview(rows) {
  const n = rows.length;
  if (!n) return { 
    totalSessions: 0, 
    totalDistance: 0, 
    totalMinutes: 0, 
    avgDistance: 0, 
    avgMinutes: 0,
    avgSessionDuration: 0,
    avgTeamDistance: 0,
    avgPlayerLoad: 0,
    avgMaxSpeed: 0,
    avgSpeed: 0,
    playerLoad: 0,
    speedPB: { player: 'N/A', value: 0 }
  };
  
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  const validCount = validRows.length;
  
  if (!validCount) return { 
    totalSessions: 0, 
    totalDistance: 0, 
    totalMinutes: 0, 
    avgDistance: 0, 
    avgMinutes: 0,
    avgSessionDuration: 0,
    avgTeamDistance: 0,
    avgPlayerLoad: 0,
    avgMaxSpeed: 0,
    avgSpeed: 0,
    playerLoad: 0,
    speedPB: { player: 'N/A', value: 0 }
  };
  
  const avgSessionDuration = mean(validRows.map(r => toNum(r.duration_minutes)));
  // CORRETTO: Distanza media in metri (per compatibilità frontend)
  const avgTeamDistance = mean(validRows.map(r => toNum(r.total_distance_m)));
  const avgPlayerLoad = mean(validRows.map(r => toNum(r.player_load)));
  const avgMaxSpeed = mean(validRows.map(r => toNum(r.top_speed_kmh)));

  let speedPB = { player: 'N/A', value: 0 };
  if (validCount > 0) {
    const best = validRows.reduce((m, r) =>
      toNum(r.top_speed_kmh) > toNum(m.top_speed_kmh) ? r : m
    );
    const name = best.player
      ? `${best.player.firstName} ${best.player.lastName}`.trim()
      : `ID ${best.playerId}`;
    speedPB = { player: name, value: round(best.top_speed_kmh, 1) };
  }

  return {
    totalSessions: validCount,
    totalDistance: sum(validRows.map(r => toNum(r.total_distance_m))),
    avgSpeed: mean(validRows.map(r => toNum(r.avg_speed_kmh))),
    playerLoad: sum(validRows.map(r => toNum(r.player_load))),
    avgSessionDuration,
    avgTeamDistance, // Ora in metri
    avgPlayerLoad,
    avgMaxSpeed,
    speedPB,
  };
}

function buildLoad(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  const sessions = validRows.length;
  const totalSprints = validRows.reduce((s, r) => s + getSprintCountRow(r), 0);
  
  return {
    // CORRETTO: Distanza totale in metri (solo periodo selezionato)
    totalDistance: sum(validRows.map(r => toNum(r.total_distance_m))),
    totalSessions: sessions,
    totalSprints: totalSprints,
    sprintsPerSession: sessions > 0 ? totalSprints / sessions : 0,
    // CORRETTO: Passi interi (solo periodo selezionato)
    totalSteps: sum(validRows.map(r => clampInt(r.steps_count))),
  };
}

function buildIntensity(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  const dpm = validRows.map(r =>
    toNum(r.total_distance_m) && toNum(r.duration_minutes)
      ? toNum(r.total_distance_m) / toNum(r.duration_minutes)
      : 0
  );
  const totalSprints = sum(validRows.map(r => clampInt(r.sprint_count)));
  const sessions = validRows.length || 1;

  return {
    avgDistancePerMin: mean(dpm),
    avgPlayerLoadPerMin: mean(validRows.map(r => toNum(r.player_load_per_min))),
    // CORRETTO: Sprint per sessione
    avgSprintsPerSession: totalSprints / sessions,
    // Backward compatibility
    avgSprintsPerPlayer: totalSprints / sessions,
  };
}

function buildSpeed(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  // 🔧 FIX: HSR standardizzato - una sola definizione coerente
  const totalHSR = computeHSR(validRows);
  const avgSprintDistance = mean(validRows.map(r => toNum(r.sprint_distance_m)));
  
  // Distanza media per singolo sprint
  const totalSprintDist = sum(validRows.map(r => toNum(r.sprint_distance_m)));
  const totalSprintCnt = sum(validRows.map(r => clampInt(r.sprint_count)));
  const avgPerSprint = totalSprintCnt ? totalSprintDist / totalSprintCnt : 0;

  return {
    totalHSR, // Ora in metri
    avgSprintDistance,
    sprintDistanceAvg: avgSprintDistance, // Alias per compatibilità
    avgSprintDistancePerSprint: avgPerSprint
  };
}

function buildAccelerations(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  const totalAcc = sum(validRows.map(r => clampInt(r.accelerations_count)));
  const totalDec = sum(validRows.map(r => clampInt(r.decelerations_count)));
  const sessions = validRows.length || 1;

  // CORRETTO: Media accelerazioni+decelerazioni per sessione
  const avgAccDecPerSession = sessions > 0 ? (totalAcc + totalDec) / sessions : 0;
  
  // Stima impatti da acc+dec (coefficiente 0.8)
  const estimatedImpacts = Math.round(0.8 * (totalAcc + totalDec));

  return {
    // CORRETTO: Nome più chiaro
    avgAccDecPerSession,
    // Backward compatibility
    avgAccDecPerPlayer: avgAccDecPerSession,
    totalImpacts: estimatedImpacts,
    totalAccelerations: totalAcc,
    totalDecelerations: totalDec,
  };
}

function buildCardio(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  // 🔧 FIX: Gestione RPE con supporto "N/A"
  const rpeValues = validRows.map(r => toNum(r.rpe)).filter(v => v > 0);
  const sessionRpeValues = validRows.map(r => toNum(r.session_rpe)).filter(v => v > 0);
  
  const avgRPE = rpeValues.length > 0 ? mean(rpeValues) : null;
  const totalSessionRPE = sessionRpeValues.length > 0 ? sum(sessionRpeValues) : null;
  
  return {
    avgHR: mean(validRows.map(r => toNum(r.avg_heart_rate))),
    maxHR: mean(validRows.map(r => toNum(r.max_heart_rate))),
    avgRPE: avgRPE,
    totalSessionRPE: totalSessionRPE,
    // 🔧 FIX: Flag per indicare se i valori sono stimati
    isRPEEstimated: validRows.some(r => r._est?.rpe || r._est?.session_rpe),
  };
}

// 🔧 FIX: ACWR calculation - ALLINEATO alla Vista Giocatori con calculateACWR
function buildReadiness(rows, windowEnd) {
  const { calculateACWR } = require('../utils/kpi');
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  const players = [...new Set(validRows.map(r => r.playerId))];
  const ratios = [];
  
  for (const pid of players) {
    const playerRows = validRows.filter(r => r.playerId === pid);
    if (playerRows.length === 0) continue;
    
    // Usa la stessa logica di Vista Giocatori/Dossier
    const sessions = playerRows.map(r => ({
      playerId: pid,
      session_date: r.session_date,
      training_load: r.player_load || 0
    }));
    
    const acwrResults = calculateACWR(sessions);
    if (acwrResults.length > 0) {
      // Prendi l'ACWR più recente (ultima data nel periodo)
      const targetDate = windowEnd;
      const closest = acwrResults.reduce((prev, curr) => {
        return (Math.abs(new Date(curr.date) - targetDate) < Math.abs(new Date(prev.date) - targetDate)) ? curr : prev;
      });
      const acwr = Number(closest.acwr || 0);
      // Scala a media settimanale per allineare alla Vista Giocatori
      const scaledAcwr = acwr * 4;
      if (scaledAcwr > 0) {
        ratios.push({ playerId: pid, acwr: scaledAcwr });
      }
    }
  }

  const avgACWR = ratios.length ? mean(ratios.map(r => r.acwr)) : 0;

  // Soglie classiche: 0.8–1.3 ottimale
  const playersOptimal = ratios.filter(r => r.acwr >= 0.8 && r.acwr <= 1.3).length;
  const playersAtRisk = ratios.filter(r => r.acwr < 0.8 || r.acwr > 1.3).length;
  const totalPlayers = ratios.length;
  const riskPercentage = totalPlayers ? round((playersAtRisk / totalPlayers) * 100, 0) : 0;

  return { avgACWR, playersAtRisk, playersOptimal, totalPlayers, riskPercentage };
}

function buildEventsSummary(rows) {
  console.log('🔍 buildEventsSummary chiamata con', rows.length, 'righe');
  
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  console.log('📊 Righe valide:', validRows.length);
  
  // MIGLIORATO: Conteggio più accurato per tipo con sinonimi
  const sessionsByType = new Map();
  
  validRows.forEach(r => {
    const type = r.session_type || 'Altro';
    const date = r.session_date.toISOString().split('T')[0];
    const key = `${type}-${date}`;
    sessionsByType.set(key, true);
    console.log(`📅 Sessione: ${type} il ${date} (giocatore: ${r.playerId})`);
  });

  console.log('📊 Sessioni per tipo:', Array.from(sessionsByType.keys()));

  const allenamenti = Array.from(sessionsByType.keys())
    .filter(k => {
      const type = k.split('-')[0].toLowerCase();
      return type.includes('allenamento') || 
             type.includes('training') || 
             type.includes('esercizio') || 
             type.includes('drill');
    }).length;

  const partite = Array.from(sessionsByType.keys())
    .filter(k => {
      const type = k.split('-')[0].toLowerCase();
      return type.includes('partita') || 
             type.includes('match') || 
             type.includes('game') || 
             type.includes('gara') || 
             type.includes('amichevole');
    }).length;

  console.log('📊 Conteggi buildEventsSummary:');
  console.log(`  - Allenamenti: ${allenamenti}`);
  console.log(`  - Partite: ${partite}`);
  console.log(`  - Totale: ${validRows.length}`);

  // Calcola metriche aggiuntive
  const totalSprints = sum(validRows.map(r => getSprintCountRow(r)));
  const totalHSR = computeHSR(validRows);
  const totalAcc = sum(validRows.map(r => toNum(r.num_acc_over_3_ms2)));
  const totalDec = sum(validRows.map(r => toNum(r.num_dec_over_minus3_ms2)));
  const sessions = validRows.length;
  const avgAccDecPerSession = sessions > 0 ? (totalAcc + totalDec) / sessions : 0;

  return {
    numeroAllenamenti: allenamenti,
    numeroPartite: partite,
    totalSprints,
    totalHSR,
    avgAccDecPerSession
  };
}

function buildBreakdownPerPlayer(rows) {
  // 🔧 FIX: Filtra record vuoti (giorni senza sessioni)
  const validRows = rows.filter(r => r.playerId && r.player);
  
  const map = new Map();
  for (const r of validRows) {
    const k = r.playerId;
    if (!map.has(k)) map.set(k, {
      playerId: k,
      name: r.player ? `${r.player.firstName} ${r.player.lastName}`.trim() : `ID ${k}`,
      sessions: 0,
      distance_m: 0,
      hsr_m: 0,
      sprints: 0,
      steps: 0,
      player_load: 0,
      top_speed_kmh_max: 0,
    });
    const agg = map.get(k);
    agg.sessions += 1;
    agg.distance_m += toNum(r.total_distance_m);
    agg.hsr_m += toNum(r.high_intensity_distance_m);
    agg.sprints += clampInt(r.sprint_count);
    agg.steps += clampInt(r.steps_count);
    agg.player_load += toNum(r.player_load);
    if (toNum(r.top_speed_kmh) > agg.top_speed_kmh_max) {
      agg.top_speed_kmh_max = toNum(r.top_speed_kmh);
    }
  }
  return [...map.values()].sort((a,b) => b.distance_m - a.distance_m);
}

// -----------------------------
// Alerts migliorati
// -----------------------------
function buildAlerts(overview, load, intensity, speed, cardio, readiness) {
  const arr = [];
  if (overview.avgMaxSpeed > 32) {
    arr.push({ type: 'warning', message: 'Nuovo record di velocità registrato' });
  }
  if (readiness.playersAtRisk > 0) {
    arr.push({ 
      type: 'danger', 
      message: `${readiness.playersAtRisk} giocatori con ACWR fuori range (${readiness.riskPercentage}%)` 
    });
  }
  if (cardio.avgHR > 165) {
    arr.push({ type: 'warning', message: 'Frequenza cardiaca media sopra la soglia' });
  }
  // CORRETTO: HSR ora in metri
  if (speed.totalHSR > 700000) {
    arr.push({ type: 'info', message: 'Volume HSR molto elevato nel periodo' });
  }
  return arr;
}

// -----------------------------
// Handler principale
// -----------------------------
async function handleDashboard(req, res) {
  const prisma = getPrismaClient();
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) return res.status(403).json({ error: 'Team non disponibile nel contesto' });

    // 🔧 FIX: Leggi e processa sessionType, sessionName e roles (players rimosso)
    const sessionType = req.query?.sessionType || 'all';
    const sessionName = req.query?.sessionName || 'all';
    const roles = (req.query?.roles || '').split(',').filter(Boolean);
    const sessionTypeFilter = parseSessionTypeFilterSimple(sessionType);
    const sessionNameFilter = parseSessionTypeFilter(sessionName);
    
    // 🔧 FIX: Estrai il valore dal filtro se è un oggetto
    const sessionTypeValue = sessionTypeFilter && typeof sessionTypeFilter === 'object' && sessionTypeFilter.in 
      ? sessionTypeFilter.in[0] 
      : sessionTypeFilter;
    const sessionNameValue = sessionNameFilter && typeof sessionNameFilter === 'object' && sessionNameFilter.in 
      ? sessionNameFilter.in[0] 
      : sessionNameFilter;
    
    // 🔧 FIX: Converti "all" in null per non filtrare
    const finalSessionTypeValue = sessionTypeValue === 'all' ? null : sessionTypeValue;
    const finalSessionNameValue = sessionNameValue === 'all' ? null : sessionNameValue;
    


    // Periodo corrente + periodo precedente per trend
    const per = normalizePeriod({
      period: req.query?.period || 'week',
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
    });
    const prev = previousWindow({ start: per.start, end: per.end });

    // Carica dati con filtri sessionType, sessionName e roles (players rimosso)
    const [rows, rowsPrev] = await Promise.all([
      loadRows(prisma, teamId, per.start, per.end, finalSessionTypeValue, finalSessionNameValue),
      loadRows(prisma, teamId, prev.start, prev.end, finalSessionTypeValue, finalSessionNameValue),
    ]);

    // 🔧 NUOVO: Filtra per ruoli se specificati
    let filteredRows = rows;
    let filteredRowsPrev = rowsPrev;
    
    if (roles.length > 0) {
      // Mappa i ruoli del frontend a quelli del database
      const roleMap = { 
        POR: ['GOALKEEPER', 'POR'], 
        DIF: ['DEFENDER', 'DIF'], 
        CEN: ['MIDFIELDER', 'CEN'], 
        ATT: ['FORWARD', 'ATT'] 
      };
      
      const mappedRoles = roles.flatMap(r => roleMap[r] || []).filter(Boolean);
      
      // Filtra i dati per ruolo
      filteredRows = rows.filter(row => {
        const hasPosition = row.player && row.player.position;
        const matchesRole = hasPosition && mappedRoles.includes(row.player.position);
        return matchesRole;
      });
      filteredRowsPrev = rowsPrev.filter(row => {
        const hasPosition = row.player && row.player.position;
        return hasPosition && mappedRoles.includes(row.player.position);
      });
    }

    // Deriva campi mancanti
    const rowsD = filteredRows.map(deriveRow);
    const rowsPrevD = filteredRowsPrev.map(deriveRow);

    // Calcola KPI correnti
    const overview = buildOverview(rowsD);
    const load = buildLoad(rowsD);
    const intensity = buildIntensity(rowsD);
    const speed = buildSpeed(rowsD);
    const accels = buildAccelerations(rowsD);
    const cardio = buildCardio(rowsD);
    const readiness = buildReadiness(rowsD, per.end);
    const breakdownPerPlayer = buildBreakdownPerPlayer(rowsD);
    const eventsSummary = buildEventsSummary(rowsD);

    // Calcola KPI precedenti per trend
    const oPrev = buildOverview(rowsPrevD);
    const lPrev = buildLoad(rowsPrevD);
    const iPrev = buildIntensity(rowsPrevD);
    const sPrev = buildSpeed(rowsPrevD);
    const aPrev = buildAccelerations(rowsPrevD);
    const cPrev = buildCardio(rowsPrevD);

    // Calcola trend percentuali
    const trends = {
      totalSessions: percentTrend(overview.totalSessions, oPrev.totalSessions),
      avgSessionDuration: percentTrend(overview.avgSessionDuration, oPrev.avgSessionDuration),
      avgTeamDistance: percentTrend(overview.avgTeamDistance, oPrev.avgTeamDistance),
      avgPlayerLoad: percentTrend(overview.avgPlayerLoad, oPrev.avgPlayerLoad),
      avgMaxSpeed: percentTrend(overview.avgMaxSpeed, oPrev.avgMaxSpeed),

      totalDistance: percentTrend(load.totalDistance, lPrev.totalDistance),
      totalSprints: percentTrend(load.totalSprints, lPrev.totalSprints),
      totalSteps: percentTrend(load.totalSteps, lPrev.totalSteps),

      avgDistancePerMin: percentTrend(intensity.avgDistancePerMin, iPrev.avgDistancePerMin),
      avgPlayerLoadPerMin: percentTrend(intensity.avgPlayerLoadPerMin, iPrev.avgPlayerLoadPerMin),
      avgSprintsPerSession: percentTrend(intensity.avgSprintsPerSession, iPrev.avgSprintsPerSession),
      // Backward compatibility
      avgSprintsPerPlayer: percentTrend(intensity.avgSprintsPerPlayer, iPrev.avgSprintsPerPlayer),

      totalHSR: percentTrend(speed.totalHSR, sPrev.totalHSR),
      avgSprintDistance: percentTrend(speed.avgSprintDistance, sPrev.avgSprintDistance),

      avgAccDecPerSession: percentTrend(accels.avgAccDecPerSession, aPrev.avgAccDecPerSession),
      // Backward compatibility
      avgAccDecPerPlayer: percentTrend(accels.avgAccDecPerPlayer, aPrev.avgAccDecPerPlayer),
      totalImpacts: percentTrend(accels.totalImpacts, aPrev.totalImpacts),

      avgHR: percentTrend(cardio.avgHR, cPrev.avgHR),
      maxHR: percentTrend(cardio.maxHR, cPrev.maxHR),
      // 🔧 FIX: Gestione null per trend RPE
      avgRPE: (cardio.avgRPE !== null && cPrev.avgRPE !== null) ? percentTrend(cardio.avgRPE, cPrev.avgRPE) : null,
      totalSessionRPE: (cardio.totalSessionRPE !== null && cPrev.totalSessionRPE !== null) ? percentTrend(cardio.totalSessionRPE, cPrev.totalSessionRPE) : null,
    };

    // Arrotonda trend (escludendo null)
    Object.keys(trends).forEach(key => {
      if (trends[key] !== null) {
        trends[key] = r1(trends[key]);
      }
    });

    // Formatta output finale
    overview.avgSessionDuration = r2(overview.avgSessionDuration);
    overview.avgTeamDistance = r2(overview.avgTeamDistance);
    overview.avgPlayerLoad = r2(overview.avgPlayerLoad);
    overview.avgMaxSpeed = r2(overview.avgMaxSpeed);
    overview.speedPB.value = r2(overview.speedPB.value);

    load.totalDistance = Math.round(load.totalDistance);
    load.totalSprints = Math.round(load.totalSprints);
    load.totalSteps = Math.round(load.totalSteps);

    intensity.avgDistancePerMin = r2(intensity.avgDistancePerMin);
    intensity.avgPlayerLoadPerMin = r2(intensity.avgPlayerLoadPerMin);
    intensity.avgSprintsPerSession = r2(intensity.avgSprintsPerSession);
    intensity.avgSprintsPerPlayer = r2(intensity.avgSprintsPerPlayer);

    speed.totalHSR = Math.round(speed.totalHSR);
    speed.avgSprintDistance = r2(speed.avgSprintDistance);
    speed.avgSprintDistancePerSprint = r2(speed.avgSprintDistancePerSprint);

    accels.avgAccDecPerSession = r2(accels.avgAccDecPerSession);
    accels.avgAccDecPerPlayer = r2(accels.avgAccDecPerPlayer);
    accels.totalImpacts = Math.round(accels.totalImpacts);
    accels.totalAccelerations = Math.round(accels.totalAccelerations);
    accels.totalDecelerations = Math.round(accels.totalDecelerations);

    cardio.avgHR = r2(cardio.avgHR);
    cardio.maxHR = r2(cardio.maxHR);
    // 🔧 FIX: Gestione null per RPE
    cardio.avgRPE = cardio.avgRPE !== null ? r2(cardio.avgRPE) : null;
    cardio.totalSessionRPE = cardio.totalSessionRPE !== null ? Math.round(cardio.totalSessionRPE) : null;

    readiness.avgACWR = r2(readiness.avgACWR);

    // Formatta breakdown per player
    breakdownPerPlayer.forEach(player => {
      player.distance_m = Math.round(player.distance_m);
      player.hsr_m = Math.round(player.hsr_m);
      player.sprints = Math.round(player.sprints);
      player.steps = Math.round(player.steps);
      player.player_load = r2(player.player_load);
      player.top_speed_kmh_max = r2(player.top_speed_kmh_max);
    });

    const alerts = buildAlerts(overview, load, intensity, speed, cardio, readiness);

    // Flag per dati stimati
    const estimatedFlags = {
      hsr: rowsD.some(r => r._est?.hsr),
      sprint_count: rowsD.some(r => r._est?.sprint_count),
      steps_count: rowsD.some(r => r._est?.steps_count),
      accelerations: rowsD.some(r => r._est?.accelerations_count),
      decelerations: rowsD.some(r => r._est?.decelerations_count),
      pl_per_min: rowsD.some(r => r._est?.player_load_per_min),
      session_rpe: rowsD.some(r => r._est?.session_rpe),
      rpe: rowsD.some(r => r._est?.rpe),
      avg_speed: rowsD.some(r => r._est?.avg_speed_kmh),
    };

    // STEP 2: Usa buildDashboardData per struttura unificata
    const data = buildDashboardData(rowsD, per.end);

    return res.json({
      success: true,
      data,
      // Mantieni compatibilità per trend e altri dati
      trends,
      breakdownPerPlayer,
      eventsSummary,
      estimates: estimatedFlags,
      alerts,
      filters: {
        sessionType: sessionType,
        sessionTypeFilter: finalSessionTypeValue
      },
      period: {
        startDate: per.start.toISOString(),
        endDate: per.end.toISOString(),
        type: per.type,
        previous: {
          startDate: prev.start.toISOString(),
          endDate: prev.end.toISOString(),
        }
      }
    });
  } catch (err) {
    console.error('Errore dashboard:', err?.message, err?.stack);
    return res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  }
}

// -----------------------------
// Routes
// -----------------------------
router.use(authenticate, tenantContext);
router.get('/team', handleDashboard);
router.get('/team/:teamId', (req, res, next) => handleDashboard(req, res, next));

// STEP 2: Endpoint per stats team unificato
router.get('/stats/team', handleDashboard);

// STEP 3: Endpoint per stats player unificato
router.get('/stats/player/:id', async (req, res) => {
  const prisma = getPrismaClient();
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) return res.status(403).json({ error: 'Team non disponibile nel contesto' });

    const playerId = parseInt(req.params.id);
    console.log('🔍 Player endpoint - playerId:', playerId, 'type:', typeof playerId);
    if (!playerId || isNaN(playerId)) {
      console.log('❌ Player endpoint - ID giocatore non valido:', req.params.id);
      return res.status(400).json({ error: 'ID giocatore non valido' });
    }

    // Verifica che il giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: { id: playerId, teamId },
      select: { id: true, firstName: true, lastName: true, position: true, shirtNumber: true }
    });

    if (!player) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    // STEP 4: Uniforma periodo con team endpoint
    const per = normalizePeriod({
      period: req.query?.period || 'week',
      startDate: req.query?.startDate,
      endDate: req.query?.endDate,
    });

    // 🔧 FIX: Leggi e processa sessionType e sessionName per il giocatore
    const sessionType = req.query?.sessionType || 'all';
    const sessionName = req.query?.sessionName || 'all';
    const sessionTypeFilter = parseSessionTypeFilterSimple(sessionType);
    const sessionNameFilter = parseSessionTypeFilter(sessionName);
    
    // 🔧 FIX: Estrai il valore dal filtro se è un oggetto
    const sessionTypeValue = sessionTypeFilter && typeof sessionTypeFilter === 'object' && sessionTypeFilter.in 
      ? sessionTypeFilter.in[0] 
      : sessionTypeFilter;
    const sessionNameValue = sessionNameFilter && typeof sessionNameFilter === 'object' && sessionNameFilter.in 
      ? sessionNameFilter.in[0] 
      : sessionNameFilter;
    
    // 🔧 FIX: Converti "all" in null per non filtrare
    const finalSessionTypeValue = sessionTypeValue === 'all' ? null : sessionTypeValue;
    const finalSessionNameValue = sessionNameValue === 'all' ? null : sessionNameValue;

    console.log('🔍 Player endpoint - filtri applicati:', {
      sessionType, sessionTypeFilter, finalSessionTypeValue,
      sessionName, sessionNameFilter, finalSessionNameValue
    });

    // Carica dati performance per il giocatore specifico con filtri
    const rows = await loadRows(prisma, teamId, per.start, per.end, finalSessionTypeValue, finalSessionNameValue, playerId);
    
    // Deriva campi mancanti
    const rowsD = rows.map(deriveRow);

    // STEP 3: Usa buildDashboardData per struttura unificata
    const data = buildDashboardData(rowsD, per.end);

    res.json({
      success: true,
      data,
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
        shirtNumber: player.shirtNumber
      },
      period: {

        startDate: per.start.toISOString(),
        endDate: per.end.toISOString(),
        type: per.type
      }
    });

  } catch (err) {
    console.error('Errore dashboard player:', err?.message, err?.stack);
    return res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? err?.message : undefined,
    });
  }
});

module.exports = router;
