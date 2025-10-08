// server/src/routes/market/offers.js
// Routes per la gestione delle offerte di mercato

const express = require('express');
const offersController = require('../../controllers/market/offersController');

const router = express.Router();

/**
 * GET /api/market/offers
 * Query params: search, status, direction, negotiationId, agentId
 */
router.get('/', offersController.getAllOffers);

/**
 * GET /api/market/offers/:id
 * Ottieni dettaglio completo di un'offerta
 */
router.get('/:id', offersController.getOfferById);

/**
 * POST /api/market/offers
 * Crea una nuova offerta
 */
router.post('/', offersController.createOffer);

/**
 * PUT /api/market/offers/:id
 * Aggiorna un'offerta esistente
 */
router.put('/:id', offersController.updateOffer);

/**
 * DELETE /api/market/offers/:id
 * Elimina definitivamente un'offerta
 */
router.delete('/:id', offersController.deleteOffer);

/**
 * POST /api/market/offers/:id/accept
 * Accetta un'offerta
 */
router.post('/:id/accept', offersController.acceptOffer);

/**
 * POST /api/market/offers/:id/reject
 * Rifiuta un'offerta
 */
router.post('/:id/reject', offersController.rejectOffer);

module.exports = router;
