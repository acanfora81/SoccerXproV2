const express = require('express');
const { createNote, getNotesByPlayer } = require('../../controllers/playersNotesController');
const { validatePlayerNote } = require('../../validation/playersNotesValidator');
const { authenticate } = require('../../middleware/auth');

const router = express.Router();

// POST /api/players/notes/:playerId - Crea una nuova nota per un giocatore
router.post('/:playerId', authenticate, validatePlayerNote, createNote);

// GET /api/players/notes/:playerId - Ottieni tutte le note di un giocatore
router.get('/:playerId', authenticate, getNotesByPlayer);

module.exports = router;

