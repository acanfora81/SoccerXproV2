// Percorso: server/src/modules/players/index.js
const express = require('express');
const playersRoutes = require('./routes/playersRoutes');
const router = express.Router();
router.use('/players', playersRoutes);
module.exports = router;


