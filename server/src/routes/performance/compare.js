// server/src/routes/compare.js
const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../../config/database');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

const prisma = getPrismaClient();

// Parser robusto: accetta players / playerIds / ids / id (CSV) e restituisce numeri
function parsePlayers(req) {
  const raw =
    req.query.players ??
    req.query.playerIds ??
    req.query.ids ??
    req.query.id ??
    '';
  return String(raw)
    .split(/[,\s]+/)
    .map(s => Number(String(s).replace(/[^\d]/g, '')))
    .filter(Number.isFinite);
}

router.get('/', authenticate, tenantContext, async (req, res) => {
  try {
    console.log('🟢 [INFO] COMPARE ROUTE: richiesta ricevuta:', req.url, req.query); // DEBUG
    console.log('🔵 [DEBUG] COMPARE HEADERS:', req.headers.authorization ? 'TOKEN PRESENTE' : 'TOKEN MANCANTE'); // DEBUG
    const teamId = req.context?.teamId; // ⚠️ UUID stringa
    if (!teamId) {
      return res.status(401).json({ error: 'Team non valido', code: 'INVALID_TEAM' });
    }

    const ids = parsePlayers(req);
    if (!ids.length) {
      return res.status(400).json({ error: 'Parametro players mancante o vuoto', code: 'INVALID_ID' });
    }

    // Log diagnostico (vedilo in console server per conferma)
    console.info('COMPARE req', { teamId, ids, q: req.query });

    // Esempio query filtrate per teamId
    const players = await prisma.player.findMany({
      where: { id: { in: ids }, teamId }
    });

    if (!players.length) {
      return res.status(404).json({ error: 'Giocatori non trovati nel team', code: 'PLAYERS_NOT_FOUND' });
    }

    // Importa utilities per i calcoli KPI
    const { buildPeriodRange, parseSessionTypeFilter, computeHSR, computeSprintPer90, computeACWR, round } = require('../../utils/kpi');
    
    // Parsing filtri periodo
    const { period = 'week', sessionType = 'all', startDate, endDate } = req.query;
    const { periodStart, periodEnd } = buildPeriodRange(period, startDate, endDate);
    console.log(`📊 /compare -> periodo=${period} start=${periodStart.toISOString()} end=${periodEnd.toISOString()}`);
    const sessionTypeFilter = parseSessionTypeFilter(sessionType);

    // Query performance data con filtri e include player
    const sessions = await prisma.performanceData.findMany({
      where: {
        playerId: { in: ids },
        player: { teamId },
        session_date: { gte: periodStart, lte: periodEnd },
        ...(sessionTypeFilter && { session_name: sessionTypeFilter })
      },
      include: {
        player: true
      },
      orderBy: { session_date: 'desc' }
    });

    console.log('🔵 [DEBUG] COMPARE: sessioni caricate:', sessions.length, 'per', ids.length, 'giocatori'); // DEBUG
    if (sessions.length > 0) {
      console.log('🔵 [DEBUG] COMPARE: prima sessione:', {
        playerId: sessions[0].playerId,
        player: sessions[0].player ? 'PRESENTE' : 'MANCANTE',
        session_date: sessions[0].session_date,
        player_load: sessions[0].player_load
      }); // DEBUG
    }

    // Calcola KPI per ogni giocatore (allineati a Dashboard/Dossier)
    const playersWithStats = players.map(player => {
      const playerSessions = sessions.filter(s => s.playerId === player.id);

      // Totali base
      const totalPlayerLoad = playerSessions.reduce((sum, s) => sum + (s.player_load || 0), 0);
      const totalMinutes = playerSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const totalDistance = playerSessions.reduce((sum, s) => sum + (s.total_distance_m || 0), 0);
      const totalSessions = playerSessions.length;

      // KPI comuni
      const hsrTot = computeHSR(playerSessions);
      const sprintPer90 = computeSprintPer90(playerSessions);
      const plPerMin = totalMinutes > 0 ? totalPlayerLoad / totalMinutes : 0;
      const topSpeedMax = Math.max(...playerSessions.map(s => s.top_speed_kmh || 0), 0);

      // ACWR (ultimi 28 giorni) con scaling x4 per media settimanale
      const acwrEndDate = periodEnd;
      const acwrStartDate = new Date(acwrEndDate.getTime() - 28 * 86400000);
      const acwrSessions = playerSessions.filter(s => s.session_date >= acwrStartDate && s.session_date <= acwrEndDate);
      const acwr = computeACWR(acwrSessions, acwrEndDate) * 4;

      // Cardio
      const avgHeartRate = totalSessions > 0
        ? playerSessions.reduce((sum, s) => sum + (s.avg_heart_rate || 0), 0) / totalSessions
        : 0;
      const maxHeartRate = Math.max(...playerSessions.map(s => s.max_heart_rate || 0), 0);

      // Acc/Dec
      const totalAccelerations = playerSessions.reduce((sum, s) => sum + (s.num_acc_over_3_ms2 || 0), 0);
      const totalDecelerations = playerSessions.reduce((sum, s) => sum + (s.num_dec_over_minus3_ms2 || 0), 0);
      const accelPerMinute = totalMinutes > 0 ? totalAccelerations / totalMinutes : 0;
      const decelPerMinute = totalMinutes > 0 ? totalDecelerations / totalMinutes : 0;

      // Zone velocità
      const distance15_20 = playerSessions.reduce((sum, s) => sum + (s.distance_15_20_kmh_m || 0), 0);
      const distance20_25 = playerSessions.reduce((sum, s) => sum + (s.distance_20_25_kmh_m || 0), 0);
      const distanceOver25 = playerSessions.reduce((sum, s) => sum + (s.distance_over_25_kmh_m || 0), 0);
      const sprintCount = playerSessions.reduce((sum, s) => sum + (s.sprint_count || 0), 0);

      // Helper
      const r = (v, d = 2) => (Number.isFinite(v) ? Number(v.toFixed(d)) : 0);

      return {
        ...player,
        summary: {
          plPerMin: r(plPerMin, 2),
          hsrTot: Math.round(hsrTot),
          sprintPer90: r(sprintPer90, 2),
          topSpeedMax: r(topSpeedMax, 2),
          acwr: r(acwr, 2)
        },
        sessions: playerSessions,
        detailed: {
          // Carico & Volumi
          totalDistance: Math.round(totalDistance),
          totalPlayerLoad: Math.round(totalPlayerLoad),
          totalSessions: totalSessions,
          totalMinutes: Math.round(totalMinutes),
          avgSessionLoad: totalSessions > 0 ? r(totalPlayerLoad / totalSessions, 1) : 0,
          avgSessionDuration: totalSessions > 0 ? r(totalMinutes / totalSessions, 1) : 0,

          // Intensità
          plPerMin: r(plPerMin, 2),
          avgSpeed: totalMinutes > 0 ? r((totalDistance / totalMinutes) * 60 / 1000, 2) : 0, // km/h

          // Alta Velocità & Sprint
          distance15_20: Math.round(distance15_20),
          distance20_25: Math.round(distance20_25),
          distanceOver25: Math.round(distanceOver25),
          hsrTotal: Math.round(hsrTot),
          hsrPercentage: totalDistance > 0 ? r((hsrTot / totalDistance) * 100, 1) : 0,
          sprintCount: sprintCount,
          topSpeedMax: r(topSpeedMax, 2),

          // Accelerazioni & Decelerazioni
          totalAccelerations: totalAccelerations,
          totalDecelerations: totalDecelerations,
          accelPerMinute: r(accelPerMinute, 2),
          decelPerMinute: r(decelPerMinute, 2),

          // Energetico & Metabolico
          avgHeartRate: r(avgHeartRate, 1),
          maxHeartRate: Math.round(maxHeartRate),

          // Rischio & Recupero
          acwr: r(acwr, 2),
          monotony: 0,
          strain: r(totalPlayerLoad, 1)
        }
      };
    });

    return res.json({
      ok: true,
      playerIds: ids,
      players: playersWithStats,
      allSessions: sessions,
      filters: { period, sessionType, startDate, endDate }
    });
  } catch (err) {
    console.error('Compare error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
