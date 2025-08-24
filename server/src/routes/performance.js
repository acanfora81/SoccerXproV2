// server/src/routes/performance.js
// Routes per gestione dati performance SoccerXpro V2 - MULTI-TENANT FIXED

const express = require('express');
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext'); // 🔧 AGGIUNTO
const {
  getPerformanceData,
  getPerformanceDataById,
  createPerformanceData,
  deletePerformanceData,
} = require('../controllers/performance');
const { getPrismaClient } = require('../config/database');

console.log('🟢 Caricamento route performance multi-tenant...');

const router = express.Router();

// 🔐 Middleware di autenticazione + tenant context per tutte le route
router.use(authenticate, tenantContext); // 🔧 FIXED - Aggiunto tenantContext

// Helper: valida parametro numerico
const ensureNumericParam = (paramName) => (req, res, next) => {
  const val = Number(req.params[paramName]);
  if (!Number.isInteger(val) || val <= 0) {
    return res.status(400).json({
      error: `Parametro ${paramName} non valido`,
      code: 'INVALID_ID',
    });
  }
  next();
};

/**
 * 📊 GET /api/performance/stats/player/:playerId
 * Statistiche performance aggregate per giocatore - MULTI-TENANT
 */
router.get('/stats/player/:playerId', ensureNumericParam('playerId'), async (req, res) => {
  try {
    const playerId = Number(req.params.playerId);
    const teamId = req.context.teamId; // 🔧 AGGIUNTO - Context multi-tenant

    console.log('🔵 Richiesta statistiche performance per player:', playerId, 'team:', teamId);

    const prisma = getPrismaClient();

    // 🔧 FIXED - Verifica giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: { 
        id: playerId, 
        teamId // 🔧 FILTRO MULTI-TENANT
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        shirtNumber: true,
      },
    });

    if (!player) {
      return res.status(404).json({
        error: 'Giocatore non trovato o non appartiene al team',
        code: 'PLAYER_NOT_FOUND',
      });
    }

    // 🔧 FIXED - Performance data solo per giocatori del team
    const [totalSessions, averages, maxValues, sessionsByType, recentSessions] =
      await Promise.all([
        prisma.performanceData.count({ 
          where: { 
            playerId,
            player: { teamId } // 🔧 FILTRO INDIRETTO VIA RELATION
          } 
        }),

        prisma.performanceData.aggregate({
          where: { 
            playerId,
            player: { teamId } // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _avg: {
            total_distance_m: true,
            sprint_distance_m: true,
            top_speed_kmh: true,
            avg_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            avg_heart_rate: true,
            duration_minutes: true,
          },
        }),

        prisma.performanceData.aggregate({
          where: { 
            playerId,
            player: { teamId } // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _max: {
            total_distance_m: true,
            sprint_distance_m: true,
            top_speed_kmh: true,
            player_load: true,
            max_heart_rate: true,
            duration_minutes: true,
          },
        }),

        prisma.performanceData.groupBy({
          by: ['session_type'],
          where: { 
            playerId,
            player: { teamId } // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          _count: { session_type: true },
          _avg: {
            total_distance_m: true,
            top_speed_kmh: true,
            player_load: true,
          },
        }),

        prisma.performanceData.findMany({
          where: { 
            playerId,
            player: { teamId } // 🔧 FILTRO INDIRETTO VIA RELATION
          },
          orderBy: { session_date: 'desc' },
          take: 5,
          select: {
            id: true,
            session_date: true,
            session_type: true,
            total_distance_m: true,
            top_speed_kmh: true,
            duration_minutes: true,
            player_load: true,
          },
        }),
      ]);

    const stats = {
      player,
      summary: {
        totalSessions,
        averages: {
          totalDistance:
            averages._avg.total_distance_m != null
              ? parseFloat(averages._avg.total_distance_m.toFixed(2))
              : null,
          sprintDistance:
            averages._avg.sprint_distance_m != null
              ? parseFloat(averages._avg.sprint_distance_m.toFixed(2))
              : null,
          topSpeed:
            averages._avg.top_speed_kmh != null
              ? parseFloat(averages._avg.top_speed_kmh.toFixed(2))
              : null,
          avgSpeed:
            averages._avg.avg_speed_kmh != null
              ? parseFloat(averages._avg.avg_speed_kmh.toFixed(2))
              : null,
          playerLoad:
            averages._avg.player_load != null
              ? parseFloat(averages._avg.player_load.toFixed(2))
              : null,
          maxHeartRate:
            averages._avg.max_heart_rate != null
              ? Math.round(averages._avg.max_heart_rate)
              : null,
          avgHeartRate:
            averages._avg.avg_heart_rate != null
              ? Math.round(averages._avg.avg_heart_rate)
              : null,
          duration:
            averages._avg.duration_minutes != null
              ? Math.round(averages._avg.duration_minutes)
              : null,
        },
        records: {
          maxDistance: maxValues._max.total_distance_m,
          maxSprintDistance: maxValues._max.sprint_distance_m,
          topSpeed: maxValues._max.top_speed_kmh,
          maxPlayerLoad: maxValues._max.player_load,
          maxHeartRate: maxValues._max.max_heart_rate,
          longestSession: maxValues._max.duration_minutes,
        },
      },
      sessionBreakdown: sessionsByType.map((item) => ({
        sessionType: item.session_type,
        count: item._count.session_type,
        avgDistance:
          item._avg.total_distance_m != null
            ? parseFloat(item._avg.total_distance_m.toFixed(2))
            : null,
        avgTopSpeed:
          item._avg.top_speed_kmh != null
            ? parseFloat(item._avg.top_speed_kmh.toFixed(2))
            : null,
        avgPlayerLoad:
          item._avg.player_load != null
            ? parseFloat(item._avg.player_load.toFixed(2))
            : null,
      })),
      recentSessions,
    };

    console.log('🟢 Statistiche performance calcolate per:', player.firstName, player.lastName);

    res.json({
      message: 'Statistiche performance recuperate con successo',
      data: stats,
    });
  } catch (error) {
    console.log('🔴 Errore calcolo statistiche performance:', error.message);
    res.status(500).json({
      error: 'Errore interno durante il calcolo delle statistiche',
      code: 'STATS_ERROR',
    });
  }
});

