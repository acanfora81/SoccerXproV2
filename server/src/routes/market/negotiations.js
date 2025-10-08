// server/src/routes/market/negotiations.js
// Routes per la gestione delle trattative di mercato

const express = require('express');
const negotiationsController = require('../../controllers/market/negotiationsController');

const router = express.Router();

/**
 * GET /api/market/negotiations
 * Query params: search, status, stage, targetId, agentId
 */
router.get('/', negotiationsController.getAllNegotiations);

/**
 * GET /api/market/negotiations/:id
 * Ottieni dettaglio completo di una trattativa
 */
router.get('/:id', negotiationsController.getNegotiationById);

/**
 * POST /api/market/negotiations
 * Crea una nuova trattativa
 */
router.post('/', negotiationsController.createNegotiation);

/**
 * PUT /api/market/negotiations/:id
 * Aggiorna una trattativa esistente
 */
router.put('/:id', negotiationsController.updateNegotiation);

/**
 * DELETE /api/market/negotiations/:id
 * Elimina (soft delete) una trattativa
 */
router.delete('/:id', negotiationsController.deleteNegotiation);

/**
 * POST /api/market/negotiations/:id/close
 * Chiudi una trattativa
 */
router.post('/:id/close', negotiationsController.closeNegotiation);

/**
 * POST /api/market/negotiations/:id/convert-to-player
 * Converti una trattativa in Player
 */
router.post('/:id/convert-to-player', negotiationsController.convertToPlayer);

/**
 * PUT /api/market/negotiations/:id/stage
 * Aggiorna lo stage di una trattativa
 */
router.put('/:id/stage', negotiationsController.updateStage);

/**
 * GET /api/market/negotiations/:id/budget-impact
 * Calcola l'impatto sul budget
 */
router.get('/:id/budget-impact', negotiationsController.calculateBudgetImpact);

module.exports = router;
