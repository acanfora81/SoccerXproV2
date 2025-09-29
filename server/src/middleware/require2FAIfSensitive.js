const twoFactorAuthService = require('../services/twoFactorAuthService');

module.exports = async function require2FAIfSensitive(req, res, next) {
  console.log(`[2FA] ${req.method} ${req.path} - need2FA check`);
  
  const need2FA = String(process.env.MEDICAL_REQUIRE_2FA || 'true') === 'true';
  console.log(`[2FA] need2FA: ${need2FA}, method: ${req.method}`);
  
  if (!need2FA || req.method === 'GET') {
    console.log(`[2FA] Skipping 2FA check - need2FA: ${need2FA}, method: ${req.method}`);
    return next();
  }
  
  const token = req.headers['x-2fa-code'] || req.headers['x-2fa-token'];
  console.log(`[2FA] Token present: ${!!token}, length: ${token ? String(token).length : 0}`);
  
  if (!token || String(token).length < 6) {
    console.log(`[2FA] Returning 428 - no valid token`);
    return res.status(428).json({ 
      success: false, 
      error: '2FA richiesta',
      message: 'Per questa operazione è richiesta l\'autenticazione a due fattori'
    });
  }

  try {
    // Verifica se l'utente ha 2FA configurato
    const userId = req.user?.profileId; // Usa l'ID del profilo (int) per lookup DB
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Utente non autenticato' 
      });
    }

    const status = await twoFactorAuthService.getTwoFactorStatus(userId);
    if (!status.enabled) {
      return res.status(428).json({ 
        success: false, 
        error: '2FA non configurato',
        message: 'Devi prima configurare l\'autenticazione a due fattori'
      });
    }

    // Verifica il token
    const result = await twoFactorAuthService.verifyTwoFactorToken(userId, token);
    if (!result.valid) {
      return res.status(428).json({ 
        success: false, 
        error: 'Token 2FA non valido' 
      });
    }

    // Token valido, procedi
    next();
  } catch (error) {
    console.error('Errore nella verifica 2FA:', error);
    return res.status(428).json({ 
      success: false, 
      error: 'Errore nella verifica 2FA' 
    });
  }
};


