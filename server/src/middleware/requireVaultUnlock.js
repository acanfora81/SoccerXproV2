const { getPrismaClient } = require('../config/database');
const prisma = getPrismaClient();

module.exports = async function requireVaultUnlock(req, res, next) {
  const teamId = req.teamId;
  const userId = req.user?.id;
  if (!teamId || !userId) return res.status(401).json({ success:false, error:'Auth mancante' });

  const cfg = await prisma.gDPRConfiguration.findFirst({ where: { teamId } });
  if (!cfg?.vaultEnabled) return next();

  const now = new Date();
  const access = await prisma.medicalVaultAccess.findFirst({
    where: { teamId, userId: Number(userId), expiresAt: { gt: now }, revokedAt: null }
  });
  if (!access) return res.status(423).json({ success:false, error:'Vault bloccato', requiresUnlock:true });

  req.vaultAccess = access;
  next();
};


