/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Prospects Routes
 * ===============================================================
 */

const express = require('express');
const prospectController = require('../controllers/prospect.controller');
const eventLogController = require('../controllers/eventLog.controller');

const router = express.Router();

/**
 * GET /api/scouting/prospects
 * Lista prospect con filtri e paginazione
 */
router.get('/', prospectController.getAllProspects);

/**
 * POST /api/scouting/prospects
 * Crea nuovo prospect
 */
router.post('/', prospectController.createProspect);

/**
 * GET /api/scouting/prospects/:id
 * Dettaglio singolo prospect
 */
router.get('/:id', prospectController.getProspectById);

/**
 * PUT /api/scouting/prospects/:id
 * Aggiorna prospect
 */
router.put('/:id', prospectController.updateProspect);

/**
 * DELETE /api/scouting/prospects/:id
 * Elimina prospect
 */
router.delete('/:id', prospectController.deleteProspect);

/**
 * POST /api/scouting/prospects/:id/promote
 * Promuove prospect a market target
 * (Solo DIRECTOR_SPORT o ADMIN)
 */
router.post('/:id/promote', prospectController.promoteProspect);

/**
 * GET /api/scouting/prospects/:id/events
 * Recupera eventi/cronologia per un prospect
 */
router.get('/:id/events', eventLogController.getEventsByProspect);

module.exports = router;

