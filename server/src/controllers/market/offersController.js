// server/src/controllers/market/offersController.js
// Controller per la gestione delle offerte di mercato

const offersService = require('../../services/market/offersService');

/**
 * GET /api/market/offers
 * Ottieni tutte le offerte del team
 */
const getAllOffers = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.getAll(teamId, req.query);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:getAllOffers] Error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /api/market/offers/:id
 * Ottieni un'offerta specifica con dettagli completi
 */
const getOfferById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.getById(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:getOfferById] Error:', err);
    const statusCode = err.message === 'Offer not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/offers
 * Crea una nuova offerta
 */
const createOffer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.id;

    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.create(teamId, userId, req.body);
    return res.status(201).json({ success: true, data });
  } catch (err) {
    console.error('[offersController:createOffer] Error:', err);
    const statusCode = err.message.includes('not found') ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * PUT /api/market/offers/:id
 * Aggiorna un'offerta esistente
 */
const updateOffer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.update(req.params.id, teamId, req.body);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:updateOffer] Error:', err);
    const statusCode = err.message === 'Offer not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * DELETE /api/market/offers/:id
 * Elimina definitivamente un'offerta
 */
const deleteOffer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.remove(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:deleteOffer] Error:', err);
    const statusCode = err.message === 'Offer not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/offers/:id/accept
 * Accetta un'offerta
 */
const acceptOffer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.accept(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:acceptOffer] Error:', err);
    const statusCode = err.message === 'Offer not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

/**
 * POST /api/market/offers/:id/reject
 * Rifiuta un'offerta
 */
const rejectOffer = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const data = await offersService.reject(req.params.id, teamId);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[offersController:rejectOffer] Error:', err);
    const statusCode = err.message === 'Offer not found' ? 404 : 500;
    return res.status(statusCode).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAllOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer,
  acceptOffer,
  rejectOffer,
};

