const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../../config/database');

const prisma = getPrismaClient();

// GET /api/medical/documents/stats
router.get('/stats', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Mock data per ora - implementare con veri dati quando il modello sarà creato
    const stats = {
      totalDocuments: 0,
      consentsExpiring: 0,
      retentionSoon: 0,
      documentsByType: {},
      storageUsed: 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching document stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/medical/documents
router.get('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Mock data per ora
    const documents = {
      items: [],
      total: 0,
      page: 1,
      limit: 20
    };

    res.json({ success: true, data: documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
