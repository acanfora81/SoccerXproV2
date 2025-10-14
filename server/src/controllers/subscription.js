// server/src/controllers/subscription.js
const { getPrismaClient } = require('../config/database');

exports.confirmPayment = async (req, res) => {
  try {
    const { teamId, plan, planId, modules } = req.body || {};
    if (!teamId) return res.status(400).json({ success: false, error: 'teamId required' });

    const prisma = getPrismaClient();

    // Se mancano modules/planId, prova a recuperarli dal catalogo usando planCode del team
    let planCode = plan;
    let planModules = modules;
    let resolvedPlanId = planId;
    if (!planModules || !Array.isArray(planModules) || planModules.length === 0 || !resolvedPlanId) {
      try {
        const teamPlanCode = planCode || team.plan;
        const planRecord = await prisma.planCatalog.findUnique({
          where: { code: teamPlanCode },
          select: { id: true, features: true }
        });
        if (planRecord) {
          resolvedPlanId = resolvedPlanId || planRecord.id;
          planModules = planModules && planModules.length > 0 ? planModules : (planRecord.features?.modules || []);
        }
      } catch (_) {}
    }

    // Verifica che il team esista
    const team = await prisma.team.findUnique({ 
      where: { id: teamId },
      select: { id: true, plan: true }
    });
    if (!team) return res.status(404).json({ success: false, error: 'Team not found' });

    // Crea o aggiorna la subscription
    const subscription = await prisma.subscription.upsert({
      where: { teamId },
      update: {
        status: 'ACTIVE',
        updatedAt: new Date()
      },
      create: {
        teamId,
        plan: 'BASIC', // enum legacy
        planId: resolvedPlanId || null,
        planCode: planCode || team.plan,
        status: 'ACTIVE',
        startDate: new Date(),
        features: {
          modules: planModules || []
        }
      }
    });

    // Aggiorna il team
    await prisma.team.update({
      where: { id: teamId },
      data: { subscriptionStatus: 'ACTIVE' }
    });

    return res.status(200).json({ success: true, subscriptionId: subscription.id });
  } catch (e) {
    console.error('❌ confirmPayment error:', e);
    return res.status(500).json({ success: false });
  }
};


