// Percorso: server/src/modules/contracts/index.js
const express = require('express');
const contractsRoutes = require('./routes/contractsRoutes');
const router = express.Router();
router.use('/contracts', contractsRoutes);
module.exports = router;





















