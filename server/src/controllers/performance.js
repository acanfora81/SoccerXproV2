// server/src/controllers/performance.js
// Controller per gestione dati performance SoccerXpro V2 - MULTI-TENANT FIXED

const { getPrismaClient } = require('../config/database');
const { API_ERRORS, createErrorResponse } = require('../constants/errors');

console.log('🔵 Caricamento controller performance multi-tenant...'); // INFO DEV - rimuovere in produzione

// ------------------------------
// Utils (invariati)
// ------------------------------
function parseDateFlexible(input) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
    const [dd, mm, yyyy] = input.split('/').map(Number);
    const d = new Date(yyyy, mm - 1, dd);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function toIntOrNull(v) {
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function toFloatOrNull(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

// ------------------------------
// GET /api/performance - MULTI-TENANT
// Lista con filtri + paginazione
// ------------------------------
const getPerformanceData = async (req, res) => {
  try {
    console.log('🔵 Richiesta lista performance data multi-tenant'); // INFO DEV

    // 🔧 AGGIUNTO - Verifica contesto team
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const {
      playerId,
      startDate,
      endDate,
      sessionType,
      page = '1',
      pageSize = '20',
    } = req.query;

    const prisma = getPrismaClient();

    // 🔧 AGGIUNTO - Filtri base con vincolo team
    const where = {
      player: { teamId } // 🔧 FILTRO MULTI-TENANT OBBLIGATORIO
    };

    const playerIdNum = toIntOrNull(playerId);
    if (playerId && !playerIdNum) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Parametro playerId non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }
    
    // 🔧 MODIFICATO - Se playerId specificato, verifica che appartenga al team
    if (playerIdNum) {
      const playerExists = await prisma.player.findFirst({
        where: { id: playerIdNum, teamId },
        select: { id: true }
      });
      if (!playerExists) {
        const errorResponse = createErrorResponse(
          API_ERRORS.RESOURCE_NOT_FOUND,
          'Giocatore non trovato o non appartiene al team'
        );
        return res.status(errorResponse.status).json(errorResponse.body);
      }
      where.playerId = playerIdNum;
    }

    const start = parseDateFlexible(startDate);
    const end = parseDateFlexible(endDate);
    if (start) {
      where.session_date = { gte: start };
    }
    if (end) {
      where.session_date = { ...(where.session_date || {}), lte: end };
    }

    if (sessionType) {
      where.session_type = sessionType;
    }

    // Paginazione
    const pageNum = Math.max(1, toIntOrNull(page) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, toIntOrNull(pageSize) || 20));
    const skip = (pageNum - 1) * pageSizeNum;
    const take = pageSizeNum;

    const [total, performanceData] = await Promise.all([
      prisma.performanceData.count({ where }),
      prisma.performanceData.findMany({
        where,
        orderBy: [
          { session_date: 'desc' },
          { created_at: 'desc' },
        ],
        skip,
        take,
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              shirtNumber: true,
            },
          },
          created_by: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
      }),
    ]);

    console.log('🔵 Performance data recuperati per team:', teamId, '- Records:', performanceData.length); // INFO DEV

    res.json({
      message: 'Dati performance recuperati con successo',
      data: performanceData,
      count: performanceData.length,
      total,
      meta: {
        page: pageNum,
        pageSize: pageSizeNum,
        totalPages: Math.max(1, Math.ceil(total / pageSizeNum)),
        teamId // 🔧 AGGIUNTO per trasparenza
      },
    });
  } catch (error) {
    console.log('🔴 Errore recupero performance data:', error.message); // ERROR
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ------------------------------
// GET /api/performance/:id - MULTI-TENANT
// Dettaglio
// ------------------------------
const getPerformanceDataById = async (req, res) => {
  try {
    // 🔧 AGGIUNTO - Verifica contesto team
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const performanceId = toIntOrNull(req.params.id);
    if (!performanceId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'ID performance non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🔵 Richiesta dettagli performance ID:', performanceId, 'team:', teamId); // INFO DEV

    const prisma = getPrismaClient();

    // 🔧 MODIFICATO - Query con vincolo multi-tenant
    const performanceData = await prisma.performanceData.findFirst({
      where: { 
        id: performanceId,
        player: { teamId } // 🔧 FILTRO MULTI-TENANT
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true,
            dateOfBirth: true,
          },
        },
        created_by: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!performanceData) {
      console.log('🔴 Performance data non trovato o non appartiene al team:', performanceId); // ERROR
      const errorResponse = createErrorResponse(
        API_ERRORS.RESOURCE_NOT_FOUND,
        'Dati performance non trovati o non appartengono al team'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log(
      '🔵 Performance data recuperato per giocatore:',
      performanceData.player.firstName,
      performanceData.player.lastName
    ); // INFO DEV

    res.json({
      message: 'Dettagli performance recuperati con successo',
      data: performanceData,
    });
  } catch (error) {
    console.log('🔴 Errore recupero performance data:', error.message); // ERROR
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ------------------------------
// POST /api/performance - MULTI-TENANT
// Creazione
// ------------------------------
const createPerformanceData = async (req, res) => {
  try {
    // 🔧 AGGIUNTO - Verifica contesto team
    const teamId = req?.context?.teamId;
    const createdById = req?.context?.userId || req.user?.profile?.id;
    if (!teamId || !createdById) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const {
      playerId,
      session_date,
      session_type,
      duration_minutes,
      total_distance_m,
      sprint_distance_m,
      top_speed_kmh,
      avg_speed_kmh,
      player_load,
      high_intensity_runs,
      max_heart_rate,
      avg_heart_rate,
      source_device,
      notes,
    } = req.body;

    console.log('🔵 Creazione nuovi dati performance per giocatore ID:', playerId, 'team:', teamId); // INFO DEV

    // Validazione base
    const playerIdNum = toIntOrNull(playerId);
    const sessionDateObj = parseDateFlexible(session_date);
    if (!playerIdNum || !sessionDateObj) {
      const msg = !playerIdNum
        ? 'ID giocatore non valido'
        : 'Data sessione non valida (usa DD/MM/YYYY o YYYY-MM-DD)';
      const errorResponse = createErrorResponse(
        API_ERRORS.REQUIRED_FIELD_MISSING,
        msg
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const prisma = getPrismaClient();

    // 🔧 MODIFICATO - Verifica esistenza player nel team
    const player = await prisma.player.findFirst({
      where: { 
        id: playerIdNum, 
        teamId // 🔧 VINCOLO MULTI-TENANT
      },
      select: { id: true, firstName: true, lastName: true },
    });
    
    if (!player) {
      const errorResponse = createErrorResponse(
        API_ERRORS.RESOURCE_NOT_FOUND,
        'Giocatore non trovato o non appartiene al team'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Normalizza session_type
    const sessionTypeNorm = session_type ? String(session_type).trim() : null;

    // 🔧 AGGIUNTO - createdById dal context
    const created = await prisma.performanceData.create({
      data: {
        playerId: playerIdNum,
        session_date: sessionDateObj,
        session_type: sessionTypeNorm,
        duration_minutes: toIntOrNull(duration_minutes),
        total_distance_m: toFloatOrNull(total_distance_m),
        sprint_distance_m: toFloatOrNull(sprint_distance_m),
        top_speed_kmh: toFloatOrNull(top_speed_kmh),
        avg_speed_kmh: toFloatOrNull(avg_speed_kmh),
        player_load: toFloatOrNull(player_load),
        high_intensity_runs: toIntOrNull(high_intensity_runs),
        max_heart_rate: toIntOrNull(max_heart_rate),
        avg_heart_rate: toIntOrNull(avg_heart_rate),
        source_device: source_device || null,
        notes: notes || null,
        createdById, // 🔧 CORRETTO - usa context
      },
      include: {
        player: {
          select: {
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        created_by: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    console.log(
      '🔵 Dati performance creati per:',
      created.player.firstName,
      created.player.lastName
    ); // INFO DEV

    res.status(201).json({
      message: 'Dati performance creati con successo',
      data: created,
    });
  } catch (error) {
    console.log('🔴 Errore creazione performance data:', error.message); // ERROR
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ------------------------------
// DELETE /api/performance/:id - MULTI-TENANT
// Eliminazione
// ------------------------------
const deletePerformanceData = async (req, res) => {
  try {
    // 🔧 AGGIUNTO - Verifica contesto team
    const teamId = req?.context?.teamId;
    if (!teamId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.FORBIDDEN,
        'Contesto team non disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const performanceId = toIntOrNull(req.params.id);
    if (!performanceId) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'ID performance non valido'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log('🔵 Eliminazione performance data ID:', performanceId, 'team:', teamId); // INFO DEV

    const prisma = getPrismaClient();

    // 🔧 MODIFICATO - Verifica esistenza con vincolo team
    const existingData = await prisma.performanceData.findFirst({
      where: { 
        id: performanceId,
        player: { teamId } // 🔧 FILTRO MULTI-TENANT
      },
      include: {
        player: { 
          select: { 
            firstName: true, 
            lastName: true,
            teamId: true // 🔧 AGGIUNTO per debug
          } 
        },
        created_by: { select: { first_name: true, last_name: true } },
      },
    });

    if (!existingData) {
      const errorResponse = createErrorResponse(
        API_ERRORS.RESOURCE_NOT_FOUND,
        'Dati performance non trovati o non appartengono al team'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // 🔧 MODIFICATO - Eliminazione sicura (solo se appartiene al team)
    const deleteResult = await prisma.performanceData.deleteMany({
      where: { 
        id: performanceId,
        player: { teamId } // 🔧 DOPPIA SICUREZZA
      }
    });

    if (deleteResult.count === 0) {
      // Caso edge: record sparito tra controllo e eliminazione
      const errorResponse = createErrorResponse(
        API_ERRORS.RESOURCE_NOT_FOUND,
        'Impossibile eliminare: record non più disponibile'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    console.log(
      '🔵 Performance data eliminato per:',
      existingData.player.firstName,
      existingData.player.lastName,
      'team:',
      existingData.player.teamId
    ); // INFO DEV

    res.json({
      message: 'Dati performance eliminati con successo',
      data: existingData,
    });
  } catch (error) {
    console.log('🔴 Errore eliminazione performance data:', error.message); // ERROR
    const errorResponse = createErrorResponse(API_ERRORS.DATABASE_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

module.exports = {
  getPerformanceData,
  getPerformanceDataById,
  createPerformanceData,
  deletePerformanceData,
};