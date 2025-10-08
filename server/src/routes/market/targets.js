// server/src/routes/market/targets.js
// Routes per la gestione dei target di mercato

const express = require('express');
const targetsController = require('../../controllers/market/targetsController');

const router = express.Router();

/**
 * GET /api/market/targets
 * Query params: search, status, priority, position, agentId
 */
router.get('/', targetsController.getAllTargets);

/**
 * GET /api/market/targets/:id
 * Ottieni dettaglio completo di un target
 */
router.get('/:id', targetsController.getTargetById);

/**
 * POST /api/market/targets
 * Crea un nuovo target
 */
router.post('/', targetsController.createTarget);

/**
 * PUT /api/market/targets/:id
 * Aggiorna un target esistente
 */
router.put('/:id', targetsController.updateTarget);

/**
 * DELETE /api/market/targets/:id
 * Elimina (soft delete) un target
 */
router.delete('/:id', targetsController.deleteTarget);

/**
 * POST /api/market/targets/:id/convert-to-player
 * Converti un target in Player
 */
router.post('/:id/convert-to-player', targetsController.convertToPlayer);

module.exports = router;
