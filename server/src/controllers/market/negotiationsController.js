// server/src/controllers/market/negotiationsController.js
// Controller per la gestione delle trattative di mercato

const negotiationsService = require('../../services/market/negotiationsService');

/**
 * GET /api/market/negotiations
 * Ottieni tutte le trattative del team
 */
const getAllNegotiations = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.getAll(teamId, req.query);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:getAllNegotiations] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/negotiations/:id
 * Ottieni una trattativa specifica con dettagli completi
 */
const getNegotiationById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.getById(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:getNegotiationById] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/negotiations
 * Crea una nuova trattativa
 */
const createNegotiation = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.create(teamId, userId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:createNegotiation] Error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/market/negotiations/:id
 * Aggiorna una trattativa esistente
 */
const updateNegotiation = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.update(req.params.id, teamId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:updateNegotiation] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/negotiations/:id/close
 * Chiudi una trattativa
 */
const closeNegotiation = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.close(req.params.id, teamId, userId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:closeNegotiation] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/market/negotiations/:id
 * Elimina (soft delete) una trattativa
 */
const deleteNegotiation = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.remove(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:deleteNegotiation] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/negotiations/:id/convert-to-player
 * Converti una trattativa in Player
 */
const convertToPlayer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.convertToPlayer(req.params.id, teamId, userId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:convertToPlayer] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/market/negotiations/:id/stage
 * Aggiorna lo stage di una trattativa
 */
const updateStage = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const { stage } = req.body;
    if (!stage) {
      return res.status(400).json({ success: false, error: 'Stage is required' });
    }

    const data = await negotiationsService.updateStage(req.params.id, teamId, stage);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:updateStage] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/negotiations/:id/budget-impact
 * Calcola l'impatto sul budget di una trattativa
 */
const calculateBudgetImpact = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await negotiationsService.calculateBudgetImpact(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[negotiationsController:calculateBudgetImpact] Error:', err);
    const statusCode = err.message === 'Negotiation not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllNegotiations,
  getNegotiationById,
  createNegotiation,
  updateNegotiation,
  closeNegotiation,
  deleteNegotiation,
  convertToPlayer,
  updateStage,
  calculateBudgetImpact,
};

