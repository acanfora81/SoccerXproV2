require('dotenv').config();

console.log('🔵 Test variabili ambiente...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('DIRECT_URL presente:', !!process.env.DIRECT_URL);
console.log('DATABASE_URL inizia con:', process.env.DATABASE_URL?.substring(0, 50));
console.log('DIRECT_URL inizia con:', process.env.DIRECT_URL?.substring(0, 50));

// Test connessione database
const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔍 Test connessione database...');
    await prisma.$connect();
    console.log('✅ Connessione database riuscita');
    
    // Test query semplice
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test riuscita:', result);
    
  } catch (error) {
    console.error('🔴 Errore connessione database:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();




