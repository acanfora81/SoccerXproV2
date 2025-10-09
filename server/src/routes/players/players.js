// server/src/routes/players.js
// Routes per gestione giocatori SoccerXpro V2

const express = require('express');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');
const {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  exportPlayersToExcel,
  updatePlayerStatus
} = require('../../controllers/players');

const router = express.Router();

// 🔐 Autenticazione per tutte le rotte di questo router
router.use(authenticate, tenantContext);

// Helper: valida che :id sia numerico
const ensureNumericId = (paramName = 'id') => (req, res, next) => {
  const val = Number(req.params[paramName]);
  if (!Number.isInteger(val) || val <= 0) {
    return res.status(400).json({
      error: `Parametro ${paramName} non valido`,
      code: 'INVALID_ID'
    });
  }
  next();
};

/**
 * 📋 GET /api/players
 * Lista giocatori
 */
router.get('/', getPlayers);

/**
 * 📊 GET /api/players/export-excel
 * Esporta giocatori in Excel
 */
router.get('/export-excel', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Accesso negato: autorizzazioni insufficienti',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
}, exportPlayersToExcel);

/**
 * 👤 GET /api/players/:id
 * Dettaglio giocatore
 */
router.get('/:id', ensureNumericId('id'), getPlayerById);

/**
 * ➕ POST /api/players
 * Crea giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.post('/', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a creare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, createPlayer);

/**
 * ✏️ PUT /api/players/:id
 * Aggiorna giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.put('/:id', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a modificare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, updatePlayer);

/**
 * 🗑️ DELETE /api/players/:id
 * Elimina giocatore (solo ADMIN, DIRECTOR_SPORT)
 */
router.delete('/:id', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a eliminare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, deletePlayer);

