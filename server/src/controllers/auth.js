// server/src/controllers/auth.js
// Controller autenticazione con Cookie HttpOnly + fix per account orfani

const { createClient } = require('@supabase/supabase-js');
const { getPrismaClient } = require('../config/database');
const { AUTH_ERRORS, API_ERRORS, createErrorResponse } = require('../constants/errors');
const { MultiTenantAuthService } = require('../services/MultiTenantAuthService');
const EmailService = require('../services/EmailService');
const { sendMail } = require('../utils/mailer');

console.log('🟢 [INFO] Caricamento controller autenticazione sicuro...'); // INFO - rimuovere in produzione

// Client Supabase PUBBLICO per operazioni utente normali
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Client Supabase ADMIN solo per operazioni privilegiate
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// ================================
// Cookie HttpOnly helpers
// ================================
const getCookieOptions = (maxAgeSeconds) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // in prod richiede HTTPS
  sameSite: 'lax',                                // 'strict' se non fai cross-site
  path: '/',                                      // importante per leggere ovunque
  maxAge: maxAgeSeconds * 1000                    // in ms
});

// Per la cancellazione deve combaciare sameSite/secure/path
const cookieClearOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/'
};

// Durate cookie (puoi tarare a piacere)
const ACCESS_TTL = 60 * 60;            // 1h
const REFRESH_TTL = 60 * 60 * 24 * 7;  // 7 giorni

