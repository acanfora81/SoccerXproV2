/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Main Router
 * ===============================================================
 */

const express = require('express');
const { authenticate } = require('../../../middleware/auth');
const tenantContext = require('../../../middleware/tenantContext');

const router = express.Router();

/**
 * Feature flag: abilita/disabilita modulo Scouting
 */
function ensureScoutingEnabled(req, res, next) {
  if (process.env.FEATURE_SCOUTING_MODULE !== 'true') {
    return res.status(404).json({ success: false, error: 'Scouting module disabled' });
  }
  next();
}

/**
 * Role-based access control per Scouting
 * Ruoli ammessi: SCOUT, DIRECTOR_SPORT, ADMIN
 */
const ALLOWED_ROLES = new Set(['SCOUT', 'DIRECTOR_SPORT', 'ADMIN']);

function requireScoutingRole(req, res, next) {
  const role = req.user?.role;
  if (!role || !ALLOWED_ROLES.has(role)) {
    return res.status(403).json({ 
      success: false, 
      error: 'Forbidden: Only SCOUT, DIRECTOR_SPORT, or ADMIN can access scouting' 
    });
  }
  next();
}

/**
 * Middleware globali del modulo Scouting
 * 1. Feature flag check
 * 2. Authentication
 * 3. Tenant context (multi-tenancy)
 * 4. Role check
 */
router.use(ensureScoutingEnabled, authenticate, tenantContext, requireScoutingRole);

/**
 * Sub-routes
 */
router.use('/prospects', require('./prospects.routes'));
router.use('/reports', require('./reports.routes'));
router.use('/shortlists', require('./shortlists.routes'));

module.exports = router;

