// 🔧 API Endpoint per session types dinamici - SoccerXpro V2
const express = require('express');
const router = express.Router();
const { getPrismaClient } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const tenantContext = require('../middleware/tenantContext');

// 🟢 GET /api/session-types - Carica tutti i tipi di sessione unici (session_name)
router.get('/', authenticate, tenantContext, async (req, res) => {
  try {
    console.log('🔵 [DEBUG] API session-types: Richiesta ricevuta per team:', req.context?.teamId);
    
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Team non disponibile nel contesto' });
    }

    const prisma = getPrismaClient();
    
    // 🔧 FIX: Query per ottenere session_name unici (non session_type)
    const sessionTypes = await prisma.performanceData.findMany({
      where: {
        player: { teamId }
      },
      select: {
        session_name: true
      },
      distinct: ['session_name']
    });
    
    console.log('🟢 [INFO] API session-types: Trovati', sessionTypes.length, 'tipi di sessione');
    
    // 🔧 FIX: Log dei session_name per debug
    const sessionNames = sessionTypes
      .map(st => st.session_name)
      .filter(name => name && name.trim() !== '')
      .sort();
    
    console.log('🟡 [WARN] API session-types: Session names:', sessionNames);
    console.log('🟡 [WARN] API session-types: Team ID:', teamId);
    console.log('🟡 [WARN] API session-types: User context:', req.context);
    
    res.json({
      sessionTypes: sessionNames,
      count: sessionNames.length
    });
    
  } catch (error) {
    console.log('🔴 API session-types: Errore database:', error.message);
    res.status(500).json({ 
      error: 'Errore nel caricamento tipi sessione',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🆕 NUOVO: GET /api/session-types/simple - Carica session_type (Allenamento/Partita)
router.get('/simple', authenticate, tenantContext, async (req, res) => {
  try {
    console.log('🔵 [DEBUG] API session-types/simple: Richiesta ricevuta per team:', req.context?.teamId);
    
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Team non disponibile nel contesto' });
    }

    const prisma = getPrismaClient();
    
    // 🔧 FIX: Query per ottenere session_type unici
    const sessionTypes = await prisma.performanceData.findMany({
      where: {
        player: { teamId }
      },
      select: {
        session_type: true
      },
      distinct: ['session_type']
    });
    
    console.log('🟢 [INFO] API session-types/simple: Trovati', sessionTypes.length, 'tipi di sessione');
    
    const sessionTypeValues = sessionTypes
      .map(st => st.session_type)
      .filter(type => type && type.trim() !== '')
      .sort();
    
    console.log('🟡 [WARN] API session-types/simple: Session types:', sessionTypeValues);
    
    res.json({
      sessionTypes: sessionTypeValues,
      count: sessionTypeValues.length
    });
    
  } catch (error) {
    console.log('🔴 API session-types/simple: Errore database:', error.message);
    res.status(500).json({ 
      error: 'Errore nel caricamento tipi sessione semplificati',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🟢 GET /api/session-types/stats - Statistiche sui tipi di sessione
router.get('/stats', authenticate, tenantContext, async (req, res) => {
  try {
    console.log('🔵 [DEBUG] API session-types/stats: Richiesta statistiche');
    
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(403).json({ error: 'Team non disponibile nel contesto' });
    }

    const prisma = getPrismaClient();
    
    const stats = await prisma.performanceData.groupBy({
      by: ['session_name'],
      where: {
        player: { teamId },
        session_name: { not: null }
      },
      _count: {
        session_name: true
      },
      _min: {
        session_date: true
      },
      _max: {
        session_date: true
      }
    });
    
    console.log('🟢 [INFO] API session-types/stats: Calcolate statistiche per', stats.length, 'tipi');
    
    const formattedStats = stats
      .filter(stat => stat.session_name && stat.session_name.trim() !== '')
      .map(stat => ({
        session_name: stat.session_name,
        count: stat._count.session_name,
        first_session: stat._min.session_date,
        last_session: stat._max.session_date
      }))
      .sort((a, b) => b.count - a.count || a.session_name.localeCompare(b.session_name));
    
    res.json(formattedStats);
    
  } catch (error) {
    console.log('🔴 API session-types/stats: Errore:', error.message);
    res.status(500).json({ 
      error: 'Errore nel calcolo statistiche sessioni' 
    });
  }
});

module.exports = router;
