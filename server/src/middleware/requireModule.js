// server/src/middleware/requireModule.js
// Middleware per controllare licenze modulo a livello Account (ACCOUNT-CENTRIC MODEL)

const { getPrismaClient } = require('../config/database');

const prisma = getPrismaClient();

function requireModule(moduleKey) {
  return async (req, res, next) => {
    try {
      const accountId = req.user?.accountId;
      if (!accountId) {
        return res.status(403).json({ success: false, error: 'Missing account context', code: 'MISSING_ACCOUNT' });
      }

      // Primo: controlla le licenze account
      const license = await prisma.accountModuleLicense.findUnique({
        where: {
          accountId_module: { accountId, module: moduleKey }
        },
        select: { status: true, endDate: true }
      });

      const now = new Date();
      const isActive = license && (license.status === 'ACTIVE' || license.status === 'TRIAL') && (!license.endDate || new Date(license.endDate) >= now);

      if (!isActive) {
        // Fallback compat: se la sessione ha modules costruiti altrove (es. Subscription features), riusa quelli
        const hasFromSession = Array.isArray(req.user?.modules) && req.user.modules.includes(moduleKey);
        if (!hasFromSession) {
          return res.status(402).json({ success: false, error: `No valid license for ${moduleKey}`, code: 'LICENSE_REQUIRED' });
        }
      }

      return next();
    } catch (err) {
      return res.status(500).json({ success: false, error: 'License check error', details: err.message });
    }
  };
}

module.exports = { requireModule };





















