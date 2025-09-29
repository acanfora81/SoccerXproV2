const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../../config/database');

const prisma = getPrismaClient();

// GET /api/medical/injuries/stats
router.get('/stats', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Mock data per ora - implementare con veri dati quando il modello sarà creato
    const stats = {
      activeInjuries: 0,
      totalInjuries: 0,
      avgRecoveryDays: 0,
      injuriesByType: {},
      recentInjuries: []
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching injury stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/medical/injuries
router.get('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    // Recupera infortuni dal database
    const injuries = await prisma.injuries.findMany({
      where: { teamId },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      },
      orderBy: { injuryDate: 'desc' }
    });

    res.json({ success: true, data: injuries });
  } catch (error) {
    console.error('Error fetching injuries:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/medical/injuries
router.post('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.profileId;
    
    if (!teamId) {
      return res.status(400).json({ success: false, error: 'Team context required' });
    }

    const { playerId, bodyPart, injuryType, severity, injuryDate, expectedReturn, description, status } = req.body;

    // Validazione campi obbligatori
    if (!playerId || !bodyPart || !injuryType || !severity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Campi obbligatori mancanti: playerId, bodyPart, injuryType, severity' 
      });
    }

    // Crea l'infortunio
    const injury = await prisma.injuries.create({
      data: {
        playerId: parseInt(playerId),
        teamId,
        bodyPart,
        injuryType,
        severity,
        injuryDate: injuryDate ? new Date(injuryDate) : new Date(),
        expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
        description: description || '',
        status: status || 'ACTIVE',
        createdById: userId,
        updatedAt: new Date() // Aggiungo manualmente perché manca @updatedAt nello schema
      },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true
          }
        }
      }
    });

    console.log(`✅ Infortunio creato con successo - ID: ${injury.id}, Giocatore: ${injury.players.firstName} ${injury.players.lastName}`);

    res.status(201).json({ success: true, data: injury });
  } catch (error) {
    console.error('Error creating injury:', error);
    res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
});

module.exports = router;
