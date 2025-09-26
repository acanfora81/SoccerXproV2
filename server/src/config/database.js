// server/src/config/database.js
const { PrismaClient } = require('../../prisma/generated/client');

console.log('🟢 [INFO] Inizializzazione database config...'); // INFO - rimuovere in produzione

// Configurazione URL database
const originalUrl = process.env.DIRECT_URL || process.env.DATABASE_URL || '';
if (!originalUrl) {
  throw new Error('DATABASE_URL o DIRECT_URL non configurata. Verifica server/.env');
}

// Aggiungi parametri solo se non sono già presenti
let databaseUrl = originalUrl;
if (!databaseUrl.includes('prepared_statements=false')) {
  databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'prepared_statements=false';
}
if (!databaseUrl.includes('connection_limit=')) {
  databaseUrl += (databaseUrl.includes('?') ? '&' : '?') + 'connection_limit=1';
}

console.log('🔵 [DEBUG] Database URL configurato per disabilitare prepared statements'); // INFO DEV - rimuovere in produzione

// Crea una nuova istanza di Prisma ogni volta per evitare conflitti
function createPrismaClient() {
  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl
      }
    },
    log: process.env.NODE_ENV === 'production' 
      ? ['error'] 
      : ['error'], // Solo errori per ridurre verbosità
    errorFormat: 'pretty'
  });
}

// Istanza Prisma singleton per l'app
let sharedPrisma = null;

function getPrismaClient() {
  if (!sharedPrisma) {
    console.log('🔵 [DEBUG] Creazione nuovo Prisma Client...'); // INFO DEV - rimuovere in produzione
    sharedPrisma = createPrismaClient();
    console.log('🟢 [INFO] Prisma Client inizializzato'); // INFO - rimuovere in produzione
  }
  return sharedPrisma;
}

// Test connessione al primo utilizzo
let connectionTested = false;

async function testConnection() {
  if (connectionTested) return;
  
  try {
    console.log('🔵 [DEBUG] Test connessione database...'); // INFO DEV - rimuovere in produzione
    await prisma.$connect();
    // Test semplice senza query raw per evitare problemi con prepared statements
    await prisma.team.findFirst({ take: 1 });
    console.log('🟢 [INFO] Connessione database OK'); // INFO - rimuovere in produzione
    connectionTested = true;
  } catch (error) {
    console.log('🔴 Errore test connessione database:', error.message); // ERROR - mantenere essenziali
    throw error;
  }
}

// Test connessione automatico disabilitato per evitare conflitti con prepared statements
// testConnection().catch(err => {
//   console.log('🔴 CRITICO: Impossibile connettersi al database:', err.message); // ERROR - mantenere essenziali
// });

// Chiudi con grazia se il processo termina
process.on('beforeExit', async () => {
  try {
    console.log('🟡 [WARN] Chiusura connessione database...'); // WARNING - rimuovere in produzione
    if (sharedPrisma) {
      await sharedPrisma.$disconnect();
      console.log('🟢 [INFO] Database disconnesso'); // INFO - rimuovere in produzione
    }
  } catch (error) {
    console.log('🔴 Errore disconnessione database:', error.message); // ERROR - mantenere essenziali
  }
});

// Gestione errori di connessione
process.on('SIGINT', async () => {
  console.log('🟡 [WARN] SIGINT ricevuto, chiusura database...'); // WARNING - rimuovere in produzione
  if (sharedPrisma) {
    await sharedPrisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🟡 [WARN] SIGTERM ricevuto, chiusura database...'); // WARNING - rimuovere in produzione  
  if (sharedPrisma) {
    await sharedPrisma.$disconnect();
  }
  process.exit(0);
});

module.exports = { 
  getPrismaClient,
  testConnection 
};