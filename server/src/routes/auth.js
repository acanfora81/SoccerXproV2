// 🔐 server/src/routes/auth.js
// Route per autenticazione e gestione utenti

const express = require('express');
const rateLimit = require('express-rate-limit');
const { authenticate } = require('../middleware/auth');
const { login, register, logout, refreshToken } = require('../controllers/auth');

const router = express.Router();

console.log('🟢 Caricamento route autenticazione...'); // INFO - rimuovere in produzione

/**
 * 🛡️ Rate limiting per login/register (protezione brute force)
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5, // Massimo 5 tentativi per IP
  message: {
    error: 'Troppi tentativi di login',
    code: 'RATE_LIMIT_EXCEEDED',
    retry_after: '15 minuti'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log('🟡 Rate limit superato per IP:', req.ip); // WARNING - rimuovere in produzione
    res.status(429).json({
      error: 'Troppi tentativi di login',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: '15 minuti'
    });
  }
});

/**
 * 🛡️ Rate limiting più permissivo per refresh token
 */
const refreshRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minuti
  max: 10, // Massimo 10 refresh per IP
  message: {
    error: 'Troppi tentativi di refresh',
    code: 'REFRESH_RATE_LIMIT_EXCEEDED',
    retry_after: '5 minuti'
  }
});

/**
 * 🔑 Login utente
 * POST /api/auth/login
 */
router.post('/login', authRateLimit, (req, res, next) => {
  console.log('🔵 POST /api/auth/login chiamato'); // INFO - rimuovere in produzione
  
  // Validazione base
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Body richiesta non valido',
      code: 'INVALID_REQUEST_BODY'
    });
  }
  
  next();
}, login);

/**
 * 📝 Registrazione nuovo utente
 * POST /api/auth/register
 */
router.post('/register', authRateLimit, (req, res, next) => {
  console.log('🔵 POST /api/auth/register chiamato'); // INFO - rimuovere in produzione
  
  // Validazione base
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Body richiesta non valido',
      code: 'INVALID_REQUEST_BODY'
    });
  }
  
  // Validazione email format base
  const { email } = req.body;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      error: 'Formato email non valido',
      code: 'INVALID_EMAIL_FORMAT'
    });
  }
  
  next();
}, register);

/**
 * 🚪 Logout utente
 * POST /api/auth/logout
 */
router.post('/logout', authenticate, (req, res, next) => {
  console.log('🔵 POST /api/auth/logout chiamato'); // INFO - rimuovere in produzione
  next();
}, logout);

/**
 * 🔄 Refresh token
 * POST /api/auth/refresh
 */
router.post('/refresh', refreshRateLimit, (req, res, next) => {
  console.log('🔵 POST /api/auth/refresh chiamato'); // INFO - rimuovere in produzione
  
  // Validazione base
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({
      error: 'Body richiesta non valido',
      code: 'INVALID_REQUEST_BODY'
    });
  }
  
  next();
}, refreshToken);

/**
 * 👤 Informazioni utente corrente
 * GET /api/auth/me
 */
router.get('/me', authenticate, (req, res) => {
  console.log('🔵 GET /api/auth/me chiamato'); // INFO - rimuovere in produzione
  
  try {
    res.json({
      message: 'Informazioni utente corrente',
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        theme_preference: req.user.theme_preference,
        language_preference: req.user.language_preference,
        first_name: req.user.profile?.first_name,
        last_name: req.user.profile?.last_name,
        teamId: req.user.profile?.teamId, // 👈 AGGIUNTO - teamId per multi-tenancy
        is_active: req.user.profile?.is_active,
        last_login: req.user.profile?.last_login,
        created_at: req.user.profile?.created_at
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.log('🔴 Errore /me:', error.message); // ERROR - mantenere essenziali
    res.status(500).json({
      error: 'Errore recupero informazioni utente',
      code: 'USER_INFO_ERROR'
    });
  }
});

/**
 * 🔧 Aggiornamento tema utente
 * PATCH /api/auth/theme
 */
router.patch('/theme', authenticate, (req, res) => {
  console.log('🔵 PATCH /api/auth/theme chiamato'); // INFO - rimuovere in produzione
  
  try {
    const { theme_preference } = req.body;
    
    // Validazione tema
    if (!theme_preference || !['light', 'dark'].includes(theme_preference)) {
      return res.status(400).json({
        error: 'Tema non valido. Valori accettati: light, dark',
        code: 'INVALID_THEME'
      });
    }
    
    // Aggiorna tema nel database (implementazione semplificata)
    // In futuro: chiamare controller dedicato
    res.json({
      message: 'Tema aggiornato',
      user: {
        ...req.user,
        theme_preference
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.log('🔴 Errore aggiornamento tema:', error.message); // ERROR - mantenere essenziali
    res.status(500).json({
      error: 'Errore aggiornamento tema',
      code: 'THEME_UPDATE_ERROR'
    });
  }
});

/**
 * 📊 Health check autenticazione
 * GET /api/auth/health
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Authentication Service',
    endpoints: {
      'POST /login': 'Login utente',
      'POST /register': 'Registrazione utente',
      'POST /logout': 'Logout utente (richiede auth)',
      'POST /refresh': 'Refresh token',
      'GET /me': 'Info utente corrente (richiede auth)',
      'PATCH /theme': 'Aggiorna tema (richiede auth)'
    },
    rate_limits: {
      'login/register': '5 tentativi per 15 minuti',
      'refresh': '10 tentativi per 5 minuti'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;