const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../../config/database');

const prisma = getPrismaClient();

// GET /api/medical/visits/stats
router.get('/stats', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Mock data per ora - implementare con veri dati quando il modello sarà creato
    const stats = {
      totalVisits: 0,
      visitsThisMonth: 0,
      avgVisitsPerPlayer: 0,
      visitsByType: {},
      recentVisits: []
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching visit stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/medical/visits
router.get('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const { from, to } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Mock data per ora
    const visits = {
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      filters: { from, to }
    };

    res.json({ success: true, data: visits });
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
