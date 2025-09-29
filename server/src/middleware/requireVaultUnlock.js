const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

module.exports = async function requireVaultUnlock(req, res, next) {
  const teamId = req.context?.teamId || req.teamId;
  const userId = req.user?.id;
  console.log('[VAULT] userId type:', typeof userId, 'value:', userId);
  if (!teamId || !userId) return res.status(401).json({ success:false, error:'Auth mancante' });

  // Bypass vault per ADMIN durante test
  if (req.user?.role === 'ADMIN') {
    console.log('🔓 [DEBUG] Vault bypassed per ADMIN:', req.user.email);
    return next();
  }

  const cfg = await prisma.gDPRConfiguration.findFirst({ where: { teamId } });
  if (!cfg?.vaultEnabled) return next();

  const now = new Date();
  const access = await prisma.medicalVaultAccess.findFirst({
    where: { 
      teamId, 
      userId: typeof userId === 'string' ? userId : Number(userId), 
      expiresAt: { gt: now }, 
      revokedAt: null 
    }
  });
  if (!access) {
    console.warn(`[VAULT] Accesso negato → team=${teamId}, userId=${userId}`);
    return res.status(423).json({ 
      success:false, 
      error:'Vault bloccato', 
      requiresUnlock:true 
    });
  }

  req.vaultAccess = access;
  next();
};


