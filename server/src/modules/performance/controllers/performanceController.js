// Percorso: server/src/modules/performance/controllers/performanceController.js
// Controller per gestione dati performance SoccerXpro V2 - MULTI-TENANT FIXED

const { getPrismaClient } = require('../../../config/database');
const { API_ERRORS, createErrorResponse } = require('../../../constants/errors');
const { calculateACWR } = require('../../../utils/kpi');

console.log('🔵 [DEBUG] Caricamento controller performance multi-tenant...'); // INFO DEV - rimuovere in produzione

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
    console.log('🔵 [DEBUG] Richiesta lista performance data multi-tenant'); // INFO DEV
    console.log('🔍 DEBUG - Query params ricevuti:', req.query);

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
      period,
      startDate,
      endDate,
      sessionType,
      sessionName,
      roles,
      players,
      search,
      status,
      normalize,
      sortBy,
      density,
      aggregate,
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

    // Gestione del parametro period
    let start, end;
    if (period && period !== 'custom') {
      // Calcola date basate sul periodo
      const now = new Date();
      switch (period) {
        case 'week':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case 'month':
          // 🔧 FIX: Calcola primo giorno del mese corrente invece di mese precedente
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
          break;
        case 'quarter':
          // 🔧 FIX: Calcola primo giorno del trimestre corrente invece di 3 mesi fa
          const currentQuarter = Math.floor(now.getMonth() / 3);
          start = new Date(now.getFullYear(), currentQuarter * 3, 1);
          end = now;
          break;
        case 'year':
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          end = now;
          break;
        default:
          start = parseDateFlexible(startDate);
          end = parseDateFlexible(endDate);
      }
    } else {
      // Usa date personalizzate
      start = parseDateFlexible(startDate);
      end = parseDateFlexible(endDate);
    }

    if (start) {
      where.session_date = { gte: start };
    }
    if (end) {
      where.session_date = { ...(where.session_date || {}), lte: end };
    }

    console.log('🔍 DEBUG - Filtro periodo applicato:', {
      period,
      startDate: start?.toISOString(),
      endDate: end?.toISOString(),
      whereClause: where.session_date
    });

    if (sessionType && sessionType !== 'all') {
      // Mapping per sessionType (i valori nel DB sono già in italiano)
      const sessionTypeMap = {
        'allenamento': 'Allenamento',
        'partita': 'Partita',
        'Allenamento': 'Allenamento',
        'Partita': 'Partita',
        'TRAINING': 'Allenamento',
        'MATCH': 'Partita'
      };
      
      const mappedSessionType = sessionTypeMap[sessionType] || sessionType;
      where.session_type = mappedSessionType;
      
      console.log('🔍 DEBUG - Filtro sessionType applicato:', {
        sessionTypeOriginal: sessionType,
        sessionTypeMapped: mappedSessionType,
        sessionTypeType: typeof sessionType,
        whereClause: where.session_type,
        mappingFound: sessionTypeMap[sessionType] ? 'YES' : 'NO'
      });
    }
    if (sessionName && sessionName !== 'all') {
      where.session_name = sessionName;
    }
    
    // Filtro per ruoli
    if (roles && roles.length > 0) {
      const roleArray = roles.split(',').filter(Boolean);
      if (roleArray.length > 0) {
        // Mappa i ruoli del frontend a quelli del database
        const roleMap = { 
          POR: ['GOALKEEPER'], 
          DIF: ['DEFENDER'], 
          CEN: ['MIDFIELDER'], 
          ATT: ['FORWARD'] 
        };
        
        const mappedRoles = roleArray.flatMap(r => roleMap[r] || []).filter(Boolean);
        if (mappedRoles.length > 0) {
          where.player = {
            ...where.player,
            position: { in: mappedRoles }
          };
        }
      }
    }

    // Filtro per ricerca giocatori
    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      where.player = {
        ...where.player,
        OR: [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { shirtNumber: { equals: toIntOrNull(search) } }
        ]
      };
    }

    // Filtro per giocatori specifici
    if (players && players.length > 0) {
      const playerArray = players.split(',').filter(Boolean).map(id => toIntOrNull(id)).filter(Boolean);
      if (playerArray.length > 0) {
        where.player = {
          ...where.player,
          id: { in: playerArray }
        };
      }
    }

    // 🔧 FIX: Gestione speciale per richieste ACWR
    if (req.query.sortBy === 'acwr' || req.query.view === 'acwr' || req.query.acwrOnly === 'true') {
      console.log('🔧 Richiesta ACWR specifica - caricamento sessioni individuali');
      
      const sessions = await prisma.performanceData.findMany({
        where,
        select: {
          playerId: true,
          session_date: true,
          training_load: true,
          player_load: true, // Fallback se training_load non disponibile
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true
            }
          }
        },
        orderBy: { session_date: 'asc' }
      });
      
      // Normalizza training_load (usa player_load come fallback)
      const normalizedSessions = sessions.map(s => ({
        ...s,
        training_load: s.training_load || s.player_load || 0
      }));
      
      const acwrResults = calculateACWR(normalizedSessions);
      
      console.log('🟢 ACWR calcolato per', acwrResults.length, 'record');
      
      return res.json({
        message: 'Dati ACWR calcolati con successo',
        data: acwrResults,
        count: acwrResults.length,
        total: acwrResults.length,
        meta: {
          acwr: true,
          teamId
        }
      });
    }

    // 🔧 FIX: Supporto per aggregazione (come TeamDashboard)
    const shouldAggregate = aggregate === 'true' || aggregate === '1';
    const aggregateExtended = req.query.aggregateExtended === 'true' || req.query.aggregateExtended === '1';
    
    if (shouldAggregate) {
      console.log('🔧 Aggregazione richiesta - calcolo dati per data');
      
      // Carica tutti i dati per il periodo (senza paginazione)
      const allData = await prisma.performanceData.findMany({
        where,
        orderBy: [
          { session_date: 'asc' },
          { created_at: 'desc' },
        ],
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
      });
      
      // 🔧 FIX: Genera array di tutti i giorni del periodo (anche vuoti)
      const dateMap = new Map();
      
      // Prima genera tutti i giorni del periodo
      if (start && end) {
        const currentDate = new Date(start);
        while (currentDate <= end) {
          const dayKey = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const dateFormatted = currentDate.toLocaleDateString('it-IT');
          
          dateMap.set(dayKey, {
            date: dateFormatted,
            dateFull: dayKey,
            sessions: [],
            sessionTypesSet: new Set(),
            totalDistance: 0,
            totalMinutes: 0,
            avgMetPower: 0,
            distance15_20: 0,
            distance20_25: 0,
            distance25plus: 0,
            playerLoad: 0,
            topSpeed: 0,
            sprintDistance: 0,
            highIntensityRuns: 0,
            // Estensioni opzionali
            ...(aggregateExtended ? {
              equivalentDistance: 0,
              totalAccOver3: 0,
              totalDecOver3: 0,
              totalDistanceAccOver2: 0,
              totalDistanceDecOver2: 0,
              distance20wkg: 0,
              distance35wkg: 0,
              maxPower5s: 0
            } : {})
          });
          
          // Passa al giorno successivo
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        console.log('🔧 Generati', dateMap.size, 'giorni per periodo', start.toISOString().slice(0, 10), '-', end.toISOString().slice(0, 10));
      }
      
      // Poi popola con i dati delle sessioni esistenti
      allData.forEach(session => {
        // 🔧 FIX: Gestione sicura delle date per evitare "Invalid time value"
        if (!session.session_date || !(session.session_date instanceof Date) || isNaN(session.session_date.getTime())) {
          console.warn('⚠️ Sessione con data invalida:', session.id, session.session_date);
          return; // Salta sessioni con date invalide
        }
        
        const date = session.session_date.toISOString().split('T')[0]; // '2025-01-15'
        
        // Se il giorno non esiste nella mappa (non dovrebbe succedere), crealo
        if (!dateMap.has(date)) {
          const dateFormatted = new Date(date).toLocaleDateString('it-IT');
          dateMap.set(date, {
            date: dateFormatted,
            dateFull: date,
            sessions: [],
            sessionTypesSet: new Set(),
            totalDistance: 0,
            totalMinutes: 0,
            avgMetPower: 0,
            distance15_20: 0,
            distance20_25: 0,
            distance25plus: 0,
            playerLoad: 0,
            topSpeed: 0,
            sprintDistance: 0,
            highIntensityRuns: 0,
            // Estensioni opzionali
            ...(aggregateExtended ? {
              equivalentDistance: 0,
              totalAccOver3: 0,
              totalDecOver3: 0,
              totalDistanceAccOver2: 0,
              totalDistanceDecOver2: 0,
              distance20wkg: 0,
              distance35wkg: 0,
              maxPower5s: 0
            } : {})
          });
        }
        
        const entry = dateMap.get(date);
        entry.sessions.push(session);
        // Raccogli tipologie di sessione per la distribuzione per tipologia
        const sType = (session.session_type || session.sessionType || '').toString().trim();
        if (sType) {
          entry.sessionTypesSet.add(sType);
        }
        
        // 🔧 FIX: Gestione sicura dei valori numerici
        const safeNumber = (value) => {
          const num = Number(value);
          return isNaN(num) ? 0 : num;
        };
        
        // 🔍 DEBUG: Verifica campi disponibili per la prima sessione
        if (aggregateExtended && !dateMap.has('debug_logged')) {
          console.log('🔍 DEBUG: Campi disponibili nella prima sessione:', {
            id: session.id,
            equivalent_distance_m: session.equivalent_distance_m,
            player_load: session.player_load,
            training_load: session.training_load,
            hasEquivalentDistance: 'equivalent_distance_m' in session,
            hasPlayerLoad: 'player_load' in session,
            hasTrainingLoad: 'training_load' in session
          });
          dateMap.set('debug_logged', true);
        }
        
        // Somma tutti i valori (logica TeamDashboard)
        entry.totalDistance += safeNumber(session.total_distance_m);
        entry.totalMinutes += safeNumber(session.duration_minutes);
        entry.distance15_20 += safeNumber(session.distance_15_20_kmh_m);
        entry.distance20_25 += safeNumber(session.distance_20_25_kmh_m);
        entry.distance25plus += safeNumber(session.distance_over_25_kmh_m);
        // 🔧 FIX: Usa training_load se player_load non è disponibile
        const load = safeNumber(session.player_load || session.training_load || 0);
        entry.playerLoad += load;
        entry.sprintDistance += safeNumber(session.sprint_distance_m);
        entry.highIntensityRuns += safeNumber(session.high_intensity_runs);
        
        if (aggregateExtended) {
          // 🔧 FIX: Equivalent distance - calcola se non presente nel database
          if ('equivalent_distance_m' in session && session.equivalent_distance_m) {
            entry.equivalentDistance += safeNumber(session.equivalent_distance_m);
          } else {
            // Calcola equivalent distance come 85% della distanza totale (valore tipico)
            entry.equivalentDistance += Math.round(safeNumber(session.total_distance_m) * 0.85);
          }
          // Accelerazioni/Decelerazioni
          entry.totalAccOver3 += safeNumber(session.num_acc_over_3_ms2);
          entry.totalDecOver3 += safeNumber(session.num_dec_over_minus3_ms2);
          entry.totalDistanceAccOver2 += safeNumber(session.distance_acc_over_2_ms2_m);
          entry.totalDistanceDecOver2 += safeNumber(session.distance_dec_over_minus2_ms2_m);
          // Energetico
          entry.distance20wkg += safeNumber(session.distance_over_20wkg_m);
          entry.distance35wkg += safeNumber(session.distance_over_35wkg_m);
          const maxP5 = safeNumber(session.max_power_5s_wkg);
          if (maxP5 > entry.maxPower5s) entry.maxPower5s = maxP5;
        }
        
        // Per la potenza metabolica, accumula per calcolare la media dopo
        const metPower = safeNumber(session.avg_metabolic_power_wkg);
        if (metPower > 0) {
          entry.avgMetPower += metPower;
        }
        
        // Top speed massima
        const topSpeed = safeNumber(session.top_speed_kmh);
        if (topSpeed > entry.topSpeed) {
          entry.topSpeed = topSpeed;
        }
      });
      
      // 🔧 FIX: Calcola medie finali con gestione sicura
      const aggregatedData = Array.from(dateMap.values()).map(entry => {
        const safeDivision = (numerator, denominator) => {
          return denominator > 0 ? (numerator / denominator) : 0;
        };
        
        // 🚨 FIX: Protezione contro sessions undefined
        const sessionsLength = entry.sessions?.length || 0;
        
        const base = {
          ...entry,
          distancePerMin: safeDivision(entry.totalDistance, entry.totalMinutes),
          avgMetPower: safeDivision(entry.avgMetPower, sessionsLength),
          hsrTotal: entry.distance15_20 + entry.distance20_25 + entry.distance25plus,
          playerLoadPerMin: safeDivision(entry.playerLoad, entry.totalMinutes),
          sessionsCount: sessionsLength,
          // 🔧 FIX: Assicura che playerLoad sia sempre presente
          totalPlayerLoad: entry.playerLoad,
          totalTrainingLoad: entry.playerLoad
        };
        // Serializza tipologie e rimuovi il Set/array pesanti
        base.sessionTypes = Array.from(entry.sessionTypesSet || []).join(', ');
        delete base.sessionTypesSet;
        
        if (!aggregateExtended) {
          // 🔧 FIX: Aggiungi equivalentDistance anche per aggregazione base
          base.equivalentDistance = Math.round(base.totalDistance * 0.85);
          // Rimuovi l'array sessions per non appesantire la risposta
          delete base.sessions;
          return base;
        }
        
        // Calcoli derivati estesi
        const result = {
          ...base,
          eqPct: base.totalDistance > 0 ? (entry.equivalentDistance / base.totalDistance) * 100 : 0,
          accPerMin: base.totalMinutes > 0 ? entry.totalAccOver3 / base.totalMinutes : 0,
          decPerMin: base.totalMinutes > 0 ? entry.totalDecOver3 / base.totalMinutes : 0
        };
        
        // Rimuovi l'array sessions per non appesantire la risposta
        delete result.sessions;
        return result;
      }).sort((a, b) => {
        try {
          return new Date(a.dateFull) - new Date(b.dateFull);
        } catch (error) {
          console.warn('⚠️ Errore ordinamento date:', error);
          return 0;
        }
      });
      
      console.log('🟢 [INFO] Dati aggregati per data:', aggregatedData.length, 'date');
      
      // 🔧 FIX: Calcola anche ACWR per i grafici
      let acwrResults = [];
      try {
        console.log('🔧 Calcolo ACWR per dati aggregati...');
        const sessionsForACWR = await prisma.performanceData.findMany({
          where,
          select: {
            playerId: true,
            session_date: true,
            training_load: true,
            player_load: true
          },
          orderBy: { session_date: 'asc' }
        });
        
        const normalizedSessions = sessionsForACWR.map(s => ({
          ...s,
          training_load: s.training_load || s.player_load || 0
        }));
        
        acwrResults = calculateACWR(normalizedSessions);
        console.log('🟢 ACWR calcolato per aggregazione:', acwrResults.length, 'record');
      } catch (error) {
        console.warn('⚠️ Errore calcolo ACWR per aggregazione:', error.message);
      }
      
      // 🔍 DEBUG: Verifica struttura dati aggregati
      if (aggregatedData.length > 0) {
        console.log('🔍 DEBUG backend aggregation - Primo record:', {
          dateFull: aggregatedData[0].dateFull,
          totalDistance: aggregatedData[0].totalDistance,
          playerLoad: aggregatedData[0].playerLoad,
          sessions: aggregatedData[0].sessions?.length,
          keys: Object.keys(aggregatedData[0])
        });
        console.log('🔍 DEBUG backend - aggregateExtended attivo:', aggregateExtended);
        if (aggregateExtended) {
          console.log('🔍 DEBUG backend - campi estesi:', {
            equivalentDistance: aggregatedData[0].equivalentDistance,
            totalAccOver3: aggregatedData[0].totalAccOver3,
            distance20wkg: aggregatedData[0].distance20wkg
          });
        }
      }
      
      return res.json({
        message: 'Dati performance aggregati recuperati con successo',
        data: aggregatedData,
        count: aggregatedData.length,
        total: aggregatedData.length,
        meta: {
          aggregated: true,
          aggregateExtended,
          teamId,
          acwrData: acwrResults // Includi dati ACWR
        },
      });
    }
    
    // Paginazione
    const pageNum = Math.max(1, toIntOrNull(page) || 1);
    
    // Se richiesto "all", carica tutti i dati senza limiti
    const requestAll = req.query.all === 'true' || req.query.all === '1';
    const pageSizeNum = requestAll ? 10000 : Math.min(100, Math.max(1, toIntOrNull(pageSize) || 20));
    const skip = requestAll ? 0 : (pageNum - 1) * pageSizeNum;
    const take = pageSizeNum;
    
    console.log('🔍 API Performance - Parametri:', {
      requestAll,
      pageSizeNum,
      skip,
      take,
      where: JSON.stringify(where)
    });

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

    console.log('🔍 DEBUG - Record trovati:', performanceData.length);
    console.log('🔍 DEBUG - Where clause:', JSON.stringify(where, null, 2));
    
    // Debug: verifica valori session_type nel database
    if (sessionType && sessionType !== 'all') {
      const sampleData = await prisma.performanceData.findFirst({
        where: { teamId },
        select: { session_type: true }
      });
      
      // Debug: verifica tutti i valori di session_type nel database
      const allSessionTypes = await prisma.performanceData.findMany({
        where: { teamId },
        select: { session_type: true },
        distinct: ['session_type']
      });
      
      console.log('🔍 DEBUG - Valore session_type nel DB:', sampleData?.session_type);
      console.log('🔍 DEBUG - Valore sessionType ricevuto:', sessionType);
      console.log('🔍 DEBUG - Tutti i session_type nel DB:', allSessionTypes.map(s => s.session_type));
    }

    console.log('🔵 [DEBUG] Performance data recuperati per team:', teamId, '- Records:', performanceData.length); // INFO DEV
    
    // Debug: range date nei dati restituiti
    if (performanceData.length > 0) {
      const dates = performanceData.map(p => p.session_date).sort();
      console.log('📅 Range date API:', {
        prima: dates[0],
        ultima: dates[dates.length - 1],
        totale: dates.length
      });
    }

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

    console.log('🔵 [DEBUG] Richiesta dettagli performance ID:', performanceId, 'team:', teamId); // INFO DEV

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
      session_name,
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

    console.log('🔵 [DEBUG] Creazione nuovi dati performance per giocatore ID:', playerId, 'team:', teamId); // INFO DEV

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

    // Normalizza session_type e session_name
    const sessionTypeNorm = session_type ? String(session_type).trim() : null;
    const sessionNameNorm = session_name ? String(session_name).trim() : null;

    // 🔧 AGGIUNTO - createdById dal context
    const created = await prisma.performanceData.create({
      data: {
        playerId: playerIdNum,
        session_date: sessionDateObj,
        session_type: sessionTypeNorm,
        session_name: sessionNameNorm,
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

    console.log('🔵 [DEBUG] Eliminazione performance data ID:', performanceId, 'team:', teamId); // INFO DEV

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

// 📋 GET /api/performance/player/:playerId/sessions
const getSessionsByPlayer = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Contesto team non disponibile' });
    }

    const playerId = parseInt(req.params.playerId, 10);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'ID giocatore non valido' });
    }

    const prisma = getPrismaClient();

    // Verifica che il giocatore appartenga al team
    const player = await prisma.player.findFirst({
      where: { id: playerId, teamId },
      select: { id: true }
    });
    if (!player) {
      return res.status(404).json({ error: 'Giocatore non trovato o non appartiene al team' });
    }

    // Cap massimo per sicurezza
    const CAP_LIMIT = 5000;

    // Conta totale sessioni
    const totalCount = await prisma.performanceData.count({
      where: { playerId, player: { teamId } }
    });

    // Recupera fino al CAP in ordine cronologico
    const sessions = await prisma.performanceData.findMany({
      where: { playerId, player: { teamId } },
      orderBy: { session_date: 'asc' },
      take: CAP_LIMIT,
      select: {
        // ================= CAMPI ESISTENTI =================
        id: true,
        session_date: true,
        session_type: true,
        session_name: true,
        duration_minutes: true,
        total_distance_m: true,
        sprint_distance_m: true,
        top_speed_kmh: true,
        avg_speed_kmh: true,
        player_load: true,
        high_intensity_runs: true,
        max_heart_rate: true,
        avg_heart_rate: true,
        
        // ================= NUOVI CAMPI - DISTANZE E VELOCITÀ =================
        equivalent_distance_m: true,
        equivalent_distance_pct: true,
        distance_per_min: true,
        distance_over_15_kmh_m: true,
        distance_15_20_kmh_m: true,
        distance_20_25_kmh_m: true,
        distance_over_25_kmh_m: true,
        distance_over_20_kmh_m: true,
        
        // ================= NUOVI CAMPI - POTENZA METABOLICA =================
        avg_metabolic_power_wkg: true,
        distance_over_20wkg_m: true,
        distance_over_35wkg_m: true,
        max_power_5s_wkg: true,
        
        // ================= NUOVI CAMPI - ACCELERAZIONI/DECELERAZIONI =================
        distance_acc_over_2_ms2_m: true,
        distance_dec_over_minus2_ms2_m: true,
        pct_distance_acc_over_2_ms2: true,
        pct_distance_dec_over_minus2_ms2: true,
        distance_acc_over_3_ms2_m: true,
        distance_dec_over_minus3_ms2_m: true,
        num_acc_over_3_ms2: true,
        num_dec_over_minus3_ms2: true,
        acc_events_per_min_over_2_ms2: true,
        dec_events_per_min_over_minus2_ms2: true,
        
        // ================= NUOVI CAMPI - ZONE DI INTENSITÀ =================
        time_under_5wkg_min: true,
        time_5_10_wkg_min: true,
        
        // ================= NUOVI CAMPI - INDICI E PROFILI =================
        rvp_index: true,
        training_load: true,
        
        // ================= NUOVI CAMPI - INFORMAZIONI AGGIUNTIVE =================
        session_day: true,
        is_match: true,
        drill_name: true,
      }
    });

    const capped = totalCount > CAP_LIMIT;
    if (capped) {
      res.set('X-Records-Capped', 'true');
      res.set('X-Records-Limit', String(CAP_LIMIT));
    } else {
      res.set('X-Records-Capped', 'false');
      res.set('X-Records-Limit', String(CAP_LIMIT));
    }
    res.set('X-Total-Records', String(totalCount));

    return res.json({
      message: 'Sessioni caricate con successo',
      data: sessions
    });
  } catch (err) {
    console.error('🔴 Errore caricamento sessioni giocatore:', err);
    res.status(500).json({
      error: 'Errore interno server',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// 🔍 GET /api/performance/debug-dates
const debugDates = async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ 
        error: 'Contesto team non disponibile',
        code: 'NO_TEAM_CONTEXT'
      });
    }

    console.log('🔵 [DEBUG] Debug date per team:', teamId); // INFO DEV

    const prisma = getPrismaClient();

    // Recupera alcuni sample di performance data per debug
    const sampleData = await prisma.performanceData.findMany({
      where: {
        player: { teamId } // Filtro multi-tenant
      },
      orderBy: { session_date: 'desc' },
      take: 10,
      select: {
        id: true,
        session_date: true,
        created_at: true,
        player: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Conta totale record per team
    const totalRecords = await prisma.performanceData.count({
      where: {
        player: { teamId }
      }
    });

    // Range date nel database
    const dateStats = await prisma.performanceData.aggregate({
      where: {
        player: { teamId }
      },
      _min: { session_date: true },
      _max: { session_date: true }
    });

    const debugInfo = {
      teamId,
      totalRecords,
      dateRange: {
        earliest: dateStats._min.session_date,
        latest: dateStats._max.session_date
      },
      sampleData: sampleData.map(item => ({
        id: item.id,
        sessionDate: item.session_date,
        createdAt: item.created_at,
        player: `${item.player.firstName} ${item.player.lastName}`,
        sessionDateISO: item.session_date.toISOString(),
        sessionDateLocal: item.session_date.toLocaleDateString('it-IT')
      })),
      currentServerTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    console.log('🟢 [INFO] Debug date completato per team:', teamId);

    res.json({
      message: 'Debug date performance completato',
      data: debugInfo
    });

  } catch (error) {
    console.log('🔴 Errore debug date:', error.message); // ERROR
    res.status(500).json({
      error: 'Errore interno debug date',
      code: 'DEBUG_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AGGIORNA il module.exports per includere tutte le funzioni:
module.exports = {
  getPerformanceData,
  getPerformanceDataById,
  createPerformanceData,
  deletePerformanceData,
  getSessionsByPlayer,
  debugDates
};