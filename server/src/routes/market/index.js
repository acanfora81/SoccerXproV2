// server/src/routes/market/index.js
// server/src/routes/market/index.js
const express = require('express');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');

const router = express.Router();

// Feature flag: abilita/disabilita modulo Mercato
function ensureMarketEnabled(req, res, next) {
  if (process.env.FEATURE_MARKET_MODULE !== 'true') {
    // Restituisci 404 per non esporre l'esistenza dell'endpoint
    return res.status(404).json({ success: false, error: 'Market module disabled' });
  }
  next();
}

// Solo DS o Admin
const ALLOWED_ROLES = new Set(['DIRECTOR_SPORT', 'ADMIN']);
function requireDirectorRole(req, res, next) {
  const role = req.user?.role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  next();
}

// Middleware globali del modulo Mercato
router.use(ensureMarketEnabled, authenticate, tenantContext, requireDirectorRole);

// Sotto-router
router.use('/overview', require('./overview'));
router.use('/targets', require('./targets'));
router.use('/negotiations', require('./negotiations'));
router.use('/offers', require('./offers'));
router.use('/budgets', require('./budgets'));
router.use('/agents', require('./agents'));

module.exports = router;


