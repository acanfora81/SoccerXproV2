const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Ottieni tutti i giocatori di un team
 */
const getPlayersByTeam = async (teamId) => {
  return await prisma.player.findMany({
    where: { teamId },
    orderBy: { lastName: 'asc' }
  });
};

/**
 * Ottieni un giocatore per ID
 */
const getPlayerById = async (playerId) => {
  return await prisma.player.findUnique({
    where: { id: Number(playerId) }
  });
};

/**
 * Crea un nuovo giocatore
 */
const createPlayer = async (playerData) => {
  return await prisma.player.create({
    data: playerData
  });
};

/**
 * Aggiorna un giocatore
 */
const updatePlayer = async (playerId, playerData) => {
  return await prisma.player.update({
    where: { id: Number(playerId) },
    data: playerData
  });
};

/**
 * Elimina un giocatore
 */
const deletePlayer = async (playerId) => {
  return await prisma.player.delete({
    where: { id: Number(playerId) }
  });
};

// 🔹 Estensioni modulo Giocatori
/**
 * Aggiorna lo stato di un giocatore
 */
const updatePlayerStatus = async (playerId, status) => {
  return await prisma.player.update({
    where: { id: Number(playerId) },
    data: { isActive: status === 'active' }
  });
};

module.exports = {
  getPlayersByTeam,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
  updatePlayerStatus
};

