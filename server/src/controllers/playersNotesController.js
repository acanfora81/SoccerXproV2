const { createPlayerNote, getNotesByPlayer } = require('../services/playersNotesService');

/**
 * Crea una nuova nota per un giocatore
 * POST /api/players/notes/:playerId
 */
const createNote = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;
    const teamId = req.user?.teamId;

    const note = await createPlayerNote({ playerId, userId, teamId, title, content });
    res.status(201).json(note);
  } catch (err) {
    console.error('[createNote]', err);
    res.status(500).json({ error: 'Errore nella creazione della nota' });
  }
};

/**
 * Ottieni tutte le note di un giocatore
 * GET /api/players/notes/:playerId
 */
const getNotesByPlayerHandler = async (req, res) => {
  try {
    const { playerId } = req.params;
    const teamId = req.user?.teamId;
    const notes = await getNotesByPlayer({ playerId, teamId });
    res.json(notes);
  } catch (err) {
    console.error('[getNotesByPlayer]', err);
    res.status(500).json({ error: 'Errore nel recupero note giocatore' });
  }
};

module.exports = {
  createNote,
  getNotesByPlayer: getNotesByPlayerHandler
};
