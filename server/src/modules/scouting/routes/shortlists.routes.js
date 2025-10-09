/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Shortlists Routes
 * ===============================================================
 */

const express = require('express');
const shortlistController = require('../controllers/shortlist.controller');

const router = express.Router();

/**
 * GET /api/scouting/shortlists
 * Lista shortlist con filtri
 */
router.get('/', shortlistController.getAllShortlists);

/**
 * POST /api/scouting/shortlists
 * Crea nuova shortlist
 */
router.post('/', shortlistController.createShortlist);

/**
 * GET /api/scouting/shortlists/:id
 * Dettaglio singola shortlist con items
 */
router.get('/:id', shortlistController.getShortlistById);

/**
 * PUT /api/scouting/shortlists/:id
 * Aggiorna shortlist
 */
router.put('/:id', shortlistController.updateShortlist);

/**
 * DELETE /api/scouting/shortlists/:id
 * Elimina shortlist
 */
router.delete('/:id', shortlistController.deleteShortlist);

/**
 * POST /api/scouting/shortlists/:id/items
 * Aggiungi prospect a shortlist
 */
router.post('/:id/items', shortlistController.addItemToShortlist);

/**
 * DELETE /api/scouting/shortlists/items/:itemId
 * Rimuovi prospect da shortlist
 */
router.delete('/items/:itemId', shortlistController.removeItemFromShortlist);

module.exports = router;

