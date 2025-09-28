const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function testSlopeField() {
  try {
    console.log('🔵 Test campo slope...');
    
    // Test 1: Verifica che le tabelle esistano
    console.log('🔍 Test 1: Verifica esistenza tabelle...');
    
    // Test 2: Prova a inserire un record con slope
    console.log('🔍 Test 2: Inserimento record con slope...');
    
    const testRecord = await prisma.tax_extra_deduction_rule.create({
      data: {
        year: 2025,
        min: 0,
        max: 15000,
        amount: 100,
        slope: 0.05
      }
    });
    
    console.log('✅ Record creato con successo:', testRecord);
    
    // Test 3: Leggi il record
    console.log('🔍 Test 3: Lettura record...');
    
    const readRecord = await prisma.tax_extra_deduction_rule.findUnique({
      where: { id: testRecord.id }
    });
    
    console.log('✅ Record letto:', readRecord);
    
    // Test 4: Pulisci il record di test
    console.log('🔍 Test 4: Pulizia record di test...');
    
    await prisma.tax_extra_deduction_rule.delete({
      where: { id: testRecord.id }
    });
    
    console.log('✅ Record eliminato');
    console.log('🎯 Test completato con successo!');
    
  } catch (error) {
    console.error('🔴 Errore durante il test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSlopeField();




