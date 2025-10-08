// server/src/services/market/offersService.js
// Service per la gestione delle offerte di mercato

const { getPrismaClient } = require('../../config/database');
const prisma = getPrismaClient();

/**
 * Ottieni tutte le offerte del team con filtri
 */
const getAll = async (teamId, filters = {}) => {
  const { search, status, direction, negotiationId, agentId } = filters;

  const where = {
    teamId,
    ...(status && { status }),
    ...(direction && { direction }),
    ...(negotiationId && { negotiationId: Number(negotiationId) }),
    // ...(agentId && { agentId: Number(agentId) }),
    ...(search && {
      OR: [
        { notes: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  return prisma.market_offer.findMany({
    where,
    include: {
      negotiation: {
        select: {
          id: true,
          stage: true,
          status: true,
          player_first_name: true,
          player_last_name: true,
        },
      },
      // agent: {
      //   select: {
      //     id: true,
      //     first_name: true,
      //     last_name: true,
      //     agency: true,
      //   },
      // },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Ottieni un'offerta per ID con tutte le relazioni
 */
const getById = async (id, teamId) => {
  const offer = await prisma.market_offer.findFirst({
    where: { id: Number(id), teamId },
    include: {
      negotiation: {
        include: {
          target: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              position: true,
            },
          },
        },
      },
      // agent: true,
    },
  });

  if (!offer) {
    throw new Error('Offer not found');
  }

  return offer;
};

/**
 * Crea una nuova offerta
 */
const create = async (teamId, userId, data) => {
  // Verifica che la negotiation appartenga al team (se specificata)
  if (data.negotiationId) {
    const negotiation = await prisma.market_negotiation.findFirst({
      where: { id: Number(data.negotiationId), teamId },
    });
    if (!negotiation) {
      throw new Error('Negotiation not found for this team');
    }
  }

  // Verifica che l'agente appartenga al team (se specificato)
  // if (data.agentId) {
  //   const agent = await prisma.market_agent.findFirst({
  //     where: { id: Number(data.agentId), teamId },
  //   });
  //   if (!agent) {
  //     throw new Error('Agent not found for this team');
  //   }
  // }

  return prisma.market_offer.create({
    data: {
      teamId,
      negotiationId: data.negotiationId ? Number(data.negotiationId) : null,
      // agentId: data.agentId ? Number(data.agentId) : null,
      type: data.type || 'TRANSFER',
      direction: data.direction || 'IN',
      fee: data.fee || null,
      currency: data.currency || 'EUR',
      salary_offer: data.salary_offer || null,
      contract_years: data.contract_years ? Number(data.contract_years) : null,
      status: data.status || 'DRAFT',
      sent_date: data.sent_date ? new Date(data.sent_date) : null,
      response_date: data.response_date ? new Date(data.response_date) : null,
      notes: data.notes || null,
    },
    include: {
      negotiation: {
        select: {
          id: true,
          stage: true,
          status: true,
        },
      },
      // agent: {
      //   select: {
      //     id: true,
      //     first_name: true,
      //     last_name: true,
      //   },
      // },
    },
  });
};

/**
 * Aggiorna un'offerta esistente
 */
const update = async (id, teamId, data) => {
  // Verifica che l'offerta appartenga al team
  const existing = await prisma.market_offer.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Offer not found');
  }

  const updateData = {};

  // Campi base
  if ('type' in data) updateData.type = data.type;
  if ('direction' in data) updateData.direction = data.direction;
  if ('status' in data) updateData.status = data.status;

  // Relazioni
  if ('negotiationId' in data) updateData.negotiationId = data.negotiationId ? Number(data.negotiationId) : null;
  // if ('agentId' in data) updateData.agentId = data.agentId ? Number(data.agentId) : null;

  // Valori economici
  if ('fee' in data) updateData.fee = data.fee || null;
  if ('salary_offer' in data) updateData.salary_offer = data.salary_offer || null;
  if ('contract_years' in data) updateData.contract_years = data.contract_years ? Number(data.contract_years) : null;
  if ('currency' in data) updateData.currency = data.currency;

  // Date e note
  if ('sent_date' in data) updateData.sent_date = data.sent_date ? new Date(data.sent_date) : null;
  if ('response_date' in data) updateData.response_date = data.response_date ? new Date(data.response_date) : null;
  if ('notes' in data) updateData.notes = data.notes || null;

  return prisma.market_offer.update({
    where: { id: Number(id) },
    data: updateData,
    include: {
      negotiation: {
        select: {
          id: true,
          stage: true,
          status: true,
        },
      },
      // agent: {
      //   select: {
      //     id: true,
      //     first_name: true,
      //     last_name: true,
      //   },
      // },
    },
  });
};

/**
 * Elimina definitivamente un'offerta
 */
const remove = async (id, teamId) => {
  // Verifica che l'offerta appartenga al team
  const existing = await prisma.market_offer.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Offer not found');
  }

  return prisma.market_offer.delete({
    where: { id: Number(id) },
  });
};

/**
 * Accetta un'offerta
 */
const accept = async (id, teamId) => {
  const existing = await prisma.market_offer.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Offer not found');
  }

  return prisma.market_offer.update({
    where: { id: Number(id) },
    data: { status: 'ACCEPTED' },
  });
};

/**
 * Rifiuta un'offerta
 */
const reject = async (id, teamId) => {
  const existing = await prisma.market_offer.findFirst({
    where: { id: Number(id), teamId },
  });

  if (!existing) {
    throw new Error('Offer not found');
  }

  return prisma.market_offer.update({
    where: { id: Number(id) },
    data: { status: 'REJECTED' },
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  accept,
  reject,
};
