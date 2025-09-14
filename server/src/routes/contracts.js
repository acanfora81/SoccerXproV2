// server/src/routes/contracts.js
// Route per la gestione dei contratti

const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requirePermission } = require('../utils/permissions');
const tenantContext = require('../middleware/tenantContext');
const { prisma } = require('../config/database');
const {
  getContracts,
  getContract,
  getContractAmendments,
  createContract,
  updateContract,
  createContractAmendment,
  renewContract,
  deleteContract,
  checkContractOverlaps,
  getContractStats,
  getPlayerContractHistory,
  getDashboardKPIs,
  getDashboardTrends,
  getDashboardDistributions,
  getDashboardExpiring,
  getDashboardTopPlayers,
  getDashboardExpenses,
  getDashboardAll,
  fixExistingContracts
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
 * 📋 GET /api/contracts/:id/amendments
 * Ottieni emendamenti di un contratto
 */
router.get('/:id/amendments', requirePermission('contracts:read'), getContractAmendments);

/**
 * 🔍 GET /api/contracts/overlaps/:playerId
 * Verifica contratti sovrapposti per un giocatore
 */
router.get('/overlaps/:playerId', requirePermission('contracts:read'), checkContractOverlaps);

/**
 * 📚 GET /api/contracts/history/:playerId
 * Ottieni storia completa dei contratti di un giocatore
 */
router.get('/history/:playerId', requirePermission('contracts:read'), getPlayerContractHistory);

// Dashboard contratti
router.get('/dashboard/kpis', requirePermission('contracts:read'), getDashboardKPIs);
router.get('/dashboard/trends', requirePermission('contracts:read'), getDashboardTrends);
router.get('/dashboard/distributions', requirePermission('contracts:read'), getDashboardDistributions);
router.get('/dashboard/expiring', requirePermission('contracts:read'), getDashboardExpiring);
router.get('/dashboard/top-players', requirePermission('contracts:read'), getDashboardTopPlayers);
router.get('/dashboard/expenses', requirePermission('contracts:read'), getDashboardExpenses);

// Dashboard ottimizzata (tutti i dati in una chiamata)
router.get('/dashboard/all', requirePermission('contracts:read'), getDashboardAll);

/**
 * ➕ POST /api/contracts
 * Crea nuovo contratto
 */
router.post('/', requirePermission('contracts:write'), createContract);

/**
 * ✏️ PUT /api/contracts/:id
 * Aggiorna contratto esistente
 * Body: { ..., isOfficialRenewal: true/false }
 */
router.put('/:id', requirePermission('contracts:write'), updateContract);

/**
 * 📝 POST /api/contracts/:id/amendments
 * Crea emendamento manuale per un contratto
 */
router.post('/:id/amendments', requirePermission('contracts:write'), createContractAmendment);

/**
 * 🔄 POST /api/contracts/:id/renew
 * Rinnova contratto (crea nuovo contratto e chiude quello vecchio)
 */
router.post('/:id/renew', requirePermission('contracts:write'), renewContract);

/**
 * 🗑️ DELETE /api/contracts/:id
 * Elimina contratto
 */
router.delete('/:id', requirePermission('contracts:write'), deleteContract);

/**
 * 🔧 POST /api/contracts/fix-existing
 * Corregge i dati esistenti nel database (endpoint temporaneo)
 */
router.post('/fix-existing', requirePermission('contracts:write'), fixExistingContracts);

module.exports = router;
