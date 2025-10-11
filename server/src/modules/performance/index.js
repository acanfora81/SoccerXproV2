// Percorso: server/src/modules/performance/index.js
const express = require('express');
const performanceRoutes = require('./routes/performanceRoutes');

console.log('🔵 [Performance Index] Caricamento modulo performance...');
console.log('🔵 [Performance Index] performanceRoutes type:', typeof performanceRoutes);

const router = express.Router();

// Log middleware per debug
router.use('/performance', (req, res, next) => {
  console.log('🔍 [Performance Index] Richiesta a /performance:', req.method, req.path, req.url);
  next();
});

// Il controllo di accesso al modulo è gestito all'interno di performanceRoutes
router.use('/performance', performanceRoutes);

console.log('🟢 [Performance Index] Modulo montato su /performance');

module.exports = router;


