// server/src/config/database.js
const { PrismaClient } = require('../../prisma/generated/client');

console.log('🟢 [INFO] Inizializzazione database config...'); // INFO - rimuovere in produzione

// Usa una variabile globale per evitare nuovi client ad ogni hot-reload
let prisma = global.__PRISMA__;

if (!prisma) {
  console.log('🔵 [DEBUG] Creazione nuovo Prisma Client...'); // INFO DEV - rimuovere in produzione
  
  // Modifica URL per disabilitare prepared statements (fix errore PostgreSQL)
  const originalUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
  if (!originalUrl) {
    throw new Error('DATABASE_URL o DIRECT_URL non configurata. Verifica server/.env');
  }
  const modifiedUrl = originalUrl + (
    originalUrl.includes('?') ? '&' : '?'
  ) + 'prepared_statements=false';
  
  console.log('🔵 [DEBUG] Database URL modificato per disabilitare prepared statements'); // INFO DEV - rimuovere in produzione
  
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: modifiedUrl
      }
    },
    log: process.env.NODE_ENV === 'production' 
      ? ['error'] 
      : ['error', 'warn'], // Rimuovi 'query' per meno verbosità 
    errorFormat: 'pretty'
  });
  
  global.__PRISMA__ = prisma;
  console.log('🟢 [INFO] Prisma Client inizializzato con prepared_statements=false'); // INFO - rimuovere in produzione
} else {
  console.log('🔵 [DEBUG] Riutilizzo Prisma Client esistente'); // INFO DEV - rimuovere in produzione
}

function getPrismaClient() {
  if (!prisma) {
    console.log('🟡 [WARN] Warning: getPrismaClient chiamato ma prisma non inizializzato'); // WARNING - rimuovere in produzione
    throw new Error('Prisma client non inizializzato');
  }
  return prisma;
}

// Test connessione al primo utilizzo
let connectionTested = false;

async function testConnection() {
  if (connectionTested) return;
  
  try {
    console.log('🔵 [DEBUG] Test connessione database...'); // INFO DEV - rimuovere in produzione
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('🟢 [INFO] Connessione database OK'); // INFO - rimuovere in produzione
    connectionTested = true;
  } catch (error) {
    console.log('🔴 Errore test connessione database:', error.message); // ERROR - mantenere essenziali
    throw error;
  }
}

// Test connessione automatico
testConnection().catch(err => {
  console.log('🔴 CRITICO: Impossibile connettersi al database:', err.message); // ERROR - mantenere essenziali
});

// Chiudi con grazia se il processo termina
process.on('beforeExit', async () => {
  try {
    console.log('🟡 [WARN] Chiusura connessione database...'); // WARNING - rimuovere in produzione
    if (prisma) {
      await prisma.$disconnect();
      console.log('🟢 [INFO] Database disconnesso'); // INFO - rimuovere in produzione
    }
  } catch (error) {
    console.log('🔴 Errore disconnessione database:', error.message); // ERROR - mantenere essenziali
  }
});

// Gestione errori di connessione
process.on('SIGINT', async () => {
  console.log('🟡 [WARN] SIGINT ricevuto, chiusura database...'); // WARNING - rimuovere in produzione
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🟡 [WARN] SIGTERM ricevuto, chiusura database...'); // WARNING - rimuovere in produzione  
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

module.exports = { 
  getPrismaClient,
  testConnection 
};