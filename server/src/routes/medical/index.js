const express = require('express');
const requireMedicalRole = require('../../middleware/requireMedicalRole');
const requireVaultUnlock = require('../../middleware/requireVaultUnlock');
const require2FAIfSensitive = require('../../middleware/require2FAIfSensitive');
const { authenticate } = require('../../middleware/auth');
const tenantContext = require('../../middleware/tenantContext');
const router = express.Router();

router.use(authenticate, tenantContext, requireMedicalRole);
router.use(requireVaultUnlock);
router.use(require2FAIfSensitive);

router.use('/vault', require('./vault'));
router.use('/cases', require('./cases'));
router.use('/consents', require('./consents'));
router.use('/gdpr', require('./gdpr'));
router.use('/injuries', require('./injuries'));
router.use('/visits', require('./visits'));
router.use('/documents', require('./documents'));

module.exports = router;


