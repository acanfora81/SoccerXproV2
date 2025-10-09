const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Crea una nuova nota per un giocatore
 */
const createNote = async ({ playerId, userId, content, type, visibility }) => {
  // TODO: Implementare la logica di creazione nota
  // Questo è un placeholder - il modello player_notes dovrebbe essere aggiunto al schema Prisma
  
  return {
    id: Date.now(), // Placeholder
    playerId,
    userId,
    content,
    type: type || 'GENERAL',
    visibility: visibility || 'PRIVATE',
    createdAt: new Date()
  };
};

/**
 * Ottieni tutte le note di un giocatore
 */
const getNotesByPlayer = async ({ playerId, userId, userRole }) => {
  // TODO: Implementare la logica di recupero note
  // Filtrare per visibility in base al ruolo dell'utente
  
  return [];
};

module.exports = {
  createNote,
  getNotesByPlayer
};

