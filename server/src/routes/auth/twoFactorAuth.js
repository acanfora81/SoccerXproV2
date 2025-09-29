/**
 * Routes per Two-Factor Authentication
 */

const express = require('express');
const router = express.Router();
const twoFactorAuthController = require('../../controllers/twoFactorAuth');
const { authenticate } = require('../../middleware/auth');

// Log di caricamento del router 2FA
console.log('🟢 [INFO] Caricamento route 2FA...');

// Tutte le rotte richiedono autenticazione
router.use(authenticate);

// Endpoint di test rapido
router.get('/ping', (req, res) => {
  res.json({ ok: true, route: '/api/auth/2fa/ping' });
});

/**
 * GET /api/auth/2fa/status
 * Ottiene lo stato 2FA dell'utente corrente
 */
router.get('/status', twoFactorAuthController.getStatus);

/**
 * POST /api/auth/2fa/enroll
 * Inizia il processo di setup 2FA
 */
router.post('/enroll', (req, res, next) => { console.log('🔵 [2FA] POST /enroll'); next(); }, twoFactorAuthController.enroll);

/**
 * POST /api/auth/2fa/verify-setup
 * Verifica il setup 2FA e lo abilita
 */
router.post('/verify-setup', (req, res, next) => { console.log('🔵 [2FA] POST /verify-setup'); next(); }, twoFactorAuthController.verifySetup);

/**
 * POST /api/auth/2fa/verify
 * Verifica un token 2FA per operazioni sensibili
 */
router.post('/verify', (req, res, next) => { console.log('🔵 [2FA] POST /verify'); next(); }, twoFactorAuthController.verify);

/**
 * POST /api/auth/2fa/disable
 * Disabilita 2FA per l'utente
 */
router.post('/disable', (req, res, next) => { console.log('🔵 [2FA] POST /disable'); next(); }, twoFactorAuthController.disable);

/**
 * POST /api/auth/2fa/backup-codes
 * Genera nuovi codici di backup
 */
router.post('/backup-codes', (req, res, next) => { console.log('🔵 [2FA] POST /backup-codes'); next(); }, twoFactorAuthController.generateBackupCodes);

module.exports = router;
