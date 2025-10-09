const { z } = require('zod');

const playerMediaSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO', 'DOCUMENT']).optional(),
  url: z.string().url('URL non valido'),
  title: z.string().optional(),
});

/**
 * Validatore per i media dei giocatori
 */
const validatePlayerMedia = (req, res, next) => {
  try {
    playerMediaSchema.parse(req.body);
    next();
  } catch (err) {
    res.status(400).json({ error: err.errors?.[0]?.message || 'Dati media non validi' });
  }
};

module.exports = {
  validatePlayerMedia
};
