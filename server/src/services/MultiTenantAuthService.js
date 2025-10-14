// server/src/services/MultiTenantAuthService.js
// Servizi multi-tenant: creazione team, linking profilo, moduli effettivi

const { createClient } = require('@supabase/supabase-js');
const { getPrismaClient } = require('../config/database');

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

class MultiTenantAuthService {
  constructor() {
    this.prisma = getPrismaClient();
    this.supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  async registerWithNewTeam({ supabaseUserId, email, first_name, last_name, teamName, plan, planCode, planId, modules = [], isPersonal = false, status = 'PENDING_PAYMENT', vatNumber, address, phone, createSubscription = true }) {
    const prisma = this.prisma;

    // Genera uno slug univoco
    const base = slugify(teamName);
    let teamSlug = base;
    let i = 1;
    while (true) {
      const exists = await prisma.team.findUnique({ where: { slug: teamSlug }, select: { id: true } });
      if (!exists) break;
      teamSlug = `${base}-${i++}`;
    }

    // Normalizza planCode
    const normalizedPlanCode = String(planCode || plan || 'BASIC');

    const result = await prisma.$transaction(async (tx) => {
      // Crea Account
      const accountBase = (isPersonal ? `${first_name}-${last_name}` : (teamName || `${first_name}-${last_name}`))
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      let accountSlug = accountBase;
      let ai = 1;
      while (true) {
        const exists = await tx.account.findUnique({ where: { slug: accountSlug }, select: { id: true } });
        if (!exists) break;
        accountSlug = `${accountBase}-${ai++}`;
      }

      const account = await tx.account.create({
        data: {
          name: isPersonal ? `${first_name} ${last_name}` : (teamName || `${first_name} ${last_name}`),
          slug: accountSlug,
          type: isPersonal ? 'INDIVIDUAL' : 'CLUB',
          plan: String(planCode || plan)
        }
      });

      // Crea Team
      const team = await tx.team.create({
        data: {
          name: teamName,
          slug: teamSlug,
          plan: normalizedPlanCode,
          accountId: account.id,
          isPersonal: Boolean(isPersonal),
          email,
          subscriptionStatus: status,
          vatNumber: vatNumber || null,
          address: address || null,
          phone: phone || null
        }
      });

      // Upsert UserProfile collegandolo al team
      const userProfile = await tx.userProfile.upsert({
        where: { email },
        update: {
          auth_user_id: supabaseUserId,
          first_name,
          last_name,
          role: 'ADMIN',
          is_active: true,
          teamId: team.id,
          updated_at: new Date().toISOString()
        },
        create: {
          auth_user_id: supabaseUserId,
          email,
          first_name,
          last_name,
          role: 'ADMIN',
          is_active: true,
          teamId: team.id,
          theme_preference: 'light',
          language_preference: 'it',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });

      // Crea Subscription solo se richiesto
      if (createSubscription) {
        try {
          // Nota: campo plan è enum (BASIC/PROFESSIONAL/PREMIUM/ENTERPRISE).
          // Usiamo un valore di default coerente (BASIC) e manteniamo i moduli reali in features.modules.
          await tx.subscription.create({
            data: {
              teamId: team.id,
              plan: 'BASIC',
              planId: planId || null,
              planCode: normalizedPlanCode,
              status: status,
              startDate: new Date(),
              features: {
                modules
              }
            }
          });
        } catch (e) {
          console.log('⚠️  Errore creazione subscription:', e.message);
        }
      }

      return { team, userProfile, account };
    });

    return result;
  }

  async rollbackSupabaseUser(userId) {
    try {
      await this.supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (_) {}
  }
}

async function buildEffectiveModules({ userId, teamId, accountId }) {
  const prisma = getPrismaClient();
  const modules = new Set();

  // 1) Licenze a livello Account
  if (accountId) {
    const activeLicenses = await prisma.accountModuleLicense.findMany({
      where: {
        accountId,
        status: { in: ['ACTIVE', 'TRIAL'] },
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }]
      },
      select: { module: true }
    });
    activeLicenses.forEach(l => modules.add(l.module));
  }

  // 2) Compat legacy: Subscription.features (team)
  if (teamId) {
    const sub = await prisma.subscription.findUnique({ where: { teamId }, select: { features: true } });
    if (sub?.features) {
      // Nuovo formato: features.modules = ["contracts", "performance", ...]
      if (Array.isArray(sub.features.modules)) {
        sub.features.modules.forEach((m) => modules.add(m));
      } else {
        // Fallback legacy: deriva moduli dai flag booleani
        const f = sub.features || {};
        // Contratti è un modulo base disponibile in tutti i piani legacy
        modules.add('contracts');
        // Se era attivo analytics → abilita performance
        if (f.analytics === true) modules.add('performance');
        // Altre possibili derivazioni in futuro...
      }
    }
  }

  return Array.from(modules);
}

module.exports = {
  buildEffectiveModules,
  MultiTenantAuthService
};