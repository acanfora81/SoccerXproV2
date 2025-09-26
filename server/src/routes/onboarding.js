// server/src/routes/onboarding.js
// Router per il flusso di onboarding tenant

const express = require('express');
const { getPrismaClient } = require('../config/database');
const { API_ERRORS, createErrorResponse } = require('../constants/errors');

const router = express.Router();

/**
 * POST /api/onboarding
 * Crea un nuovo team con admin user e subscription
 * 
 * Body: {
 *   email: string,
 *   teamName: string,
 *   plan: 'BASIC' | 'PROFESSIONAL' | 'PREMIUM' | 'ENTERPRISE',
 *   firstName?: string,
 *   lastName?: string
 * }
 * 
 * Response: {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     teamId: string,
 *     adminId: number,
 *     subscriptionId: string
 *   }
 * }
 */
router.post('/', async (req, res) => {
  const prisma = getPrismaClient();

  try {
    console.log('🟢 [ONBOARDING] Avvio processo onboarding:', req.body.email);

    // 1. Validazione input
    const { email, teamName, plan = 'BASIC', firstName = '', lastName = '' } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Email non valida',
        code: 'INVALID_EMAIL'
      });
    }

    if (!teamName || teamName.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Nome team deve essere almeno 2 caratteri',
        code: 'INVALID_TEAM_NAME'
      });
    }

    const validPlans = ['BASIC', 'PROFESSIONAL', 'PREMIUM', 'ENTERPRISE'];
    if (!validPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        error: 'Piano non valido',
        code: 'INVALID_PLAN'
      });
    }

    // 2. Controllo email univoca
    const existingUser = await prisma.userProfile.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email già registrata nel sistema',
        code: 'EMAIL_ALREADY_EXISTS'
      });
    }

    // 3. Generazione slug team univoco
    const baseSlug = teamName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    let teamSlug = baseSlug;
    let slugCounter = 1;

    while (true) {
      const existingTeam = await prisma.team.findUnique({
        where: { slug: teamSlug },
        select: { id: true }
      });

      if (!existingTeam) break;

      teamSlug = `${baseSlug}-${slugCounter}`;
      slugCounter++;
    }

    console.log('🔵 [ONBOARDING] Slug team generato:', teamSlug);

    // 4. Configurazione limiti per piano
    const planLimits = {
      BASIC: { maxUsers: 5, maxPlayers: 25 },
      PROFESSIONAL: { maxUsers: 15, maxPlayers: 50 },
      PREMIUM: { maxUsers: 30, maxPlayers: 100 },
      ENTERPRISE: { maxUsers: 100, maxPlayers: 250 }
    };

    const limits = planLimits[plan];

    // 5. Transazione database per creazione atomica
    const result = await prisma.$transaction(async (tx) => {
      // 5a. Crea Team
      const team = await tx.team.create({
        data: {
          name: teamName.trim(),
          slug: teamSlug,
          plan: plan.toLowerCase(),
          isActive: true,
          maxUsers: limits.maxUsers,
          maxPlayers: limits.maxPlayers,
          email: email,
          subscriptionStatus: 'active',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni trial
          subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 anno
        }
      });

      console.log('🔵 [ONBOARDING] Team creato:', team.id);

      // 5b. Crea UserProfile ADMIN
      const adminUser = await tx.userProfile.create({
        data: {
          auth_user_id: `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`, // Temporaneo
          email: email,
          first_name: firstName || 'Admin',
          last_name: lastName || 'User',
          role: 'ADMIN',
          is_active: true,
          teamId: team.id,
          theme_preference: 'dark',
          language_preference: 'it'
        }
      });

      console.log('🔵 [ONBOARDING] Admin user creato:', adminUser.id);

      // 5c. Crea Subscription
      const subscription = await tx.subscription.create({
        data: {
          teamId: team.id,
          plan: plan,
          status: 'ACTIVE',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 anno
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni trial
          maxUsers: limits.maxUsers,
          maxPlayers: limits.maxPlayers,
          billingEmail: email,
          features: {
            analytics: plan !== 'BASIC',
            advanced_reports: ['PREMIUM', 'ENTERPRISE'].includes(plan),
            api_access: plan === 'ENTERPRISE',
            multi_season: plan !== 'BASIC'
          }
        }
      });

      console.log('🔵 [ONBOARDING] Subscription creata:', subscription.id);

      return {
        team,
        adminUser,
        subscription
      };
    });

    // 6. Risposta successo
    console.log('🟢 [ONBOARDING] Processo completato con successo per:', email);

    res.status(201).json({
      success: true,
      message: `Team "${teamName}" creato con successo`,
      data: {
        teamId: result.team.id,
        adminId: result.adminUser.id,
        subscriptionId: result.subscription.id,
        slug: result.team.slug,
        plan: plan,
        trialEndsAt: result.subscription.trialEndsAt
      }
    });

  } catch (error) {
    console.log('🔴 [ONBOARDING] Errore durante processo:', {
      error: error.message,
      email: req.body?.email,
      teamName: req.body?.teamName
    });

    // Gestione errori specifici
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Team o email già esistenti',
        code: 'DUPLICATE_DATA'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Errore interno durante creazione team',
      code: 'ONBOARDING_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * GET /api/onboarding/plans
 * Restituisce i piani disponibili con caratteristiche
 */
router.get('/plans', (req, res) => {
  const plans = {
    BASIC: {
      name: 'Basic',
      price: 'Gratuito',
      maxUsers: 5,
      maxPlayers: 25,
      features: ['Dashboard base', 'Gestione giocatori', 'Contratti base']
    },
    PROFESSIONAL: {
      name: 'Professional',
      price: '29€/mese',
      maxUsers: 15,
      maxPlayers: 50,
      features: ['Analytics avanzate', 'Report personalizzati', 'Supporto prioritario']
    },
    PREMIUM: {
      name: 'Premium',
      price: '59€/mese',
      maxUsers: 30,
      maxPlayers: 100,
      features: ['Tutto Professional', 'Report avanzati', 'Integrazione API']
    },
    ENTERPRISE: {
      name: 'Enterprise',
      price: 'Su richiesta',
      maxUsers: 100,
      maxPlayers: 250,
      features: ['Tutto Premium', 'API completa', 'Supporto dedicato']
    }
  };

  res.json({
    success: true,
    data: plans
  });
});

module.exports = router;











