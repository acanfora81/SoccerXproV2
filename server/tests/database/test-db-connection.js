// Test connessione database
const { PrismaClient } = require('../../prisma/generated/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔵 [TEST] Test connessione database...');
    
    // Test connessione
    await prisma.$connect();
    console.log('✅ [TEST] Connessione database riuscita');
    
    // Test query semplice
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ [TEST] Query test riuscita:', result);
    
    // Test schema
    const schemas = await prisma.$queryRaw`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'soccerxpro'`;
    console.log('✅ [TEST] Schema soccerxpro trovato:', schemas);
    
  } catch (error) {
    console.error('❌ [TEST] Errore connessione database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();


