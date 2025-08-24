// server/src/routes/players.js
// Routes per gestione giocatori SoccerXpro V2

// server/src/routes/players.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer
} = require('../controllers/players');

const router = express.Router();

// 🔐 Autenticazione per tutte le rotte di questo router
router.use(authenticate, tenantContext);


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

module.exports = router;
