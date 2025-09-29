// server/src/routes/users.js
// Router per gestione utenti extra (solo ADMIN)

const express = require('express');
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');
const { getPrismaClient } = require('../config/database');
const { API_ERRORS, createErrorResponse } = require('../constants/errors');

const router = express.Router();

// Applica middleware di autenticazione e contesto tenant
router.use(authenticate, tenantContext);

/**
 * POST /api/users
 * Crea un nuovo utente nel team (solo ADMIN)
 * 
 * Body: {
 *   email: string,
 *   role: 'DIRECTOR_SPORT' | 'MEDICAL_STAFF' | 'SECRETARY' | 'SCOUT' | 'PREPARATORE_ATLETICO',
 *   firstName: string,
 *   lastName: string
 * }
 */
router.post('/', async (req, res) => {
  const prisma = getPrismaClient();

  try {
    // 1. Controllo permessi ADMIN
    if (req.context.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Solo gli amministratori possono creare nuovi utenti',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    console.log('🟢 [USERS] Richiesta creazione utente da ADMIN:', req.context.userEmail);

    // 2. Validazione input
    const { email, role, firstName, lastName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email non valida',
        code: 'INVALID_EMAIL'
      });
    }

    const validRoles = ['DIRECTOR_SPORT', 'MEDICAL_STAFF', 'SECRETARY', 'SCOUT', 'PREPARATORE_ATLETICO'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Ruolo non valido',
        code: 'INVALID_ROLE',
        validRoles: validRoles
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Nome e cognome sono obbligatori',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 3. Controllo email univoca
    const existingUser = await prisma.userProfile.findUnique({
      where: { email },
      select: { id: true, email: true, teamId: true }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email già registrata nel sistema',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 4. Controllo limiti subscription
    const subscription = await prisma.subscription.findUnique({
      where: { teamId: req.context.teamId },
      select: { maxUsers: true, plan: true }
    });

    if (subscription) {
      const currentUsersCount = await prisma.userProfile.count({
        where: { 
          teamId: req.context.teamId,
          is_active: true
        }
      });

      if (currentUsersCount >= subscription.maxUsers) {
        return res.status(409).json({
          success: false,
          error: `Limite utenti raggiunto per il piano ${subscription.plan} (${subscription.maxUsers} utenti)`,
          code: 'USER_LIMIT_EXCEEDED',
          currentUsers: currentUsersCount,
          maxUsers: subscription.maxUsers
        });
      }
    }

    // 5. Creazione utente
    const newUser = await prisma.userProfile.create({
      data: {
        auth_user_id: `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`, // Temporaneo
        email: email,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: role,
        is_active: true,
        teamId: req.context.teamId,
        theme_preference: 'dark',
        language_preference: 'it'
      }
    });

    console.log('🟢 [USERS] Nuovo utente creato:', {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      teamId: req.context.teamId,
      createdBy: req.context.userEmail
    });

    // 6. Risposta successo
    res.status(201).json({
      success: true,
      message: `Utente ${firstName} ${lastName} creato con successo`,
      data: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        role: newUser.role,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.log('🔴 [USERS] Errore durante creazione utente:', {
      error: error.message,
      teamId: req.context?.teamId,
      adminEmail: req.context?.userEmail
    });

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Email già esistente',
        code: 'DUPLICATE_EMAIL'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Errore interno durante creazione utente',
      code: 'USER_CREATION_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/users
 * Lista tutti gli utenti del team corrente (solo ADMIN)
 */
router.get('/', async (req, res) => {
  const prisma = getPrismaClient();

  try {
    // Controllo permessi ADMIN
    if (req.context.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Solo gli amministratori possono visualizzare gli utenti',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Recupera utenti del team
    const users = await prisma.userProfile.findMany({
      where: { teamId: req.context.teamId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true
      },
      orderBy: { created_at: 'desc' }
    });

    // Informazioni subscription per limiti
    const subscription = await prisma.subscription.findUnique({
      where: { teamId: req.context.teamId },
      select: { maxUsers: true, plan: true }
    });

    res.json({
      success: true,
      data: {
        users: users,
        statistics: {
          total: users.length,
          active: users.filter(u => u.is_active).length,
          inactive: users.filter(u => !u.is_active).length,
          maxUsers: subscription?.maxUsers || 5,
          plan: subscription?.plan || 'BASIC'
        }
      }
    });

  } catch (error) {
    console.log('🔴 [USERS] Errore durante recupero utenti:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Errore interno durante recupero utenti',
      code: 'USERS_FETCH_ERROR'
    });
  }
});

/**
 * PUT /api/users/:id/status
 * Attiva/disattiva un utente (solo ADMIN)
 */
router.put('/:id/status', async (req, res) => {
  const prisma = getPrismaClient();

  try {
    const { id } = req.params;
    const { isActive } = req.body;

    // Controllo permessi ADMIN
    if (req.context.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Solo gli amministratori possono modificare lo stato degli utenti',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // Validazione ID
    const userId = parseInt(id);
    if (!userId || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'ID utente non valido',
        code: 'INVALID_USER_ID'
      });
    }

    // Controllo che l'utente appartiene al team
    const targetUser = await prisma.userProfile.findFirst({
      where: { 
        id: userId,
        teamId: req.context.teamId 
      },
      select: { id: true, email: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato nel team',
        code: 'USER_NOT_FOUND'
      });
    }

    // Impedisci auto-disattivazione admin
    if (targetUser.id === req.context.userId && isActive === false) {
      return res.status(400).json({
        success: false,
        error: 'Non puoi disattivare il tuo stesso account',
        code: 'CANNOT_DEACTIVATE_SELF'
      });
    }

    // Aggiorna stato
    const updatedUser = await prisma.userProfile.update({
      where: { id: userId },
      data: { is_active: isActive },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true
      }
    });

    console.log('🟡 [USERS] Stato utente modificato:', {
      userId: userId,
      email: targetUser.email,
      newStatus: isActive,
      modifiedBy: req.context.userEmail
    });

    res.json({
      success: true,
      message: `Utente ${isActive ? 'attivato' : 'disattivato'} con successo`,
      data: updatedUser
    });

  } catch (error) {
    console.log('🔴 [USERS] Errore durante modifica stato utente:', error.message);

    return res.status(500).json({
      success: false,
      error: 'Errore interno durante modifica stato utente',
      code: 'USER_STATUS_UPDATE_ERROR'
    });
  }
});

module.exports = router;














