// Percorso: server/src/modules/players/routes/playersRoutes.js
// Routes per gestione giocatori SoccerXpro V2

const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate } = require('../../../middleware/auth');
const tenantContext = require('../../../middleware/tenantContext');
const {
  getPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  exportPlayersToExcel,
  updatePlayerStatus,
  uploadPlayersFile
} = require('../controllers/playersController');

const router = express.Router();

// 📁 Configurazione multer per upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'players-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo file non supportato. Usa CSV o Excel.'), false);
    }
  }
});

// 🔐 Autenticazione per tutte le rotte di questo router
router.use(authenticate, tenantContext);

// Helper: valida che :id sia numerico
const ensureNumericId = (paramName = 'id') => (req, res, next) => {
  const val = Number(req.params[paramName]);
  if (!Number.isInteger(val) || val <= 0) {
    return res.status(400).json({
      error: `Parametro ${paramName} non valido`,
      code: 'INVALID_ID'
    });
  }
  next();
};

/**
 * 📋 GET /api/players
 * Lista giocatori
 */
router.get('/', getPlayers);

/**
 * 📊 GET /api/players/export-excel
 * Esporta giocatori in Excel
 */
router.get('/export-excel', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Accesso negato: autorizzazioni insufficienti',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
}, exportPlayersToExcel);

/**
 * 📤 POST /api/players/upload
 * Upload file giocatori (CSV/Excel)
 */
router.post('/upload', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a caricare file giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, upload.single('file'), uploadPlayersFile);

/**
 * 👤 GET /api/players/:id
 * Dettaglio giocatore
 */
router.get('/:id', ensureNumericId('id'), getPlayerById);

/**
 * ➕ POST /api/players
 * Crea giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.post('/', (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a creare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, createPlayer);

/**
 * ✏️ PUT /api/players/:id
 * Aggiorna giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.put('/:id', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a modificare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, updatePlayer);

/**
 * 🗑️ DELETE /api/players/:id
 * Elimina giocatore (solo ADMIN, DIRECTOR_SPORT)
 */
router.delete('/:id', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a eliminare giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, deletePlayer);

/**
 * 🔄 PUT /api/players/:id/status
 * Aggiorna stato giocatore (ADMIN, DIRECTOR_SPORT, SECRETARY)
 */
router.put('/:id/status', ensureNumericId('id'), (req, res, next) => {
  const allowedRoles = ['ADMIN', 'DIRECTOR_SPORT', 'SECRETARY'];
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      error: 'Non autorizzato a modificare lo stato dei giocatori',
      code: 'INSUFFICIENT_PERMISSIONS',
      requiredRoles: allowedRoles
    });
  }
  next();
}, updatePlayerStatus);

module.exports = router;





















