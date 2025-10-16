// server/src/routes/subscription.js
const express = require('express');
const { confirmPayment } = require('../controllers/subscription');
const router = express.Router();

router.post('/subscription/confirm', confirmPayment);

module.exports = router;











