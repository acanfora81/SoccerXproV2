// server/src/routes/contracts.js
// Route per la gestione dei contratti

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const tenantContext = require('../middleware/tenantContext');
const {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getContractStats
} = require('../controllers/contracts');

// Middleware di autenticazione e tenant context per tutte le route
router.use(authenticate);
router.use(tenantContext);

/**
 * 📊 GET /api/contracts/stats
 * Statistiche generali sui contratti
 */
router.get('/stats', requirePermission('contracts:read'), getContractStats);

/**
 * 📋 GET /api/contracts
 * Lista tutti i contratti del team
 * Query params: status, contractType, expiring, search, page, limit
 */
router.get('/', requirePermission('contracts:read'), getContracts);

/**
 * 📋 GET /api/contracts/:id
 * Ottieni contratto specifico
 */
router.get('/:id', requirePermission('contracts:read'), getContract);

/**
 * ➕ POST /api/contracts
 * Crea nuovo contratto
 */
router.post('/', requirePermission('contracts:write'), createContract);

/**
 * ✏️ PUT /api/contracts/:id
 * Aggiorna contratto esistente
 */
router.put('/:id', requirePermission('contracts:write'), updateContract);

/**
 * 🗑️ DELETE /api/contracts/:id
 * Elimina contratto
 */
router.delete('/:id', requirePermission('contracts:write'), deleteContract);

module.exports = router;
