// server/src/controllers/market/targetsController.js
// Controller per la gestione dei target di mercato

const targetsService = require('../../services/market/targetsService');

/**
 * GET /api/market/targets
 * Ottieni tutti i target del team
 */
const getAllTargets = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.getAll(teamId, req.query);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:getAllTargets] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/targets/:id
 * Ottieni un target specifico con dettagli completi
 */
const getTargetById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.getById(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:getTargetById] Error:', err);
    const statusCode = err.message === 'Target not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/targets
 * Crea un nuovo target
 */
const createTarget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.create(teamId, userId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:createTarget] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/market/targets/:id
 * Aggiorna un target esistente
 */
const updateTarget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.update(req.params.id, teamId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:updateTarget] Error:', err);
    const statusCode = err.message === 'Target not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/market/targets/:id
 * Elimina (soft delete) un target
 */
const deleteTarget = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.remove(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:deleteTarget] Error:', err);
    const statusCode = err.message === 'Target not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/targets/:id/convert-to-player
 * Converti un target in Player
 */
const convertToPlayer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await targetsService.convertToPlayer(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[targetsController:convertToPlayer] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllTargets,
  getTargetById,
  createTarget,
  updateTarget,
  deleteTarget,
  convertToPlayer,
};

