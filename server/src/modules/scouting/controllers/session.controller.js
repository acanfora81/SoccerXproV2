/**
 * ===============================================================
 * 🧩 SCOUTING MODULE – Session Controller
 * ===============================================================
 */

const { ScoutingModels } = require('../modelRefs');
const { listSessionsSchema, createSessionSchema, updateSessionSchema, sessionIdSchema } = require('../validators');
const { formationSchema } = require('../validators/formation.schema');

// GET /api/scouting/sessions
const listSessions = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const parsed = listSessionsSchema.safeParse(req.query || {});
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
    const { prospectId, q, observationType, rolePlayed, page = 1, limit = 20 } = parsed.data;
    const skip = (Number(page) - 1) * Number(limit);

    const where = { teamId };
    if (prospectId) where.prospectId = prospectId;
    if (q) {
      where.OR = [
        { location: { contains: q, mode: 'insensitive' } },
        { opponent: { contains: q, mode: 'insensitive' } },
        { competition: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (observationType) where.observationType = observationType;
    if (rolePlayed) where.rolePlayed = rolePlayed;

    const [total, sessions] = await Promise.all([
      ScoutingModels.Session.count({ where }),
      ScoutingModels.Session.findMany({
        where,
        include: {
          prospect: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              mainPosition: true
            }
          }
        },
        orderBy: [{ dateObserved: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: Number(limit),
      })
    ]);

    return res.json({ success: true, data: sessions, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    const msg = String(err?.message || '');
    if (msg.includes("Can't reach database server") || msg.includes('PrismaClientInitializationError') || msg.includes('P1001')) {
      console.warn('[SessionController] DB unreachable, returning empty list');
      return res.json({ success: true, data: [], meta: { total: 0, page: 1, limit: Number(req.query?.limit || 20) } });
    }
    console.error('[SessionController] listSessions error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// POST /api/scouting/sessions
const createSession = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.profile?.id;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    console.log('[SessionController] Request body:', req.body);
    const parsed = createSessionSchema.safeParse(req.body || {});
    if (!parsed.success) {
      console.log('[SessionController] Validation error:', parsed.error);
      const errorMessage = parsed.error?.errors?.[0]?.message || 'Validation error';
      return res.status(400).json({ success: false, error: errorMessage });
    }
    const {
      prospectId, observationType, dateObserved, location, opponent, competition,
      minutesPlayed, rolePlayed, rating, notes, prospectTeamSide
    } = parsed.data;

    const session = await ScoutingModels.Session.create({
      data: {
        teamId,
        prospectId,
        createdById: userId,
        observationType: observationType || 'LIVE',
        dateObserved: dateObserved ? new Date(dateObserved) : null,
        location: location || null,
        opponent: opponent || null,
        competition: competition || null,
        minutesPlayed: minutesPlayed || null,
        rolePlayed: rolePlayed || null,
        rating: rating || null,
        notes: notes || null,
        prospectTeamSide: prospectTeamSide || 'HOME',
      }
    });

    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    console.error('[SessionController] createSession error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// GET /api/scouting/sessions/:id
const getSessionById = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const parsed = sessionIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid session ID' });

    const session = await ScoutingModels.Session.findFirst({
      where: {
        id: req.params.id,
        teamId
      },
      include: {
        prospect: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            mainPosition: true
          }
        }
      }
    });

    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('[SessionController] getSessionById error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// PUT /api/scouting/sessions/:id
const updateSession = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.profile?.id;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const parsed = sessionIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid session ID' });

    const updateParsed = updateSessionSchema.safeParse(req.body || {});
    if (!updateParsed.success) {
      const errorMessage = updateParsed.error?.errors?.[0]?.message || 'Validation error';
      return res.status(400).json({ success: false, error: errorMessage });
    }

    const {
      prospectId, observationType, dateObserved, location, opponent, competition,
      minutesPlayed, rolePlayed, rating, notes, prospectTeamSide
    } = updateParsed.data;

    // Verifica che la sessione esista e appartenga al team
    const existingSession = await ScoutingModels.Session.findFirst({
      where: {
        id: req.params.id,
        teamId
      }
    });

    if (!existingSession) return res.status(404).json({ success: false, error: 'Session not found' });

    const session = await ScoutingModels.Session.update({
      where: { id: req.params.id },
      data: {
        prospectId,
        observationType,
        dateObserved: dateObserved ? new Date(dateObserved) : null,
        location: location || null,
        opponent: opponent || null,
        competition: competition || null,
        minutesPlayed: minutesPlayed || null,
        rolePlayed: rolePlayed || null,
        rating: rating || null,
        notes: notes || null,
        prospectTeamSide: prospectTeamSide || 'HOME',
        updatedAt: new Date()
      }
    });

    return res.json({ success: true, data: session });
  } catch (err) {
    console.error('[SessionController] updateSession error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// DELETE /api/scouting/sessions/:id
const deleteSession = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const parsed = sessionIdSchema.safeParse({ id: req.params.id });
    if (!parsed.success) return res.status(400).json({ success: false, error: 'Invalid session ID' });

    // Verifica che la sessione esista e appartenga al team
    const existingSession = await ScoutingModels.Session.findFirst({
      where: {
        id: req.params.id,
        teamId
      }
    });

    if (!existingSession) return res.status(404).json({ success: false, error: 'Session not found' });

    await ScoutingModels.Session.delete({
      where: { id: req.params.id }
    });

    return res.json({ success: true, message: 'Session deleted successfully' });
  } catch (err) {
    console.error('[SessionController] deleteSession error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// GET /api/scouting/sessions/:id/formations
const getFormations = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const { id } = req.params;
    // validate session id
    const sessionParsed = sessionIdSchema.safeParse({ id });
    if (!sessionParsed.success) return res.status(400).json({ success: false, error: 'Invalid session ID' });

    // Ensure the session belongs to the same team
    const session = await ScoutingModels.Session.findFirst({ where: { id, teamId } });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    // Get all formations for this session
    const formations = await ScoutingModels.Formation.findMany({
      where: { sessionId: id },
      orderBy: { teamSide: 'asc' }
    });

    return res.json({ success: true, data: formations });
  } catch (err) {
    console.error('[SessionController] getFormations error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

// POST /api/scouting/sessions/:id/formation
const upsertFormation = async (req, res) => {
  try {
    const teamId = req.context?.teamId;
    const userId = req.user?.profile?.id;
    if (!teamId) return res.status(401).json({ success: false, error: 'No team in session' });

    const { id } = req.params;
    // validate session id
    const sessionParsed = sessionIdSchema.safeParse({ id });
    if (!sessionParsed.success) return res.status(400).json({ success: false, error: 'Invalid session ID' });

    // Validate formation data
    const formationParsed = formationSchema.safeParse(req.body);
    if (!formationParsed.success) {
      const errorMessage = formationParsed.error?.errors?.[0]?.message || 'Validation error';
      return res.status(400).json({ success: false, error: errorMessage });
    }
    
    const { teamSide, formation, positions } = formationParsed.data;

    // Ensure the session belongs to the same team
    const session = await ScoutingModels.Session.findFirst({ where: { id, teamId } });
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    // Upsert formation
    const existing = await ScoutingModels.Formation.findFirst({ where: { sessionId: id, teamSide } });
    let saved;
    if (existing) {
      saved = await ScoutingModels.Formation.update({
        where: { id: existing.id },
        data: { formation, positions },
      });
    } else {
      saved = await ScoutingModels.Formation.create({
        data: { sessionId: id, teamSide, formation, positions },
      });
    }

    return res.json({ success: true, data: saved });
  } catch (err) {
    console.error('[SessionController] upsertFormation error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
};

module.exports = {
  listSessions,
  createSession,
  getSessionById,
  getFormations,
  updateSession,
  deleteSession,
  upsertFormation,
};


