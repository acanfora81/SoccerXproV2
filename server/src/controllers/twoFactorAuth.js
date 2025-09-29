/**
 * Controller per la gestione Two-Factor Authentication
 */

const twoFactorAuthService = require('../services/twoFactorAuthService');

/**
 * GET /api/auth/2fa/status
 * Ottiene lo stato 2FA dell'utente corrente
 */
async function getStatus(req, res) {
  try {
    if (!req.user || !req.user.profileId) {
      console.error('❌ getStatus: req.user.profileId mancante');
      return res.status(401).json({ 
        success: false, 
        error: 'Autenticazione richiesta' 
      });
    }
    
    const userId = req.user.profileId; // ID intero di UserProfile (non UUID Supabase)
    console.log('✅ getStatus: userId =', userId, typeof userId);
    
    const status = await twoFactorAuthService.getTwoFactorStatus(userId);
    
    res.json(status);
  } catch (error) {
    console.error('Errore nel recupero stato 2FA:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server' 
    });
  }
}

/**
 * POST /api/auth/2fa/enroll
 * Inizia il processo di setup 2FA
 */
async function enroll(req, res) {
  try {
    if (!req.user || !req.user.profileId) {
      return res.status(401).json({ 
        success: false, 
        error: 'Autenticazione richiesta' 
      });
    }
    
    const userId = req.user.profileId; // ID intero di UserProfile (non UUID Supabase)
    const userEmail = req.user.email;
    
    const result = await twoFactorAuthService.enrollTwoFactor(userId, userEmail);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Errore nel setup 2FA:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Errore nella configurazione 2FA' 
    });
  }
}

/**
 * POST /api/auth/2fa/verify-setup
 * Verifica il setup 2FA e lo abilita
 */
async function verifySetup(req, res) {
  try {
    const userId = req.user.profileId; // ID intero di UserProfile (non UUID Supabase)
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Token deve essere di 6 cifre'
      });
    }
    
    const result = await twoFactorAuthService.verifyTwoFactorSetup(userId, token);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Errore nella verifica setup 2FA:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Token non valido' 
    });
  }
}

/**
 * POST /api/auth/2fa/verify
 * Verifica un token 2FA per operazioni sensibili
 */
async function verify(req, res) {
  try {
    const userId = req.user.profileId; // ID intero di UserProfile (non UUID Supabase)
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Token deve essere di 6 cifre'
      });
    }
    
    const result = await twoFactorAuthService.verifyTwoFactorToken(userId, token);
    
    res.json({
      success: true,
      valid: result.valid,
      usedBackupCode: result.usedBackupCode
    });
  } catch (error) {
    console.error('Errore nella verifica token 2FA:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Token non valido' 
    });
  }
}

/**
 * POST /api/auth/2fa/disable
 * Disabilita 2FA per l'utente
 */
async function disable(req, res) {
  try {
    const userId = req.user.profileId; // ID intero di UserProfile (non UUID Supabase)
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Token deve essere di 6 cifre'
      });
    }
    
    const result = await twoFactorAuthService.disableTwoFactor(userId, token);
    
    res.json({
      success: true,
      message: '2FA disabilitato con successo'
    });
  } catch (error) {
    console.error('Errore nella disabilitazione 2FA:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Errore nella disabilitazione 2FA' 
    });
  }
}

/**
 * POST /api/auth/2fa/backup-codes
 * Genera nuovi codici di backup
 */
async function generateBackupCodes(req, res) {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'Token deve essere di 6 cifre'
      });
    }
    
    const result = await twoFactorAuthService.generateNewBackupCodes(userId, token);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Errore nella generazione backup codes:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Errore nella generazione dei codici di backup' 
    });
  }
}

module.exports = {
  getStatus,
  enroll,
  verifySetup,
  verify,
  disable,
  generateBackupCodes
};
