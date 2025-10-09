/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Reports Routes
 * ===============================================================
 */

const express = require('express');
const reportController = require('../controllers/report.controller');

const router = express.Router();

/**
 * GET /api/scouting/reports
 * Lista report con filtri
 */
router.get('/', reportController.getAllReports);

/**
 * POST /api/scouting/reports
 * Crea nuovo report
 */
router.post('/', reportController.createReport);

/**
 * GET /api/scouting/reports/:id
 * Dettaglio singolo report
 */
router.get('/:id', reportController.getReportById);

/**
 * PUT /api/scouting/reports/:id
 * Aggiorna report
 */
router.put('/:id', reportController.updateReport);

/**
 * DELETE /api/scouting/reports/:id
 * Elimina report
 */
router.delete('/:id', reportController.deleteReport);

module.exports = router;