/**
 * 🔒 Login utente
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔵 [DEBUG] Tentativo login per:', email);

    // Validazione input
    if (!email || !password) {
      const errorResponse = createErrorResponse(
        AUTH_ERRORS.MISSING_TOKEN,
        'Email e password richieste'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Autenticazione con Supabase (client pubblico)
    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });

    if (error || !data?.user || !data?.session) {
      console.log('🟡 [WARN] Login fallito:', error?.message);
      const errorResponse = createErrorResponse(
        AUTH_ERRORS.INVALID_TOKEN,
        'Credenziali non valide'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Verifica/crea UserProfile
    let userProfile = await getUserProfile(data.user.id);
    if (!userProfile) {
      console.log('🟡 [WARN] UserProfile mancante, creazione automatica...');
      userProfile = await createUserProfile(data.user, {
        first_name: data.user.user_metadata?.first_name || 'Nome',
        last_name: data.user.user_metadata?.last_name || 'Cognome',
        role: 'ADMIN' // default per account orfani; cambia se preferisci
      });
    }

    // Verifica account attivo
    if (!userProfile.is_active) {
      const errorResponse = createErrorResponse(AUTH_ERRORS.ACCOUNT_DISABLED);
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Aggiorna ultimo login (fire & forget)
    updateLastLogin(data.user.id).catch(err =>
      console.log('🔴 Errore updateLastLogin:', err.message)
    );

    // 🔑 Imposta cookie HttpOnly (access + refresh)
    res.cookie('access_token', data.session.access_token, getCookieOptions(ACCESS_TTL));
    res.cookie('refresh_token', data.session.refresh_token, getCookieOptions(REFRESH_TTL));

    console.log('🟢 [INFO] Login completato per ruolo:', userProfile.role);

    // (opzionale) NON includiamo i token nel body per maggiore sicurezza
    return res.json({
      message: 'Login riuscito',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userProfile.role,
        theme_preference: userProfile.theme_preference,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name,
        teamId: userProfile.teamId   // 👈 aggiunto
      }
    });

  } catch (error) {
    console.log('🔴 Errore login:', error.message);
    const errorResponse = createErrorResponse(AUTH_ERRORS.AUTH_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * 📝 Registrazione nuovo utente
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name, role = 'SECRETARY' } = req.body;

    console.log('🔵 [DEBUG] Tentativo registrazione per:', email);

    // Validazione input
    if (!email || !password || !first_name || !last_name) {
      const errorResponse = createErrorResponse(
        API_ERRORS.REQUIRED_FIELD_MISSING,
        'Email, password, nome e cognome richiesti'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Validazione ruolo
    const validRoles = ['ADMIN', 'DIRECTOR_SPORT', 'MEDICAL_STAFF', 'SECRETARY', 'SCOUT', 'PREPARATORE_ATLETICO'];
    if (!validRoles.includes(role)) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Ruolo non valido',
        `Ruoli validi: ${validRoles.join(', ')}`
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // CONTROLLO ACCOUNT ORFANO: esiste già utente supabase senza profilo?
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        const existingProfile = await getUserProfile(existingUser.id);

        if (!existingProfile) {
          console.log('🟢 [INFO] Account orfano rilevato, creazione automatica...');

          // Crea UserProfile
          const userProfile = await createUserProfile(existingUser, { first_name, last_name, role });

          // Login automatico
          const { data: loginData } = await supabasePublic.auth.signInWithPassword({ email, password });

          if (loginData?.session) {
            // Set cookie HttpOnly
            res.cookie('access_token', loginData.session.access_token, getCookieOptions(ACCESS_TTL));
            res.cookie('refresh_token', loginData.session.refresh_token, getCookieOptions(REFRESH_TTL));

            return res.status(201).json({
              message: 'Account collegato e login completati',
              user: {
                id: existingUser.id,
                email: existingUser.email,
                role: userProfile.role,
                theme_preference: userProfile.theme_preference,
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                is_active: userProfile.is_active
              }
            });
          } else {
            return res.status(201).json({
              message: 'Account collegato, login manuale richiesto',
              user: {
                id: existingUser.id,
                email: existingUser.email,
                role: userProfile.role,
                first_name: userProfile.first_name,
                last_name: userProfile.last_name,
                is_active: userProfile.is_active
              }
            });
          }
        } else {
          const errorResponse = createErrorResponse(
            API_ERRORS.VALIDATION_FAILED,
            'Un utente con questa email è già registrato'
          );
          return res.status(errorResponse.status).json(errorResponse.body);
        }
      }
    } catch (orphanCheckError) {
      console.log('🟡 [WARN] Errore controllo account orfano:', orphanCheckError.message);
      // prosegui con registrazione normale
    }

    let supabaseUser = null;
    let userProfile = null;

    try {
      // STEP 1: Registrazione su Supabase (admin)
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true // auto-conferma in sviluppo
      });

      if (error || !data?.user) {
        const errorResponse = createErrorResponse(
          API_ERRORS.VALIDATION_FAILED,
          error?.message || 'Errore registrazione'
        );
        return res.status(errorResponse.status).json(errorResponse.body);
      }

      supabaseUser = data.user;

      // STEP 2: Crea UserProfile sul nostro DB
      userProfile = await createUserProfile(supabaseUser, { first_name, last_name, role });

      // STEP 3: Login automatico per set-cookie
      const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({ email, password });

      if (loginError || !loginData?.session) {
        // Registrazione ok ma login fallito → niente cookie, login manuale
        return res.status(201).json({
          message: 'Registrazione completata, login manuale richiesto',
          user: {
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: userProfile.role,
            first_name: userProfile.first_name,
            last_name: userProfile.last_name,
            is_active: userProfile.is_active
          }
        });
      }

      // Cookie HttpOnly
      res.cookie('access_token', loginData.session.access_token, getCookieOptions(ACCESS_TTL));
      res.cookie('refresh_token', loginData.session.refresh_token, getCookieOptions(REFRESH_TTL));

      // Risposta senza token in body
      return res.status(201).json({
        message: 'Registrazione e login completati',
        user: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          role: userProfile.role,
          theme_preference: userProfile.theme_preference,
          first_name: userProfile.first_name,
          last_name: userProfile.last_name,
          is_active: userProfile.is_active
        }
      });

    } catch (innerError) {
      console.log('🔴 Errore durante registrazione, rollback necessario...');

      // ROLLBACK: se ha creato l’utente su Supabase ma non il profilo, cancella utente
      if (supabaseUser && !userProfile) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(supabaseUser.id);
          console.log('🟡 [WARN] Rollback Supabase completato');
        } catch (rollbackError) {
          console.log('🔴 Errore rollback Supabase:', rollbackError.message);
        }
      }

      throw innerError;
    }

  } catch (error) {
    console.log('🔴 Errore registrazione:', error.message);
    const errorResponse = createErrorResponse(AUTH_ERRORS.AUTH_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * 📝 Registrazione nuovo utente con creazione team
 * POST /api/auth/register-with-team
 */
