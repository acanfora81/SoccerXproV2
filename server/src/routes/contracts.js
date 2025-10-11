// server/src/routes/contracts.js
const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
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
} = require('../controllers/contracts'); // ✅ import corretto

/**
 * 🏥 GET /api/contracts/health
 * Health check per verificare se il modulo contratti è attivo
 * (NON richiede autenticazione)
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Contracts module is active',
    timestamp: new Date().toISOString()
  });
});

/**
 * 📋 GET /api/contracts/player/:playerId
 * Ottiene tutti i contratti associati a un giocatore
 */
router.get('/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;

    if (!playerId) {
      return res.status(400).json({ success: false, error: 'playerId mancante' });
    }

    const prisma = getPrismaClient();
    const contracts = await prisma.contracts.findMany({
      where: { playerId: Number(playerId) },
    });

    res.json({ success: true, data: contracts });
  } catch (error) {
    console.error('Errore caricamento contratti:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Middleware di autenticazione e tenant context per tutte le altre route
router.use(authenticate);
router.use(tenantContext);

// ✅ Rotte ufficiali del modulo
router.get('/', getContracts);
router.get('/:id', getContract);
router.post('/', createContract);
router.put('/:id', updateContract);
router.delete('/:id', deleteContract);

// ✅ Rotte dashboard
router.get('/dashboard/all', getDashboardAll);
router.get('/dashboard/kpis', getDashboardKPIs);
router.get('/dashboard/trends', getDashboardTrends);
router.get('/dashboard/distributions', getDashboardDistributions);
router.get('/dashboard/expiring', getDashboardExpiring);
router.get('/dashboard/top-players', getDashboardTopPlayers);
router.get('/dashboard/expenses', getDashboardExpenses);

// Export router
module.exports = router;
