// server/src/middleware/auth.js
// Middleware autenticazione (cookie HttpOnly + Bearer fallback) con Prisma singleton

const { createClient } = require('@supabase/supabase-js');
const { getPrismaClient } = require('../config/database');

console.log('🟢 [INFO] Caricamento middleware autenticazione sicuro...'); // INFO - rimuovere in produzione

// Inizializza Supabase client (service role, no sessione persistita)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ------------------------------
// Helpers
// ------------------------------
/**
 * Estrae il token prima dal cookie HttpOnly, poi dall'header Authorization.
 */
function extractToken(req) {
  const cookieToken = req.cookies?.access_token || null;
  const header = req.headers?.authorization || '';
  const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  return cookieToken || bearerToken || null;
}

/**
 * 👤 Carica UserProfile dal database
 */
const getUserProfile = async (userId) => {
  const prisma = getPrismaClient();
  return prisma.userProfile.findUnique({
    where: { auth_user_id: userId },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      role: true,
      theme_preference: true,
      language_preference: true,
      teamId: true, // 👈 AGGIUNTO - teamId per multi-tenancy
      is_active: true,
      last_login: true
    }
  });
};

// ------------------------------
// 🔐 Middleware principale
// ------------------------------
const authenticate = async (req, res, next) => {
  try {
    console.log('🔵 [DEBUG] Verifica autenticazione...'); // INFO DEV

    // 1) Estrai token (cookie -> header)
    const token = extractToken(req);
    if (!token) {
      console.log('🟡 [WARN] Token mancante (cookie/header)'); // WARNING
      return res.status(401).json({
        error: 'Token di autenticazione richiesto',
        code: 'MISSING_TOKEN'
      });
    }

    // 2) Verifica token con Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.log('🟡 [WARN] Token non valido/scaduto:', authError?.message); // WARNING
      return res.status(401).json({
        error: 'Token non valido o scaduto',
        code: 'INVALID_TOKEN',
        details: authError?.message
      });
    }

    console.log('🟢 [INFO] Utente autenticato:', user.email); // INFO

    // 3) Carica UserProfile
    const userProfile = await getUserProfile(user.id);
    if (!userProfile) {
      console.log('🔴 UserProfile mancante per:', user.id); // ERROR
      return res.status(403).json({
        error: 'Profilo utente non configurato',
        code: 'PROFILE_REQUIRED',
        message: 'Contatta amministratore per configurare il profilo'
      });
    }

    if (!userProfile.is_active) {
      console.log('🟡 [WARN] Account disattivato:', user.email); // WARNING
      return res.status(403).json({
        error: 'Account disattivato',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // 4) Inietta info utente nella request
    req.user = {
      id: user.id,
      email: user.email,
      profile: userProfile,
      profileId: userProfile.id, // Aggiunto per compatibilità con tenantContext
      role: userProfile.role,
      theme_preference: userProfile.theme_preference || 'light'
    };

    console.log('🟢 [INFO] Autenticazione completata, ruolo:', req.user.role); // INFO
    next();

  } catch (error) {
    console.log('🔴 Errore autenticazione:', error.message); // ERROR
    res.status(500).json({
      error: 'Errore interno autenticazione',
      code: 'AUTH_ERROR'
    });
  }
};

// ------------------------------
// 🛡️ Middleware opzionale (per endpoint pubblici)
// ------------------------------
const optionalAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (token) {
    // Se c'è un token (cookie o header), prova autenticazione completa
    return authenticate(req, res, next);
  }

  // Nessun token → continua come guest
  req.user = {
    role: 'GUEST',
    theme_preference: 'light'
  };

  console.log('🔵 [DEBUG] Accesso guest'); // INFO DEV
  next();
};

module.exports = {
  authenticate,
  optionalAuth
};
