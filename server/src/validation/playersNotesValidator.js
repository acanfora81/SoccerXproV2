const { z } = require('zod');

const playerNoteSchema = z.object({
  title: z.string().min(2, 'Titolo troppo corto'),
  content: z.string().min(3, 'Contenuto obbligatorio'),
});

/**
 * Validatore per le note dei giocatori
 */
const validatePlayerNote = (req, res, next) => {
  try {
    playerNoteSchema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: err.errors?.[0]?.message || 'Dati non validi' });
  }
};

module.exports = {
  validatePlayerNote
};
