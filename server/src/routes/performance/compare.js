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

    // Calcola KPI per ogni giocatore
    const playersWithStats = players.map(player => {
      const playerSessions = sessions.filter(s => s.playerId === player.id);
      
      // Calcoli KPI
      const hsr = computeHSR(playerSessions);
      const sprintPer90 = computeSprintPer90(playerSessions);
      
      // PL/min
      const totalPL = playerSessions.reduce((sum, s) => sum + (s.player_load || 0), 0);
      const totalMin = playerSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
      const plPerMin = totalMin > 0 ? totalPL / totalMin : 0;
      
      // Top Speed
      const topSpeed = Math.max(...playerSessions.map(s => s.top_speed_kmh || 0), 0);
      
      // ACWR (ultimi 28 giorni)
      const acwrEndDate = periodEnd;
      const acwrStartDate = new Date(acwrEndDate.getTime() - 28 * 86400000);
      const acwrSessions = sessions.filter(s => 
        s.playerId === player.id && 
        s.session_date >= acwrStartDate && 
        s.session_date <= acwrEndDate
      );
      const acwr = computeACWR(acwrSessions, acwrEndDate);

      return {
        ...player,
        summary: {
          plPerMin: round(plPerMin, 2),
          hsrTot: round(hsr),
          sprintPer90: round(sprintPer90, 2),
          topSpeedMax: round(topSpeed, 2),
          acwr: round(acwr, 2)
        },
        sessions: playerSessions
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
