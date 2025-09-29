// Test DIRECT_URL
require('dotenv').config({ path: __dirname + '/../../.env' });

console.log('🔵 [TEST] Test DIRECT_URL...');
console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Configurato' : 'Non configurato');

if (process.env.DIRECT_URL) {
  console.log('✅ [TEST] DIRECT_URL trovato');
  console.log('URL:', process.env.DIRECT_URL.substring(0, 50) + '...');
  
  // Test connessione con DIRECT_URL
  const { PrismaClient } = require('../../prisma/generated/client');
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL
      }
    }
  });
  
  prisma.$connect()
    .then(() => {
      console.log('✅ [TEST] Connessione con DIRECT_URL riuscita');
      return prisma.$disconnect();
    })
    .catch(err => {
      console.error('❌ [TEST] Errore connessione DIRECT_URL:', err.message);
    });
} else {
  console.log('❌ [TEST] DIRECT_URL non configurato');
}








