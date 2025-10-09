const { getPrismaClient } = require('../config/database');

/**
 * Carica un media per un giocatore
 */
const uploadPlayerMediaFile = async ({ playerId, userId, type, url, title }) => {
  // TODO: Implementare quando il modello PlayerMedia sarà aggiunto al schema Prisma
  
  /*
  const prisma = getPrismaClient();
  return await prisma.playerMedia.create({
    data: {
      playerId: Number(playerId),
      type: type || 'IMAGE',
      url,
      title,
      uploadedById: userId,
    },
    include: {
      uploadedBy: {
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });
  */

  return {
    id: Date.now(),
    playerId: Number(playerId),
    type: type || 'IMAGE',
    url,
    title,
    uploadedById: userId,
    uploadedAt: new Date()
  };
};

/**
 * Ottieni tutti i media di un giocatore
 */
const getPlayerMediaList = async ({ playerId }) => {
  // TODO: Implementare quando il modello PlayerMedia sarà aggiunto al schema Prisma
  
  /*
  const prisma = getPrismaClient();
  return await prisma.playerMedia.findMany({
    where: { playerId: Number(playerId) },
    orderBy: { uploadedAt: 'desc' },
    include: {
      uploadedBy: {
        select: {
          id: true,
          first_name: true,
          last_name: true
        }
      }
    }
  });
  */

  return [];
};

module.exports = {
  uploadPlayerMediaFile,
  getPlayerMediaList
};
