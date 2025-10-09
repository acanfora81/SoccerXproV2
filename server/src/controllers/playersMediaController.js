const { uploadPlayerMediaFile, getPlayerMediaList } = require('../services/playersMediaService');

/**
 * Carica media per un giocatore
 * POST /api/players/media/:playerId
 */
const uploadPlayerMedia = async (req, res) => {
  try {
    const { playerId } = req.params;
    const userId = req.user?.id;
    const { type, url, title } = req.body;

    const media = await uploadPlayerMediaFile({ playerId, userId, type, url, title });
    res.status(201).json(media);
  } catch (err) {
    console.error('[uploadPlayerMedia]', err);
    res.status(500).json({ error: 'Errore nel caricamento del media' });
  }
};

/**
 * Ottieni tutti i media di un giocatore
 * GET /api/players/media/:playerId
 */
const getPlayerMedia = async (req, res) => {
  try {
    const { playerId } = req.params;
    const media = await getPlayerMediaList({ playerId });
    res.json(media);
  } catch (err) {
    console.error('[getPlayerMedia]', err);
    res.status(500).json({ error: 'Errore nel recupero media' });
  }
};

module.exports = {
  uploadPlayerMedia,
  getPlayerMedia
};
