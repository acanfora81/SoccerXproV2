/**
 * Validatore per i media dei giocatori
 */
const validatePlayerMedia = (req, res, next) => {
  const { type, url, title } = req.body;

  // Validazione type (obbligatorio)
  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'Il tipo di media è obbligatorio'
    });
  }

  const validTypes = ['IMAGE', 'VIDEO', 'DOCUMENT', 'HIGHLIGHT'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Tipo di media non valido. Valori ammessi: ${validTypes.join(', ')}`
    });
  }

  // Validazione url (obbligatorio)
  if (!url || typeof url !== 'string' || url.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'L\'URL del media è obbligatorio'
    });
  }

  // Validazione URL format (basic)
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: 'L\'URL fornito non è valido'
    });
  }

  // Validazione title (opzionale ma con limite)
  if (title && title.length > 255) {
    return res.status(400).json({
      success: false,
      error: 'Il titolo non può superare i 255 caratteri'
    });
  }

  next();
};

module.exports = {
  validatePlayerMedia
};

