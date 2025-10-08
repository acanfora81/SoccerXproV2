// server/src/controllers/market/budgetsController.js
// Controller per la gestione dei budget di mercato

const budgetsService = require('../../services/market/budgetsService');

/**
 * GET /api/market/budgets
 * Ottieni tutti i budget del team
 */
const getAllBudgets = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.getAll(teamId, req.query);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:getAllBudgets] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/budgets/:id
 * Ottieni un budget specifico
 */
const getBudgetById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.getById(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:getBudgetById] Error:', err);
    const statusCode = err.message === 'Budget not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/budgets
 * Crea un nuovo budget
 */
const createBudget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.create(teamId, userId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:createBudget] Error:', err);
    const statusCode = err.message.includes('già esistente') ? 409 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/market/budgets/:id
 * Aggiorna un budget esistente
 */
const updateBudget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.update(req.params.id, teamId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:updateBudget] Error:', err);
    const statusCode = err.message === 'Budget not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/market/budgets/:id
 * Elimina definitivamente un budget
 */
const deleteBudget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.remove(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:deleteBudget] Error:', err);
    const statusCode = err.message === 'Budget not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/budgets/:id/spent
 * Calcola il totale speso per un budget
 */
const calculateSpent = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.calculateSpent(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:calculateSpent] Error:', err);
    const statusCode = err.message === 'Budget not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/budgets/:id/remaining
 * Calcola il budget rimanente
 */
const calculateRemaining = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await budgetsService.calculateRemaining(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[budgetsController:calculateRemaining] Error:', err);
    const statusCode = err.message === 'Budget not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  calculateSpent,
  calculateRemaining,
};