/**
 * 🔄 PUT /api/players/:id/status
 * Aggiorna stato giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.put('/:id/status', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a modificare lo stato dei giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, updatePlayerStatus);

// ============================================================================
// Players Performance API - Schede Giocatori
// ============================================================================

const { getPrismaClient } = require('../../config/database');

// Mock data per sviluppo
const mockPlayers = [
  {
    id: 1,
    name: "Giovanni Di Nardo",
    role: "DIF",
    number: 5,
    status: "active",
    availability: "green",
    avatar: null,
    plMin: 6.1,
    plMinTrend: 5.2,
    plMinPercentile: 85,
    hsr: 950,
    hsrTrend: 8.1,
    hsrPercentile: 78,
    sprintPer90: 22,
    sprintTrend: -2.1,
    sprintPercentile: 92,
    topSpeed: 31.5,
    speedTrend: 3.4,
    speedPercentile: 88,
    acwr: 1.35,
    plMinTrend14: [5.2, 5.8, 6.1, 5.9, 6.3, 6.0, 5.7, 6.2, 5.8, 6.1, 5.9, 6.4, 6.2, 6.1],
    lastSession: {
      type: "Tattica",
      minutes: 80,
      date: "ieri",
      delta: 5.2
    },
    alerts: [
      { type: "warning", message: "ACWR a rischio" }
    ]
  },
  {
    id: 2,
    name: "Domenico Serafini",
    role: "DIF",
    number: 3,
    status: "return",
    availability: "yellow",
    avatar: null,
    plMin: 5.2,
    plMinTrend: -8.1,
    plMinPercentile: 40,
    hsr: 710,
    hsrTrend: -12.3,
    hsrPercentile: 35,
    sprintPer90: 15,
    sprintTrend: -15.2,
    sprintPercentile: 28,
    topSpeed: 29.9,
    speedTrend: -2.1,
    speedPercentile: 45,
    acwr: 0.95,
    plMinTrend14: [4.8, 5.1, 5.3, 5.0, 5.4, 5.2, 5.1, 5.3, 5.0, 5.2, 5.1, 5.3, 5.2, 5.2],
    lastSession: {
      type: "Riposo",
      minutes: 45,
      date: "ieri",
      delta: -8.1
    },
    alerts: [
      { type: "success", message: "Rientro graduale OK" }
    ]
  },
  {
    id: 3,
    name: "Marco Rossi",
    role: "CEN",
    number: 8,
    status: "active",
    availability: "green",
    avatar: null,
    plMin: 7.8,
    plMinTrend: 12.5,
    plMinPercentile: 95,
    hsr: 1250,
    hsrTrend: 18.2,
    hsrPercentile: 92,
    sprintPer90: 28,
    sprintTrend: 8.9,
    sprintPercentile: 96,
    topSpeed: 33.1,
    speedTrend: 5.7,
    speedPercentile: 94,
    acwr: 1.42,
    plMinTrend14: [6.8, 7.2, 7.5, 7.8, 8.1, 7.9, 7.6, 8.2, 7.8, 8.0, 7.9, 8.3, 8.1, 7.8],
    lastSession: {
      type: "Allenamento",
      minutes: 90,
      date: "ieri",
      delta: 12.5
    },
    alerts: [
      { type: "warning", message: "ACWR elevato" },
      { type: "success", message: "PB Velocità 33.1 km/h" }
    ]
  },
  {
    id: 4,
    name: "Alessandro Bianchi",
    role: "CEN",
    number: 10,
    status: "active",
    availability: "green",
    avatar: null,
    plMin: 6.9,
    plMinTrend: 2.1,
    plMinPercentile: 75,
    hsr: 980,
    hsrTrend: 4.3,
    hsrPercentile: 72,
    sprintPer90: 24,
    sprintTrend: 1.8,
    sprintPercentile: 85,
    topSpeed: 32.5,
    speedTrend: 2.9,
    speedPercentile: 89,
    acwr: 1.18,
    plMinTrend14: [6.5, 6.8, 7.0, 6.9, 7.2, 7.0, 6.8, 7.1, 6.9, 7.0, 6.9, 7.2, 7.0, 6.9],
    lastSession: {
      type: "Tecnica",
      minutes: 75,
      date: "ieri",
      delta: 2.1
    },
    alerts: []
  },
  {
    id: 5,
    name: "Luca Verdi",
    role: "ATT",
    number: 9,
    status: "active",
    availability: "green",
    avatar: null,
    plMin: 8.2,
    plMinTrend: 15.3,
    plMinPercentile: 98,
    hsr: 1450,
    hsrTrend: 22.1,
    hsrPercentile: 96,
    sprintPer90: 32,
    sprintTrend: 12.8,
    sprintPercentile: 98,
    topSpeed: 34.8,
    speedTrend: 8.5,
    speedPercentile: 97,
    acwr: 1.55,
    plMinTrend14: [7.2, 7.8, 8.0, 8.3, 8.5, 8.2, 7.9, 8.4, 8.1, 8.3, 8.2, 8.6, 8.4, 8.2],
    lastSession: {
      type: "Partita",
      minutes: 85,
      date: "ieri",
      delta: 15.3
    },
    alerts: [
      { type: "danger", message: "ACWR critico" },
      { type: "success", message: "PB Sprint/90: 32" }
    ]
  },
  {
    id: 6,
    name: "Matteo Neri",
    role: "ATT",
    number: 11,
    status: "injured",
    availability: "red",
    avatar: null,
    plMin: 0,
    plMinTrend: -100,
    plMinPercentile: 0,
    hsr: 0,
    hsrTrend: -100,
    hsrPercentile: 0,
    sprintPer90: 0,
    sprintTrend: -100,
    sprintPercentile: 0,
    topSpeed: 0,
    speedTrend: -100,
    speedPercentile: 0,
    acwr: 0,
    plMinTrend14: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    lastSession: {
      type: "Infortunio",
      minutes: 0,
      date: "7 giorni fa",
      delta: -100
    },
    alerts: [
      { type: "danger", message: "Infortunio - Fuori 3 settimane" }
    ]
  },
  {
    id: 7,
    name: "Antonio Gialli",
    role: "POR",
    number: 1,
    status: "active",
    availability: "green",
    avatar: null,
    plMin: 4.2,
    plMinTrend: -1.2,
    plMinPercentile: 65,
    hsr: 320,
    hsrTrend: -5.8,
    hsrPercentile: 45,
    sprintPer90: 8,
    sprintTrend: -3.1,
    sprintPercentile: 52,
    topSpeed: 28.5,
    speedTrend: 1.2,
    speedPercentile: 68,
    acwr: 1.05,
    plMinTrend14: [4.0, 4.3, 4.1, 4.4, 4.2, 4.1, 4.3, 4.0, 4.2, 4.1, 4.3, 4.2, 4.1, 4.2],
    lastSession: {
      type: "Portieri",
      minutes: 60,
      date: "ieri",
      delta: -1.2
    },
    alerts: []
  },
  {
    id: 8,
    name: "Roberto Blu",
    role: "POR",
    number: 12,
    status: "return",
    availability: "yellow",
    avatar: null,
    plMin: 3.8,
    plMinTrend: 8.5,
    plMinPercentile: 55,
    hsr: 280,
    hsrTrend: 12.3,
    hsrPercentile: 38,
    sprintPer90: 6,
    sprintTrend: 15.2,
    sprintPercentile: 42,
    topSpeed: 27.8,
    speedTrend: 4.1,
    speedPercentile: 62,
    acwr: 0.88,
    plMinTrend14: [3.2, 3.5, 3.8, 3.6, 3.9, 3.7, 3.8, 3.5, 3.7, 3.8, 3.6, 3.9, 3.8, 3.8],
    lastSession: {
      type: "Riposo",
      minutes: 30,
      date: "ieri",
      delta: 8.5
    },
    alerts: [
      { type: "success", message: "Rientro progressivo" }
    ]
  }
];

// Funzione per filtrare giocatori
function filterPlayers(players, filters) {
  let filtered = [...players];

  // Filtro per ricerca
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.number.toString().includes(search)
    );
  }

  // Filtro per ruolo
  if (filters.roles && filters.roles.length > 0) {
    filtered = filtered.filter(p => filters.roles.includes(p.role));
  }

  // Filtro per status
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(p => p.status === filters.status);
  }

  return filtered;
}

// Funzione per ordinare giocatori
function sortPlayers(players, sortBy) {
  const sorted = [...players];
  
  switch (sortBy) {
    case 'acwr':
      return sorted.sort((a, b) => b.acwr - a.acwr);
    case 'plMin':
      return sorted.sort((a, b) => b.plMin - a.plMin);
    case 'hsr':
      return sorted.sort((a, b) => b.hsr - a.hsr);
    case 'topSpeed':
      return sorted.sort((a, b) => b.topSpeed - a.topSpeed);
    case 'sprintPer90':
      return sorted.sort((a, b) => b.sprintPer90 - a.sprintPer90);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

// Endpoint principale
router.get('/performance', async (req, res) => {
  try {
    const teamId = req?.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Team non disponibile nel contesto' });
    }

    // Estrai filtri dalla query
    const filters = {
      search: req.query.search || '',
      period: req.query.period || 'week',
      sessionType: req.query.sessionType || 'all',
      roles: req.query.roles ? req.query.roles.split(',').filter(r => r) : [],
      status: req.query.status || 'all',
      normalize: req.query.normalize || 'per90',
      sortBy: req.query.sortBy || 'acwr'
    };

    // Per ora usiamo mock data
    // TODO: Implementare query reali al database
    let players = mockPlayers;

    // Applica filtri
    players = filterPlayers(players, filters);

    // Applica ordinamento
    players = sortPlayers(players, filters.sortBy);

    // Normalizza dati se richiesto
    if (filters.normalize !== 'absolute') {
      players = players.map(player => {
        const normalized = { ...player };
        
        switch (filters.normalize) {
          case 'per90':
            // Normalizza per 90 minuti (partita)
            normalized.plMin = (player.plMin * 90) / 90;
            normalized.hsr = (player.hsr * 90) / 90;
            normalized.sprintPer90 = player.sprintPer90; // Già per 90
            break;
          case 'perMin':
            // Già per minuto
            break;
          case 'perKg':
            // Normalizza per peso (assumiamo 75kg come media)
            const weight = 75;
            normalized.plMin = player.plMin / weight;
            normalized.hsr = player.hsr / weight;
            normalized.sprintPer90 = player.sprintPer90 / weight;
            break;
        }
        
        return normalized;
      });
    }

    // Simula delay per realisticità
    await new Promise(resolve => setTimeout(resolve, 200));

    res.json({
      players,
      filters,
      total: players.length,
      period: filters.period,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore API giocatori:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Endpoint per dettagli singolo giocatore
router.get('/:playerId', async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    const player = mockPlayers.find(p => p.id === playerId);
    
    if (!player) {
      return res.status(404).json({ error: 'Giocatore non trovato' });
    }

    res.json({ player });
  } catch (error) {
    console.error('Errore API giocatore singolo:', error);
    res.status(500).json({
      error: 'Errore interno del server',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
