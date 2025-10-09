/**
 * Validatore per le note dei giocatori
 */
const validatePlayerNote = (req, res, next) => {
  const { content, type, visibility } = req.body;

  // Validazione content (obbligatorio)
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Il contenuto della nota è obbligatorio'
    });
  }

  if (content.length > 5000) {
    return res.status(400).json({
      success: false,
      error: 'Il contenuto della nota non può superare i 5000 caratteri'
    });
  }

  // Validazione type (opzionale)
  if (type) {
    const validTypes = ['GENERAL', 'TECHNICAL', 'TACTICAL', 'MEDICAL', 'PERSONAL'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: `Tipo di nota non valido. Valori ammessi: ${validTypes.join(', ')}`
      });
    }
  }

  // Validazione visibility (opzionale)
  if (visibility) {
    const validVisibility = ['PRIVATE', 'TEAM', 'PUBLIC'];
    if (!validVisibility.includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: `Visibilità non valida. Valori ammessi: ${validVisibility.join(', ')}`
      });
    }
  }

  next();
};

module.exports = {
  validatePlayerNote
};

