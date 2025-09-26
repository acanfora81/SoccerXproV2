const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function testTaxRatesEndpoint() {
  try {
    console.log('🔵 Test endpoint taxrates...');
    
    const teamId = '4c831261-56a6-4ef7-bc26-b25e2b85846b';
    
    console.log('🔍 Test 1: Verifica teamId...');
    console.log('TeamId:', teamId);
    
    console.log('🔍 Test 2: Query taxRate...');
    
    const taxRates = await prisma.taxRate.findMany({
      where: { teamId },
      orderBy: [
        { year: 'desc' },
        { type: 'asc' }
      ]
    });
    
    console.log('✅ TaxRates trovate:', taxRates.length);
    console.log('🔵 Esempio aliquota:', taxRates[0] ? {
      id: taxRates[0].id,
      year: taxRates[0].year,
      type: taxRates[0].type,
      inpsWorker: taxRates[0].inpsWorker,
      inpsEmployer: taxRates[0].inpsEmployer,
      inailEmployer: taxRates[0].inailEmployer,
      ffcWorker: taxRates[0].ffcWorker,
      ffcEmployer: taxRates[0].ffcEmployer,
      solidarityWorker: taxRates[0].solidarityWorker,
      solidarityEmployer: taxRates[0].solidarityEmployer
    } : 'Nessuna aliquota trovata');
    
    console.log('🔍 Test 3: Query IRPEF brackets...');
    
    const irpefBrackets = await prisma.tax_irpef_bracket.findMany({
      where: { year: 2025 },
      orderBy: { min: 'asc' }
    });
    
    console.log('✅ IRPEF Brackets trovate:', irpefBrackets.length);
    console.log('🔵 Esempio bracket:', irpefBrackets[0] ? {
      id: irpefBrackets[0].id,
      year: irpefBrackets[0].year,
      min: irpefBrackets[0].min,
      max: irpefBrackets[0].max,
      rate: irpefBrackets[0].rate
    } : 'Nessun bracket trovato');
    
    console.log('🎯 Test completato con successo!');
    
  } catch (error) {
    console.error('🔴 Errore durante il test:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testTaxRatesEndpoint();


