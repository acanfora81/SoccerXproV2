const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Crea una nuova nota per un giocatore
 */
const createPlayerNote = async ({ playerId, userId, teamId, title, content }) => {
  // TODO: Implementare quando il modello PlayerNote sarà aggiunto al schema Prisma
  // Per ora restituisco un oggetto placeholder
  
  /* 
  return await prisma.playerNote.create({
    data: {
      playerId: Number(playerId),
      userId,
      title,
      content,
      player: { connect: { id: Number(playerId) } },
      author: { connect: { id: userId } },
    },
  });
  */

  return {
    id: Date.now(),
    playerId: Number(playerId),
    userId,
    title,
    content,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

/**
 * Ottieni tutte le note di un giocatore
 */
const getNotesByPlayer = async ({ playerId, teamId }) => {
  // TODO: Implementare quando il modello PlayerNote sarà aggiunto al schema Prisma
  
  /*
  return await prisma.playerNote.findMany({
    where: {
      playerId: Number(playerId),
      player: { teamId },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
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
  createPlayerNote,
  getNotesByPlayer
};
