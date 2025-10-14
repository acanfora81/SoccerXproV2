// server/src/controllers/plans.js
const { getPrismaClient } = require('../config/database');

exports.getPlanDetails = async (req, res) => {
  try {
    const { planCode } = req.params;
    if (!planCode) {
      return res.status(400).json({ success: false, error: 'Plan code required' });
    }

    const prisma = getPrismaClient();
    
    const plan = await prisma.planCatalog.findUnique({
      where: { code: planCode },
      select: {
        id: true,
        code: true,
        name: true,
        price_monthly: true,
        price_yearly: true,
        max_users: true,
        max_players: true,
        is_active: true,
        features: true
      }
    });

    if (!plan || !plan.is_active) {
      return res.status(404).json({ success: false, error: 'Plan not found or inactive' });
    }

    return res.status(200).json({
      success: true,
      plan: {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        price_monthly: plan.price_monthly,
        price_yearly: plan.price_yearly,
        max_users: plan.max_users,
        max_players: plan.max_players,
        features: plan.features
      }
    });
  } catch (error) {
    console.error('❌ getPlanDetails error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
};
