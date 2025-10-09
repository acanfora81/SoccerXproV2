const playersNotesService = require('../services/playersNotesService');

/**
 * Crea una nuova nota per un giocatore
 * POST /api/players/notes/:playerId
 */
const createNote = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { content, type, visibility } = req.body;
    const userId = req.user.id;

    const note = await playersNotesService.createNote({
      playerId: parseInt(playerId),
      userId,
      content,
      type,
      visibility
    });

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('[playersNotesController] Error creating note:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante la creazione della nota'
    });
  }
};

/**
 * Ottieni tutte le note di un giocatore
 * GET /api/players/notes/:playerId
 */
const getNotesByPlayer = async (req, res) => {
  try {
    const { playerId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const notes = await playersNotesService.getNotesByPlayer({
      playerId: parseInt(playerId),
      userId,
      userRole
    });

    res.status(200).json({
      success: true,
      data: notes
    });
  } catch (error) {
    console.error('[playersNotesController] Error getting notes:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante il recupero delle note'
    });
  }
};

module.exports = {
  createNote,
  getNotesByPlayer
};