const registerWithTeam = async (req, res) => {
  try {
    const { email, password, first_name, last_name, teamName, plan = 'BASIC', isPersonal = false, type } = req.body;

    console.log('🔵 [CONTROLLER] Tentativo registrazione con team per:', email);

    // Validazione input
    if (!email || !password || !first_name || !last_name || !teamName) {
      const errorResponse = createErrorResponse(
        API_ERRORS.REQUIRED_FIELD_MISSING,
        'Email, password, nome, cognome e nome team richiesti'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Validazione piano reale dal DB
    const prisma = getPrismaClient();
    const planRecord = await prisma.planCatalog.findUnique({
      where: { code: plan },
      select: { id: true, code: true, features: true, is_active: true }
    });

    if (!planRecord || !planRecord.is_active) {
      const errorResponse = createErrorResponse(
        API_ERRORS.INVALID_VALUE,
        'Piano non valido o non attivo'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    const planModules =
      (planRecord.features && planRecord.features.modules) || [];

    // Controllo email esistente con gestione "account orfano"
    let supabaseUser = null;
    try {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === email);

      if (existingUser) {
        const existingProfile = await getUserProfile(existingUser.id);
        const isOrphan = !existingProfile || !existingProfile.teamId;
        if (isOrphan) {
          console.log('🟢 [INFO] Account orfano rilevato (register-with-team), procedo con collegamento');
          // Allinea password per permettere il login immediato
          try {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password });
          } catch (pwErr) {
            console.log('🟡 [WARN] Impossibile aggiornare password account orfano:', pwErr.message);
          }
          supabaseUser = existingUser; // user già esistente; salta la creazione
        } else {
          const errorResponse = createErrorResponse(
            API_ERRORS.EMAIL_ALREADY_EXISTS,
            'Email già registrata'
          );
          return res.status(errorResponse.status).json(errorResponse.body);
        }
      }
    } catch (checkError) {
      console.log('🟡 [WARN] Errore controllo email esistente:', checkError.message);
    }

    try {
      // STEP 1: Crea utente Supabase (se non orfano già esistente)
      if (!supabaseUser) {
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true
        });

        if (error || !data?.user) {
          const errorResponse = createErrorResponse(
            API_ERRORS.VALIDATION_FAILED,
            error?.message || 'Errore registrazione'
          );
          return res.status(errorResponse.status).json(errorResponse.body);
        }

        supabaseUser = data.user;
        console.log('🟢 [CONTROLLER] Utente Supabase creato:', supabaseUser.id);
      } else {
        console.log('🟢 [CONTROLLER] Riutilizzo utente Supabase esistente:', supabaseUser.id);
      }

      // STEP 2: Delega al servizio (transazione atomica)
      const authService = new MultiTenantAuthService();
      const result = await authService.registerWithNewTeam({
        supabaseUserId: supabaseUser.id,
        email,
        first_name,
        last_name,
        teamName,
        plan,
        planCode: planRecord.code,
        planId: planRecord.id,
        modules: planModules,
        isPersonal: Boolean(isPersonal || (type === 'INDIVIDUAL'))
      });
      // Log di debug opzionale
      try {
        console.log(`🟢 [REGISTER] Piano collegato: ${planRecord.code} | Moduli: ${planModules.join(',')}`);
      } catch (_) {}

      console.log('🟢 [CONTROLLER] Team e UserProfile creati:', result.team.id, result.userProfile.id);

      // Invio email di benvenuto (non bloccante)
      try {
        sendMail({
          to: email,
          subject: 'Benvenuto in Soccer X Pro Suite',
          html: `<p>Ciao ${first_name},</p><p>il tuo team <strong>${teamName}</strong> è stato creato con il piano <strong>${planRecord.code}</strong>.</p>`
        }).catch(() => {});
      } catch (_) {}

      // STEP 3: Login automatico
      const { data: loginData, error: loginError } = await supabasePublic.auth.signInWithPassword({ email, password });

      if (loginError || !loginData?.session) {
        return res.status(201).json({
          success: true,
          message: 'Team e account creati con successo, login manuale richiesto',
          data: {
            teamId: result.team.id,
            teamName: result.team.name,
            userId: result.userProfile.id,
            email: result.userProfile.email
          }
        });
      }

      // Cookie HttpOnly
      res.cookie('access_token', loginData.session.access_token, getCookieOptions(ACCESS_TTL));
      res.cookie('refresh_token', loginData.session.refresh_token, getCookieOptions(REFRESH_TTL));

      // Risposta di successo
      return res.status(201).json({
        success: true,
        message: 'Team e account creati con successo',
        data: {
          teamId: result.team.id,
          teamName: result.team.name,
          userId: result.userProfile.id,
          email: result.userProfile.email,
          role: result.userProfile.role,
          theme_preference: result.userProfile.theme_preference,
          first_name: result.userProfile.first_name,
          last_name: result.userProfile.last_name,
          is_active: result.userProfile.is_active
        }
      });

    } catch (error) {
      console.log('🔴 [CONTROLLER] Errore durante registrazione:', error.message);

      // Rollback Supabase se necessario
      if (supabaseUser) {
        const authService = new MultiTenantAuthService();
        await authService.rollbackSupabaseUser(supabaseUser.id);
      }

      throw error;
    }

  } catch (error) {
    console.log('🔴 [CONTROLLER] Errore registrazione con team:', error.message);
    const errorResponse = createErrorResponse(AUTH_ERRORS.AUTH_ERROR);
    res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * 🚪 Logout utente
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    const userId = req.user?.id; // da middleware auth se presente

    // (opzionale) logout globale Supabase
    if (userId) {
      try {
        const { error } = await supabaseAdmin.auth.admin.signOut(userId);
        if (error) console.log('🟡 [WARN] Errore logout Supabase:', error.message);
        else console.log('🟢 [INFO] Logout globale Supabase completato');
      } catch (supabaseError) {
        console.log('🟡 [WARN] Fallback: errore logout Supabase admin:', supabaseError.message);
      }
    }

    // 🔑 rimuovi cookie
    res.clearCookie('access_token', cookieClearOptions);
    res.clearCookie('refresh_token', cookieClearOptions);

    console.log('🟢 [INFO] Logout completato');
    return res.json({ message: 'Logout riuscito' });

  } catch (error) {
    console.log('🔴 Errore logout:', error.message);
    const errorResponse = createErrorResponse(AUTH_ERRORS.AUTH_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

/**
 * 🔄 Refresh token
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    // Leggi refresh token dal body o dal cookie
    const refresh_token = req.body?.refresh_token || req.cookies?.refresh_token;

    if (!refresh_token) {
      const errorResponse = createErrorResponse(
        AUTH_ERRORS.MISSING_TOKEN,
        'Refresh token richiesto'
      );
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Refresh session su Supabase
    const { data, error } = await supabasePublic.auth.refreshSession({ refresh_token });

    if (error || !data?.session) {
      console.log('🟡 [WARN] Refresh token fallito:', error?.message);
      const errorResponse = createErrorResponse(AUTH_ERRORS.TOKEN_EXPIRED);
      return res.status(errorResponse.status).json(errorResponse.body);
    }

    // Aggiorna cookie
    res.cookie('access_token', data.session.access_token, getCookieOptions(ACCESS_TTL));
    res.cookie('refresh_token', data.session.refresh_token, getCookieOptions(REFRESH_TTL));

    console.log('🟢 [INFO] Token rinnovato con successo');
    return res.json({ message: 'Token rinnovato' });

  } catch (error) {
    console.log('🔴 Errore refresh token:', error.message);
    const errorResponse = createErrorResponse(AUTH_ERRORS.AUTH_ERROR);
    return res.status(errorResponse.status).json(errorResponse.body);
  }
};

// ================================
// Helpers
// ================================
const getUserProfile = async (userId) => {
  try {
    const prisma = getPrismaClient();
    return await prisma.userProfile.findUnique({
      where: { auth_user_id: userId }
    });
  } catch (error) {
    console.log('🔴 Errore getUserProfile:', error.message);
    return null;
  }
};

const createUserProfile = async (supabaseUser, additionalData = {}) => {
  try {
    const prisma = getPrismaClient();

    // upsert per evitare duplicati su email
    const userProfile = await prisma.userProfile.upsert({
      where: { email: supabaseUser.email },
      update: {
        auth_user_id: supabaseUser.id,
        first_name: additionalData.first_name || 'Nome',
        last_name: additionalData.last_name || 'Cognome',
        role: additionalData.role || 'SECRETARY',
        teamId: additionalData.teamId || null, // 👈 AGGIUNTO teamId
        is_active: true,
        updated_at: new Date().toISOString()
      },
      create: {
        auth_user_id: supabaseUser.id,
        email: supabaseUser.email,
        first_name: additionalData.first_name || 'Nome',
        last_name: additionalData.last_name || 'Cognome',
        role: additionalData.role || 'SECRETARY',
        teamId: additionalData.teamId || null, // 👈 AGGIUNTO teamId
        theme_preference: 'light',
        language_preference: 'it',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    console.log('🟢 [INFO] UserProfile creato/aggiornato con teamId:', additionalData.teamId || 'null');
    return userProfile;

  } catch (error) {
    console.log('🔴 Errore generico createUserProfile:', error.message);
    throw new Error('Errore interno creazione profilo');
  }
};

const updateLastLogin = async (userId) => {
  try {
    const prisma = getPrismaClient();

    await prisma.userProfile.update({
      where: { auth_user_id: userId },
      data: {
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    });

    console.log('🔵 [DEBUG] Last login aggiornato');

  } catch (error) {
    if (error.code === 'P2025') {
      console.log('🔴 UserProfile non trovato per update last_login:', userId);
    } else if (error.code === 'P2002') {
      console.log('🔴 Conflitto unique constraint su update:', error.message);
    } else if (error.code?.startsWith('P')) {
      console.log('🔴 Errore database Prisma update:', error.code, error.message);
    } else {
      console.log('🔴 Errore generico updateLastLogin:', error.message);
    }
    // non propagare: non è critico
  }
};

// ================================
// 🧩 Registrazione unificata (pending payment)
// ================================
async function registerUnified(req, res) {
  try {
    const { first_name, last_name, email, password, type, teamName, plan, vatNumber, address, phone } = req.body || {};
    if (!email || !password || !first_name || !last_name || !type || !plan) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const prisma = getPrismaClient();

    // Piano reale dal catalogo
    const planRecord = await prisma.planCatalog.findUnique({
      where: { code: plan },
      select: { id: true, code: true, is_active: true, features: true }
    });
    if (!planRecord || !planRecord.is_active) {
      return res.status(400).json({ success: false, error: 'Invalid or inactive plan' });
    }
    const modules = (planRecord.features && planRecord.features.modules) || [];

    // Crea o riusa utente Supabase (account orfano)
    let supabaseUserId = null;
    try {
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existing?.users?.find(u => u.email === email);
      if (existingUser) {
        const existingProfile = await getUserProfile(existingUser.id);
        const isOrphan = !existingProfile || !existingProfile.teamId;
        if (isOrphan) {
          await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password }).catch(() => {});
          supabaseUserId = existingUser.id;
        } else {
          return res.status(409).json({ success: false, error: 'Email already registered' });
        }
      }
    } catch (_) {}

    if (!supabaseUserId) {
      const { data: su, error: suErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });
      if (suErr || !su?.user) {
        return res.status(400).json({ success: false, error: 'Failed to create user' });
      }
      supabaseUserId = su.user.id;
    }

    // Crea Account/Team/Profile (senza subscription - sarà creata dopo pagamento)
    const svc = new MultiTenantAuthService();
    const result = await svc.registerWithNewTeam({
      supabaseUserId,
      email,
      first_name,
      last_name,
      teamName,
      plan: planRecord.code,
      planId: planRecord.id,
      modules,
      isPersonal: String(type).toUpperCase() === 'PERSONAL',
      status: 'PENDING_PAYMENT',
      vatNumber,
      address,
      phone,
      createSubscription: false // Non creare subscription ora
    });

    // Email
    await EmailService.sendRegistrationPending({
      email,
      name: first_name,
      plan: planRecord.code,
      paymentUrl: `${process.env.FRONTEND_URL || process.env.APP_BASE_URL}/onboarding/payment?plan=${planRecord.code}&teamId=${result.team.id}`
    }).catch((e) => { console.log('🟡 [WARN] Invio email pending fallito:', e?.message); });

    return res.status(200).json({
      success: true,
      message: 'Registration completed. Proceed to payment.',
      redirect: `/onboarding/payment?plan=${planRecord.code}&teamId=${result.team.id}`
    });
  } catch (e) {
    console.error('❌ registerUnified error:', e);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}

module.exports = {
  login,
  register,
  registerWithTeam,
  registerUnified,
  logout,
  refreshToken
};
