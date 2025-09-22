const { PrismaClient } = require('../../prisma/generated/client');
const prisma = new PrismaClient();

function audit(action, resourceTypeGetter, lawfulBasis = 'MEDICAL_PURPOSE') {
  return async function(req, res, next) {
    res.on('finish', async () => {
      try {
        const teamId = req.teamId;
        const userId = Number(req.user?.id || 0);
        const resource = resourceTypeGetter?.(req) || {};
        await prisma.medicalAccessLog.create({
          data: {
            teamId,
            userId,
            resourceType: resource.type || '',
            resourceId: String(resource.id || ''),
            caseId: resource.caseId || null,
            playerId: resource.playerId ? Number(resource.playerId) : null,
            action,
            accessReason: req.body?.reason || req.query?.reason || null,
            lawfulBasis,
            wasSuccessful: res.statusCode < 400,
            errorMessage: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
          }
        });
      } catch {}
    });
    next();
  };
}
module.exports = { audit };


