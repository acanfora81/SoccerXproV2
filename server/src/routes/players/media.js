const express = require('express');
const { uploadPlayerMedia, getPlayerMedia } = require('../../controllers/playersMediaController');
const { validatePlayerMedia } = require('../../validation/playersMediaValidator');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// POST /api/players/media/:playerId - Carica media per un giocatore
router.post('/:playerId', authenticate, validatePlayerMedia, uploadPlayerMedia);

// GET /api/players/media/:playerId - Ottieni tutti i media di un giocatore
router.get('/:playerId', authenticate, getPlayerMedia);

module.exports = router;

