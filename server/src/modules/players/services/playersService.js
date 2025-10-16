// Percorso: server/src/modules/players/services/playersService.js
const { getPrismaClient } = require('../../../config/database');

const getPlayersByTeam = async (teamId) => {
  const prisma = getPrismaClient();
  return await prisma.player.findMany({
    where: { teamId },
    orderBy: { lastName: 'asc' }
  });
};

const getPlayerById = async (playerId) => {
  const prisma = getPrismaClient();
  return await prisma.player.findUnique({ where: { id: Number(playerId) } });
};

const createPlayer = async (playerData) => {
  const prisma = getPrismaClient();
  return await prisma.player.create({ data: playerData });
};

const updatePlayer = async (playerId, playerData) => {
  const prisma = getPrismaClient();
  return await prisma.player.update({ where: { id: Number(playerId) }, data: playerData });
};

const deletePlayer = async (playerId) => {
  const prisma = getPrismaClient();
  return await prisma.player.delete({ where: { id: Number(playerId) } });
};

const updatePlayerStatus = async (playerId, status) => {
  const prisma = getPrismaClient();
  return await prisma.player.update({ where: { id: Number(playerId) }, data: { isActive: status === 'active' } });
};

module.exports = {
  getPlayersByTeam,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  updatePlayerStatus
};


















