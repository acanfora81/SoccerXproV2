// server/src/routes/plans.js
const express = require('express');
const { getPlanDetails } = require('../controllers/plans');
const router = express.Router();

router.get('/plans/:planCode', getPlanDetails);

module.exports = router;









