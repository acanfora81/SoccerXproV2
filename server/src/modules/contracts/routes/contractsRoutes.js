// Percorso: server/src/modules/contracts/routes/contractsRoutes.js
const express = require('express');
const {
  getContracts: listContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  linkContractToPlayer,
  unlinkContractFromPlayer,
  getContractStats,
  getDashboardKPIs,
  getDashboardTrends,
  getDashboardDistributions,
  getDashboardExpiring,
  getDashboardTopPlayers,
  getDashboardExpenses,
  getDashboardAll
} = require('../controllers/contractsController');
const { validateContract } = require('../validators/contractsValidator');
const { authenticate } = require('../../../middleware/auth');
const tenant = require('../../../middleware/tenantContext');
const { requireModuleAccess } = require('../../../utils/permissions');

const router = express.Router();

// rotta pubblica di diagnostica per verificare il montaggio
router.get('/_ping', (req, res) => res.json({ ok: true, module: 'contracts' }));

// rotta pubblica health check (richiesta da PlayerCreateDialog)
router.get('/health', (req, res) => res.json({ ok: true, available: true }));

// Middleware per tutte le rotte protette
const protectedMiddleware = [authenticate, tenant, requireModuleAccess('contracts')];

// Dashboard routes
router.get('/dashboard/all', protectedMiddleware, getDashboardAll);
router.get('/dashboard/kpis', protectedMiddleware, getDashboardKPIs);
router.get('/dashboard/trends', protectedMiddleware, getDashboardTrends);
router.get('/dashboard/distributions', protectedMiddleware, getDashboardDistributions);
router.get('/dashboard/expiring', protectedMiddleware, getDashboardExpiring);
router.get('/dashboard/top-players', protectedMiddleware, getDashboardTopPlayers);
router.get('/dashboard/expenses', protectedMiddleware, getDashboardExpenses);

// Stats route
router.get('/stats', protectedMiddleware, getContractStats);

// CRUD contratti
router.get('/', protectedMiddleware, listContracts);
router.get('/:id', protectedMiddleware, getContract);
router.post('/', protectedMiddleware, validateContract, createContract);
router.put('/:id', protectedMiddleware, validateContract, updateContract);
router.delete('/:id', protectedMiddleware, deleteContract);

// Link/unlink contratto ↔ giocatore
router.post('/link', protectedMiddleware, linkContractToPlayer);
router.delete('/link/:playerId', protectedMiddleware, unlinkContractFromPlayer);

module.exports = router;


