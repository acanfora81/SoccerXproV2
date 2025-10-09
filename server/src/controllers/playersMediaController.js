const playersMediaService = require('../services/playersMediaService');

/**
 * Carica media per un giocatore
 * POST /api/players/media/:playerId
 */
const uploadPlayerMedia = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { type, url, title, description } = req.body;
    const userId = req.user.id;

    const media = await playersMediaService.uploadMedia({
      playerId: parseInt(playerId),
      userId,
      type,
      url,
      title,
      description
    });

    res.status(201).json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('[playersMediaController] Error uploading media:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante il caricamento del media'
    });
  }
};

/**
 * Ottieni tutti i media di un giocatore
 * GET /api/players/media/:playerId
 */
const getPlayerMedia = async (req, res) => {
  try {
    const { playerId } = req.params;

    const media = await playersMediaService.getMediaByPlayer({
      playerId: parseInt(playerId)
    });

    res.status(200).json({
      success: true,
      data: media
    });
  } catch (error) {
    console.error('[playersMediaController] Error getting media:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore durante il recupero dei media'
    });
  }
};

module.exports = {
  uploadPlayerMedia,
  getPlayerMedia
};

