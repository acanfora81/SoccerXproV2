const express = require('express');
const playersRoutes = require('./players');
const playersUploadRoutes = require('./playersUpload');
const playerNotesRoutes = require('./notes');
const playerMediaRoutes = require('./media');

const router = express.Router();

// ✅ Montaggio sotto-rotte del modulo "Giocatori"
router.use('/', playersRoutes);
router.use('/upload', playersUploadRoutes);
router.use('/notes', playerNotesRoutes);
router.use('/media', playerMediaRoutes);

module.exports = router;

