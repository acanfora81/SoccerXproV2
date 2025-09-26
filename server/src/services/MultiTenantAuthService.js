// server/src/services/MultiTenantAuthService.js
const { getPrismaClient } = require('../config/database');

/**
 * 🔵 MultiTenantAuthService
 * Servizio centralizzato per gestione autenticazione multi-tenant
 * Gestisce tutti i flussi di registrazione con transazioni atomiche
 */
class MultiTenantAuthService {
  
  /**
   * 🟢 Registrazione utente standard (senza team)
   * @param {Object} userData - Dati utente
   * @returns {Object} UserProfile creato
   */
  async registerUser(userData) {
    const prisma = getPrismaClient();
    
    return await prisma.$transaction(async (tx) => {
      // Crea UserProfile con teamId = null
      const userProfile = await tx.userProfile.create({
        data: {
          auth_user_id: userData.supabaseUserId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: userData.role || 'SECRETARY',
          teamId: null, // 👈 Nessun team inizialmente
          theme_preference: 'light',
          language_preference: 'it',
          is_active: true
        }
      });

      console.log('🟢 [AUTH_SERVICE] UserProfile creato senza team:', userProfile.id);
      return userProfile;
    });
  }

  /**
   * 🟢 Registrazione con creazione nuovo team
   * @param {Object} userData - Dati utente e team
   * @returns {Object} Team e UserProfile creati
   */
  async registerWithNewTeam(userData) {
    const prisma = getPrismaClient();
    
    return await prisma.$transaction(async (tx) => {
      // 1. Crea Team
      const team = await tx.team.create({
        data: {
          name: userData.teamName.trim(),
          slug: this.generateTeamSlug(userData.teamName),
          plan: userData.plan.toLowerCase(),
          isActive: true,
          maxUsers: this.getPlanLimits(userData.plan).maxUsers,
          maxPlayers: this.getPlanLimits(userData.plan).maxPlayers,
          email: userData.email,
          subscriptionStatus: 'active',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
          subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 anno
        }
      });

      console.log('🟢 [AUTH_SERVICE] Team creato:', team.id);

      // 2. Crea UserProfile con teamId
      const userProfile = await tx.userProfile.create({
        data: {
          auth_user_id: userData.supabaseUserId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: 'ADMIN', // 👈 Admin del team
          teamId: team.id, // 👈 COLLEGAMENTO AL TEAM
          theme_preference: 'light',
          language_preference: 'it',
          is_active: true
        }
      });

      console.log('🟢 [AUTH_SERVICE] UserProfile creato con team:', userProfile.id);

      // ❌ RIMOSSO TEMPORANEAMENTE: Configurazione GDPR e Medical Vault
      // Verranno aggiunte dopo che il flusso base funziona

      return { team, userProfile };
    });
  }

  /**
   * 🔵 Registrazione con invito team esistente
   * @param {Object} userData - Dati utente e token invito
   * @returns {Object} UserProfile creato
   */
  async registerWithInvite(userData) {
    const prisma = getPrismaClient();
    
    return await prisma.$transaction(async (tx) => {
      // 1. Valida e consuma invito
      const invite = await tx.teamInvite.findUnique({
        where: { token: userData.inviteToken },
        include: { team: true }
      });

      if (!invite || invite.isUsed || invite.expiresAt < new Date()) {
        throw new Error('Invito non valido o scaduto');
      }

      // 2. Crea UserProfile con teamId dell'invito
      const userProfile = await tx.userProfile.create({
        data: {
          auth_user_id: userData.supabaseUserId,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role: invite.role, // 👈 Ruolo dall'invito
          teamId: invite.teamId, // 👈 Team dall'invito
          theme_preference: 'light',
          language_preference: 'it',
          is_active: true
        }
      });

      // 3. Marca invito come usato
      await tx.teamInvite.update({
        where: { id: invite.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          usedByUserId: userProfile.id
        }
      });

      console.log('🟢 [AUTH_SERVICE] UserProfile creato con invito:', userProfile.id);
      return { userProfile, team: invite.team };
    });
  }

  /**
   * 🟢 Join team esistente per utente già registrato
   * @param {Object} userData - Dati utente e team
   * @returns {Object} UserProfile aggiornato
   */
  async joinExistingTeam(userData) {
    const prisma = getPrismaClient();
    
    return await prisma.$transaction(async (tx) => {
      // Aggiorna UserProfile con teamId
      const userProfile = await tx.userProfile.update({
        where: { id: userData.userId },
        data: {
          teamId: userData.teamId,
          role: userData.role || 'SECRETARY'
        }
      });

      console.log('🟢 [AUTH_SERVICE] UserProfile aggiornato con team:', userProfile.id);
      return userProfile;
    });
  }

  /**
   * 🔧 Helper: Genera slug team unico
   * @param {string} teamName - Nome del team
   * @returns {string} Slug unico
   */
  generateTeamSlug(teamName) {
    const baseSlug = teamName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 30);
    
    return `${baseSlug}-${Date.now()}`;
  }

  /**
   * 🔧 Helper: Ottieni limiti per piano
   * @param {string} plan - Piano di abbonamento
   * @returns {Object} Limiti del piano
   */
  getPlanLimits(plan) {
    const limits = {
      BASIC: { maxUsers: 5, maxPlayers: 25 },
      PROFESSIONAL: { maxUsers: 15, maxPlayers: 50 },
      PREMIUM: { maxUsers: 30, maxPlayers: 100 },
      ENTERPRISE: { maxUsers: 100, maxPlayers: 250 }
    };
    
    return limits[plan] || limits.BASIC;
  }

  /**
   * 🔧 Helper: Rollback Supabase se necessario
   * @param {string} supabaseUserId - ID utente Supabase
   */
  async rollbackSupabaseUser(supabaseUserId) {
    try {
      const { supabaseAdmin } = require('../config/supabase');
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId);
      console.log('🟡 [AUTH_SERVICE] Rollback Supabase completato');
    } catch (error) {
      console.log('🔴 [AUTH_SERVICE] Errore rollback Supabase:', error.message);
    }
  }
}

module.exports = MultiTenantAuthService;