/**
 * 📊 GET /api/performance/stats/team
 * Statistiche performance aggregate del team - MULTI-TENANT
 */
router.get(
  '/stats/team',
  (req, res, next) => {
    const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'PREPARATORE_ATLETICO'];
    if (!allowedRoles.includes(req.user.role)) {
      console.log('🟡 Tentativo accesso statistiche team non autorizzato da:', req.user.role);
      return res.status(403).json({
        error: 'Non autorizzato a visualizzare statistiche team',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
      });
    }
    next();
  },
  async (req, res) => {
    try {
      const { startDate, endDate, sessionType } = req.query;
      const teamId = req.context.teamId; // 🔧 AGGIUNTO - Context multi-tenant
      
      console.log('🔵 Richiesta statistiche team:', teamId, 'filtri:', req.query);

      const prisma = getPrismaClient();

      // 🔧 FIXED - Filtri WHERE con constraint team
      const where = {
        player: { teamId } // 🔧 FILTRO MULTI-TENANT OBBLIGATORIO
      };
      if (startDate) where.session_date = { gte: new Date(startDate) };
      if (endDate) where.session_date = { ...(where.session_date || {}), lte: new Date(endDate) };
      if (sessionType) where.session_type = sessionType;

      const [totalSessions, activePlayersCount, teamAverages, topPerformers, sessionTypeBreakdown] =
        await Promise.all([
          prisma.performanceData.count({ where }),

          prisma.performanceData
            .findMany({
              where,
              select: { playerId: true },
              distinct: ['playerId'],
            })
            .then((r) => r.length),

          prisma.performanceData.aggregate({
            where,
            _avg: {
              total_distance_m: true,
              sprint_distance_m: true,
              top_speed_kmh: true,
              avg_speed_kmh: true,
              player_load: true,
              max_heart_rate: true,
              duration_minutes: true,
            },
          }),

          prisma.performanceData.findMany({
            where,
            orderBy: { player_load: 'desc' },
            take: 5,
            include: {
              player: {
                select: {
                  firstName: true,
                  lastName: true,
                  position: true,
                  shirtNumber: true,
                },
              },
            },
          }),

          prisma.performanceData.groupBy({
            by: ['session_type'],
            where,
            _count: { session_type: true },
            _avg: {
              total_distance_m: true,
              player_load: true,
              top_speed_kmh: true,
            },
          }),
        ]);

      const teamStats = {
        overview: {
          totalSessions,
          activePlayersCount,
          teamId, // 🔧 AGGIUNTO per trasparenza
          dateRange: {
            startDate: startDate || null,
            endDate: endDate || null,
          },
          sessionTypeFilter: sessionType || null,
        },
        teamAverages: {
          totalDistance:
            teamAverages._avg.total_distance_m != null
              ? parseFloat(teamAverages._avg.total_distance_m.toFixed(2))
              : null,
          sprintDistance:
            teamAverages._avg.sprint_distance_m != null
              ? parseFloat(teamAverages._avg.sprint_distance_m.toFixed(2))
              : null,
          topSpeed:
            teamAverages._avg.top_speed_kmh != null
              ? parseFloat(teamAverages._avg.top_speed_kmh.toFixed(2))
              : null,
          avgSpeed:
            teamAverages._avg.avg_speed_kmh != null
              ? parseFloat(teamAverages._avg.avg_speed_kmh.toFixed(2))
              : null,
          playerLoad:
            teamAverages._avg.player_load != null
              ? parseFloat(teamAverages._avg.player_load.toFixed(2))
              : null,
          maxHeartRate:
            teamAverages._avg.max_heart_rate != null
              ? Math.round(teamAverages._avg.max_heart_rate)
              : null,
          duration:
            teamAverages._avg.duration_minutes != null
              ? Math.round(teamAverages._avg.duration_minutes)
              : null,
        },
        topPerformers: topPerformers.map((item) => ({
          player: item.player,
          sessionDate: item.session_date,
          sessionType: item.session_type,
          playerLoad: item.player_load,
          totalDistance: item.total_distance_m,
          topSpeed: item.top_speed_kmh,
        })),
        sessionBreakdown: sessionTypeBreakdown.map((item) => ({
          sessionType: item.session_type,
          count: item._count.session_type,
          avgDistance:
            item._avg.total_distance_m != null
              ? parseFloat(item._avg.total_distance_m.toFixed(2))
              : null,
          avgPlayerLoad:
            item._avg.player_load != null
              ? parseFloat(item._avg.player_load.toFixed(2))
              : null,
          avgTopSpeed:
            item._avg.top_speed_kmh != null
              ? parseFloat(item._avg.top_speed_kmh.toFixed(2))
              : null,
        })),
      };

      console.log('🟢 Statistiche team calcolate:', totalSessions, 'sessioni per', activePlayersCount, 'giocatori');

      res.json({
        message: 'Statistiche team recuperate con successo',
        data: teamStats,
      });
    } catch (error) {
      console.log('🔴 Errore calcolo statistiche team:', error.message);
      res.status(500).json({
        error: 'Errore interno durante il calcolo delle statistiche team',
        code: 'TEAM_STATS_ERROR',
      });
    }
  }
);

