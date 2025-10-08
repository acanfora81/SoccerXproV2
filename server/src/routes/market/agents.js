// server/src/routes/market/agents.js
const express = require('express');
const { getPrismaClient } = require('../../config/database');

const prisma = getPrismaClient();
const router = express.Router();

/**
 * GET /api/market/agents
 * Query params: search, page=1, pageSize=20
 */
router.get('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const {
      search = '',
      page = '1',
      pageSize = '20',
    } = req.query;

    const where = {
      teamId,
      ...(search
        ? {
            OR: [
              { first_name: { contains: String(search), mode: 'insensitive' } },
              { last_name: { contains: String(search), mode: 'insensitive' } },
              { email: { contains: String(search), mode: 'insensitive' } },
              { agency: { contains: String(search), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const take = Math.max(1, Math.min(100, Number(pageSize)));
    const skip = (Math.max(1, Number(page)) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.market_agent.findMany({
        where,
        orderBy: [{ first_name: 'asc' }],
        skip,
        take,
      }),
      prisma.market_agent.count({ where }),
    ]);

    return res.json({
      success: true,
      data: items,
      meta: { page: Number(page), pageSize: take, total },
    });
  } catch (err) {
    console.error('[market/agents:list] error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

/**
 * POST /api/market/agents
 * Body: { first_name, last_name, email?, phone?, agency?, notes? }
 */
router.post('/', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const {
      // Dati anagrafici
      first_name,
      last_name,
      nationality,
      date_of_birth,
      
      // Licenza e stato
      license_number,
      license_expiry,
      is_certified,
      is_verified,
      verification_badge_color,
      verification_note,
      
      // Attivazione
      active,
      
      // Contatti e agenzia
      agency,
      agency_website,
      agency_address,
      email,
      phone,
      secondary_phone,
      linkedin_url,
      instagram_url,
      
      // Profilo professionale
      languages,
      specialization,
      notes,
    } = req.body || {};

    if (!first_name || !last_name) {
      return res.status(400).json({ success: false, error: 'first_name and last_name are required' });
    }

    const created = await prisma.market_agent.create({
      data: {
        teamId,
        // Dati anagrafici
        first_name: String(first_name),
        last_name: String(last_name),
        nationality: nationality ? String(nationality) : null,
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        
        // Licenza e stato
        license_number: license_number ? String(license_number) : null,
        license_expiry: license_expiry ? new Date(license_expiry) : null,
        is_certified: Boolean(is_certified),
        is_verified: Boolean(is_verified),
        verification_badge_color: verification_badge_color ? String(verification_badge_color) : null,
        verification_note: verification_note ? String(verification_note) : null,
        
        // Attivazione
        active: active !== undefined ? Boolean(active) : true,
        
        // Contatti e agenzia
        agency: agency ? String(agency) : null,
        agency_website: agency_website ? String(agency_website) : null,
        agency_address: agency_address ? String(agency_address) : null,
        email: email ? String(email) : null,
        phone: phone ? String(phone) : null,
        secondary_phone: secondary_phone ? String(secondary_phone) : null,
        linkedin_url: linkedin_url ? String(linkedin_url) : null,
        instagram_url: instagram_url ? String(instagram_url) : null,
        
        // Profilo professionale
        languages: languages ? String(languages) : null,
        specialization: specialization ? String(specialization) : null,
        notes: notes ? String(notes) : null,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('[market/agents:create] error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

/**
 * PATCH /api/market/agents/:id
 * Aggiorna solo campi ammessi.
 */
router.patch('/:id', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const id = Number(req.params.id);

    // Verifica ownership
    const exists = await prisma.market_agent.findFirst({ where: { id, teamId } });
    if (!exists) return res.status(404).json({ success: false, error: 'Not found' });

    const allowed = [
      // Dati anagrafici
      'first_name', 'last_name', 'nationality', 'date_of_birth',
      
      // Licenza e stato
      'license_number', 'license_expiry', 'is_certified', 'is_verified', 
      'verification_badge_color', 'verification_note',
      
      // Attivazione
      'active',
      
      // Contatti e agenzia
      'agency', 'agency_website', 'agency_address', 'email', 'phone', 
      'secondary_phone', 'linkedin_url', 'instagram_url',
      
      // Profilo professionale
      'languages', 'specialization', 'notes'
    ];
    
    const data = {};
    for (const k of allowed) {
      if (k in (req.body || {})) {
        const value = req.body[k];
        if (value === null || value === undefined || value === '') {
          data[k] = null;
        } else if (k === 'date_of_birth' || k === 'license_expiry') {
          data[k] = new Date(value);
        } else if (k === 'is_certified' || k === 'is_verified' || k === 'active') {
          data[k] = Boolean(value);
        } else {
          data[k] = String(value);
        }
      }
    }

    const updated = await prisma.market_agent.update({
      where: { id },
      data,
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[market/agents:update] error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

/**
 * DELETE /api/market/agents/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) {
      return res.status(401).json({ success: false, error: 'No team in session' });
    }

    const id = Number(req.params.id);

    // Verifica ownership
    const exists = await prisma.market_agent.findFirst({ where: { id, teamId } });
    if (!exists) return res.status(404).json({ success: false, error: 'Not found' });

    // Prova a rimuovere i collegamenti dalle trattative (se la colonna esiste)
    try {
      await prisma.market_negotiation.updateMany({ 
        where: { agentId: id }, 
        data: { agentId: null } 
      });
    } catch (err) {
      // Se la colonna agent_id non esiste in market_negotiations, ignora l'errore
      if (err.code === 'P2022' && err.meta?.column === 'market_negotiations.agent_id') {
        console.log('⚠️ [market/agents:delete] Colonna agent_id non presente in market_negotiations, ignorando...');
      } else {
        throw err; // Rilancia altri errori
      }
    }

    // Prova a rimuovere i collegamenti dalle offerte (se la colonna esiste)
    try {
      await prisma.market_offer.updateMany({ 
        where: { agentId: id }, 
        data: { agentId: null } 
      });
    } catch (err) {
      // Se la colonna agent_id non esiste in market_offers, ignora l'errore
      if (err.code === 'P2022' && err.meta?.column === 'market_offers.agent_id') {
        console.log('⚠️ [market/agents:delete] Colonna agent_id non presente in market_offers, ignorando...');
      } else {
        throw err; // Rilancia altri errori
      }
    }

    // Ora elimina l'agente
    await prisma.market_agent.delete({ where: { id } });

    return res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (err) {
    console.error('[market/agents:delete] error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
});

module.exports = router;
