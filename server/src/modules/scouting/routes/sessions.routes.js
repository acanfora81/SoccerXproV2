/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Sessions Routes
 * ===============================================================
 */

const express = require('express');
const sessionController = require('../controllers/session.controller');

const router = express.Router();

/**
 * GET /api/scouting/sessions
 * Lista sessioni con filtri base
 */
router.get('/', sessionController.listSessions);

/**
 * POST /api/scouting/sessions
 * Crea una nuova sessione
 */
router.post('/', sessionController.createSession);

/**
 * GET /api/scouting/sessions/:id/formations
 * Recupera tutte le formazioni di una sessione
 */
router.get('/:id/formations', sessionController.getFormations);

/**
 * GET /api/scouting/sessions/:id
 * Ottieni una sessione specifica
 */
router.get('/:id', sessionController.getSessionById);

/**
 * PUT /api/scouting/sessions/:id
 * Aggiorna una sessione esistente
 */
router.put('/:id', sessionController.updateSession);

/**
 * DELETE /api/scouting/sessions/:id
 * Elimina una sessione
 */
router.delete('/:id', sessionController.deleteSession);

/**
 * POST /api/scouting/sessions/:id/formation
 * Crea o sostituisce la formazione per una sessione (teamSide)
 */
router.post('/:id/formation', sessionController.upsertFormation);

module.exports = router;




