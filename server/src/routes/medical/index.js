const express = require('express');
const requireMedicalRole = require('../../middleware/requireMedicalRole');
const requireVaultUnlock = require('../../middleware/requireVaultUnlock');
const require2FAIfSensitive = require('../../middleware/require2FAIfSensitive');
const router = express.Router();

router.use(requireMedicalRole);
router.use(requireVaultUnlock);
router.use(require2FAIfSensitive);

router.use('/vault', require('./vault'));
router.use('/cases', require('./cases'));
router.use('/consents', require('./consents'));
router.use('/gdpr', require('./gdpr'));

module.exports = router;


