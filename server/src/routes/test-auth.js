// 🧪 server/src/routes/test-auth.js
// Route di test per verificare middleware autenticazione

const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireRole, requirePermission, ROLES, PERMISSIONS } = require('../utils/permissions');

const router = express.Router();

console.log('🟢 Caricamento route test auth...'); // INFO - rimuovere in produzione

/**
 * 🔐 Test endpoint protetto (richiede autenticazione)
 */
router.get('/protected', authenticate, (req, res) => {
  console.log('🟢 Accesso endpoint protetto autorizzato'); // INFO - rimuovere in produzione
  
  res.json({
    message: 'Accesso autorizzato!',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      theme: req.user.theme_preference,
      profile: req.user.profile
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 🛡️ Test endpoint opzionale (pubblico ma riconosce utenti)
 */
router.get('/optional', optionalAuth, (req, res) => {
  const isAuthenticated = req.user.role !== 'GUEST';
  
  console.log('🔵 Accesso endpoint opzionale:', isAuthenticated ? 'autenticato' : 'guest'); // INFO - rimuovere in produzione
  
  res.json({
    message: isAuthenticated ? 'Benvenuto utente!' : 'Benvenuto ospite!',
    authenticated: isAuthenticated,
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

/**
 * 📊 Test info utente dettagliate
 */
router.get('/me', authenticate, (req, res) => {
  console.log('🟢 Richiesta info utente'); // INFO - rimuovere in produzione
  
  res.json({
    message: 'Informazioni utente',
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      theme_preference: req.user.theme_preference,
      first_name: req.user.profile?.first_name,
      last_name: req.user.profile?.last_name,
      teamId: req.user.profile?.teamId, // 👈 AGGIUNTO - teamId per multi-tenancy
      is_active: req.user.profile?.is_active,
      last_login: req.user.profile?.last_login
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * 🛡️ Test endpoint solo per ADMIN
 */
router.get('/admin-only', authenticate, requireRole(ROLES.ADMIN), (req, res) => {
  res.json({
    message: 'Area riservata amministratori',
    user_role: req.user.role,
    timestamp: new Date().toISOString()
  });
});

/**
 * 🏥 Test endpoint per staff medico
 */
router.get('/medical-only', authenticate, requireRole(ROLES.MEDICAL_STAFF, ROLES.ADMIN), (req, res) => {
  res.json({
    message: 'Area medica',
    user_role: req.user.role,
    timestamp: new Date().toISOString()
  });
});

/**
 * 📄 Test endpoint con permesso specifico contratti
 */
router.get('/contracts', authenticate, requirePermission(PERMISSIONS.CONTRACTS_READ), (req, res) => {
  res.json({
    message: 'Lettura contratti autorizzata',
    user_role: req.user.role,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;