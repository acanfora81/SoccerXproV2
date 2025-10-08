// server/src/routes/market/budgets.js
// Routes per la gestione dei budget di mercato

const express = require('express');
const budgetsController = require('../../controllers/market/budgetsController');

const router = express.Router();

/**
 * GET /api/market/budgets
 * Query params: season_label, type
 */
router.get('/', budgetsController.getAllBudgets);

/**
 * GET /api/market/budgets/:id
 * Ottieni dettaglio di un budget specifico
 */
router.get('/:id', budgetsController.getBudgetById);

/**
 * POST /api/market/budgets
 * Crea un nuovo budget
 */
router.post('/', budgetsController.createBudget);

/**
 * PUT /api/market/budgets/:id
 * Aggiorna un budget esistente
 */
router.put('/:id', budgetsController.updateBudget);

/**
 * DELETE /api/market/budgets/:id
 * Elimina definitivamente un budget
 */
router.delete('/:id', budgetsController.deleteBudget);

/**
 * GET /api/market/budgets/:id/spent
 * Calcola il totale speso per un budget
 */
router.get('/:id/spent', budgetsController.calculateSpent);

/**
 * GET /api/market/budgets/:id/remaining
 * Calcola il budget rimanente
 */
router.get('/:id/remaining', budgetsController.calculateRemaining);

module.exports = router;