/**
 * 📋 GET /api/performance
 * Lista con filtri - MULTI-TENANT
 */
router.get('/', getPerformanceData);

/**
 * ➕ POST /api/performance
 * Creazione - MULTI-TENANT
 */
router.post(
  '/',
  (req, res, next) => {
    const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'PREPARATORE_ATLETICO'];
    if (!allowedRoles.includes(req.user.role)) {
      console.log('🟡 Tentativo creazione performance data non autorizzato da:', req.user.role);
      return res.status(403).json({
        error: 'Non autorizzato a creare dati performance',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
      });
    }
    next();
  },
  createPerformanceData
);

/**
 * 📈 GET /api/performance/:id
 * Dettaglio - MULTI-TENANT
 */
router.get('/:id', ensureNumericParam('id'), getPerformanceDataById);

/**
 * 🗑️ DELETE /api/performance/:id
 * Eliminazione - MULTI-TENANT
 */
router.delete(
  '/:id',
  ensureNumericParam('id'),
  async (req, res, next) => {
    try {
      const performanceId = Number(req.params.id);
      const userRole = req.user.role;
      const teamId = req.context.teamId; // 🔧 AGGIUNTO

      // ADMIN può eliminare tutto del suo team
      if (userRole === 'ADMIN') return next();

      const allowedRoles = ['DIRECTOR_SPORT', 'PREPARATORE_ATLETICO'];
      if (!allowedRoles.includes(userRole)) {
        console.log('🟡 Tentativo eliminazione performance data non autorizzato da:', userRole);
        return res.status(403).json({
          error: 'Non autorizzato a eliminare dati performance',
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: ['ADMIN', ...allowedRoles],
        });
      }

      const prisma = getPrismaClient();

      // 🔧 FIXED - Verifica ownership + team constraint
      const performanceData = await prisma.performanceData.findFirst({
        where: { 
          id: performanceId,
          player: { teamId } // 🔧 VINCOLO MULTI-TENANT
        },
        select: {
          id: true,
          createdById: true,
          player: { 
            select: { 
              firstName: true, 
              lastName: true,
              teamId: true // 🔧 AGGIUNTO per debug
            } 
          },
        },
      });

      if (!performanceData) {
        return res.status(404).json({
          error: 'Dato performance non trovato o non appartiene al team',
          code: 'RESOURCE_NOT_FOUND',
        });
      }

      if (performanceData.createdById !== req.user.profile.id) {
        console.log('🟡 Tentativo eliminazione performance data di altro utente da:', userRole);
        return res.status(403).json({
          error: 'Puoi eliminare solo i dati performance che hai creato',
          code: 'OWNERSHIP_REQUIRED',
        });
      }

      console.log('🔵 Eliminazione performance autorizzata per:', performanceData.player.firstName, performanceData.player.lastName);
      next();
    } catch (error) {
      console.log('🔴 Errore verifica permessi eliminazione performance:', error.message);
      res.status(500).json({
        error: 'Errore interno verifica permessi',
        code: 'PERMISSION_CHECK_ERROR',
      });
    }
  },
  deletePerformanceData
);

console.log('🔵 Route performance multi-tenant configurate:');
console.log('  - GET    /api/performance (lista con filtri team-scoped)');
console.log('  - POST   /api/performance (creazione team-scoped)');
console.log('  - GET    /api/performance/:id (dettaglio team-scoped)');
console.log('  - DELETE /api/performance/:id (eliminazione team-scoped)');
console.log('  - GET    /api/performance/stats/player/:playerId (stats giocatore team-scoped)');
console.log('  - GET    /api/performance/stats/team (stats team-scoped)');

module.exports = router;