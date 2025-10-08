// server/src/services/market/targetsService.js
// Service per la gestione dei target di mercato

const { getPrismaClient } = require('../../config/database');
const prisma = getPrismaClient();

/**
 * Ottieni tutti i target del team con filtri
 */
const getAll = async (teamId, filters = {}) => {
  const { search, status, priority, position, agentId } = filters;

  const where = {
    teamId,
    ...(status && { status }),
    ...(priority && { priority: Number(priority) }),
    ...(position && { position }),
    ...(agentId && { agentId: Number(agentId) }),
    ...(search && {
      OR: [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { current_club: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  return prisma.market_target.findMany({
    where,
    include: {
      agent: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          agency: true,
        },
      },
      _count: {
        select: {
          market_negotiation: true,
        },
      },
    },
    orderBy: [
      { priority: 'asc' },
      { updatedAt: 'desc' },
    ],
  });
};

/**
 * Ottieni un target per ID con tutte le relazioni
 */
const getById = async (id, teamId) => {
  const target = await prisma.market_target.findFirst({
    where: { id: Number(id), teamId },
    include: {
      agent: true,
      market_negotiation: {
        include: {
          agent: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          position: true,
        },
      },
    },
  });

  if (!target) {
    throw new Error('Target not found');
  }

  return target;
};

/**
 * Crea un nuovo target
 */
const create = async (teamId, userId, data) => {
  return prisma.market_target.create({
    data: {
      teamId,
      discovery_user_id: userId,
      first_name: data.first_name,
      last_name: data.last_name,
      nationality: data.nationality || null,
      position: data.position || null,
      date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
      age: data.age ? Number(data.age) : null,
      foot: data.foot || null,
      height_cm: data.height_cm ? Number(data.height_cm) : null,
      weight_kg: data.weight_kg ? Number(data.weight_kg) : null,
      preferred_role: data.preferred_role || null,
      secondary_roles: data.secondary_roles || null,
      player_style: data.player_style || null,
      current_club: data.current_club || null,
      club_country: data.club_country || null,
      contract_until: data.contract_until ? new Date(data.contract_until) : null,
      current_salary: data.current_salary || null,
      market_value: data.market_value || null,
      previous_market_value: data.previous_market_value || null,
      playerId: data.playerId ? Number(data.playerId) : null,
      agentId: data.agentId ? Number(data.agentId) : null,
      agent_contact_name: data.agent_contact_name || null,
      agent_contact_phone: data.agent_contact_phone || null,
      priority: data.priority || 3,
      status: data.status || 'SCOUTING',
      notes: data.notes || null,
      scouting_report: data.scouting_report || null,
      overall_rating: data.overall_rating ? Number(data.overall_rating) : null,
      potential_rating: data.potential_rating ? Number(data.potential_rating) : null,
      transfer_likelihood: data.transfer_likelihood ? Number(data.transfer_likelihood) : null,
      recommendation_level: data.recommendation_level ? Number(data.recommendation_level) : 3,
      video_url: data.video_url || null,
      profile_url: data.profile_url || null,
      discovery_method: data.discovery_method || null,
      scouting_source: data.scouting_source || null,
      report_confidence: data.report_confidence ? Number(data.report_confidence) : null,
      last_scouted_at: data.last_scouted_at ? new Date(data.last_scouted_at) : null,
    },
    include: {
      agent: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });
};

/**
 * Aggiorna un target esistente
 */
const update = async (id, teamId, data) => {
  // Verifica che il target appartenga al team
  const existing = await prisma.market_target.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Target not found');
  }

  const updateData = {};
  
  // Campi anagrafici
  if ('first_name' in data) updateData.first_name = data.first_name;
  if ('last_name' in data) updateData.last_name = data.last_name;
  if ('nationality' in data) updateData.nationality = data.nationality || null;
  if ('position' in data) updateData.position = data.position || null;
  if ('date_of_birth' in data) updateData.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;
  if ('age' in data) updateData.age = data.age ? Number(data.age) : null;
  if ('foot' in data) updateData.foot = data.foot || null;
  if ('height_cm' in data) updateData.height_cm = data.height_cm ? Number(data.height_cm) : null;
  if ('weight_kg' in data) updateData.weight_kg = data.weight_kg ? Number(data.weight_kg) : null;

  // Campi tecnici
  if ('preferred_role' in data) updateData.preferred_role = data.preferred_role || null;
  if ('secondary_roles' in data) updateData.secondary_roles = data.secondary_roles || null;
  if ('player_style' in data) updateData.player_style = data.player_style || null;

  // Club e contratto
  if ('current_club' in data) updateData.current_club = data.current_club || null;
  if ('club_country' in data) updateData.club_country = data.club_country || null;
  if ('contract_until' in data) updateData.contract_until = data.contract_until ? new Date(data.contract_until) : null;
  if ('current_salary' in data) updateData.current_salary = data.current_salary || null;
  if ('market_value' in data) updateData.market_value = data.market_value || null;
  if ('previous_market_value' in data) updateData.previous_market_value = data.previous_market_value || null;

  // Relazioni
  if ('playerId' in data) updateData.playerId = data.playerId ? Number(data.playerId) : null;
  if ('agentId' in data) updateData.agentId = data.agentId ? Number(data.agentId) : null;
  if ('agent_contact_name' in data) updateData.agent_contact_name = data.agent_contact_name || null;
  if ('agent_contact_phone' in data) updateData.agent_contact_phone = data.agent_contact_phone || null;

  // Stato e priorità
  if ('priority' in data) updateData.priority = Number(data.priority);
  if ('status' in data) updateData.status = data.status;
  if ('notes' in data) updateData.notes = data.notes || null;

  // Valutazioni e scouting
  if ('scouting_report' in data) updateData.scouting_report = data.scouting_report || null;
  if ('overall_rating' in data) updateData.overall_rating = data.overall_rating ? Number(data.overall_rating) : null;
  if ('potential_rating' in data) updateData.potential_rating = data.potential_rating ? Number(data.potential_rating) : null;
  if ('transfer_likelihood' in data) updateData.transfer_likelihood = data.transfer_likelihood ? Number(data.transfer_likelihood) : null;
  if ('recommendation_level' in data) updateData.recommendation_level = data.recommendation_level ? Number(data.recommendation_level) : null;
  if ('report_confidence' in data) updateData.report_confidence = data.report_confidence ? Number(data.report_confidence) : null;
  if ('last_scouted_at' in data) updateData.last_scouted_at = data.last_scouted_at ? new Date(data.last_scouted_at) : null;

  // URL e metodi
  if ('video_url' in data) updateData.video_url = data.video_url || null;
  if ('profile_url' in data) updateData.profile_url = data.profile_url || null;
  if ('discovery_method' in data) updateData.discovery_method = data.discovery_method || null;
  if ('scouting_source' in data) updateData.scouting_source = data.scouting_source || null;

  return prisma.market_target.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      agent: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
        },
      },
    },
  });
};

/**
 * Elimina (soft delete) un target
 */
const remove = async (id, teamId) => {
  // Verifica che il target appartenga al team
  const existing = await prisma.market_target.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Target not found');
  }

  // Soft delete: cambia status in ARCHIVED
  return prisma.market_target.update({
    where: { id: Number(id) },
    data: { status: 'ARCHIVED' },
  });
};

/**
 * Converti target in player
 */
const convertToPlayer = async (id, teamId) => {
  const target = await prisma.market_target.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!target) {
    throw new Error('Target not found');
  }

  if (target.converted_player_id) {
    throw new Error('Target already converted to player');
  }

  // TODO: Implementare la logica di conversione in Player
  // Per ora lanciamo un errore che indica che va implementata
  throw new Error('Player conversion not yet implemented');
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  convertToPlayer,
};

