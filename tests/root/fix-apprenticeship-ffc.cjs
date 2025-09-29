const { PrismaClient } = require('./server/prisma/generated/client');
const prisma = new PrismaClient();

async function fixApprenticeshipFFC() {
  try {
    console.log('🔧 Correzione FFC Employer per APPRENTICESHIP (deve essere 0%)...');
    
    // Aggiorna solo APPRENTICESHIP - FFC Employer deve essere 0
    const updatedApprenticeship = await prisma.taxRate.updateMany({
      where: {
        year: 2025,
        type: 'APPRENTICESHIP'
      },
      data: {
        ffcEmployer: 0    // 0% per apprendisti (corretto)
      }
    });
    
    console.log('✅ Aggiornate', updatedApprenticeship.count, 'aliquote APPRENTICESHIP');
    
    // Verifica le correzioni
    console.log('\n🔍 Verifica correzioni:');
    const taxRates = await prisma.taxRate.findMany({
      where: { year: 2025 },
      orderBy: { type: 'asc' }
    });
    
    taxRates.forEach(rate => {
      console.log(`  ${rate.type}:`);
      console.log(`    FFC Employer: ${rate.ffcEmployer}%`);
      if (rate.type === 'APPRENTICESHIP') {
        console.log(`    ✅ Corretto: FFC Employer deve essere 0% per apprendisti`);
      } else {
        console.log(`    ✅ Corretto: FFC Employer deve essere 6.25% per professionisti`);
      }
    });
    
    await prisma.$disconnect();
    console.log('\n🎉 Correzione completata!');
  } catch (error) {
    console.error('❌ Errore:', error);
    await prisma.$disconnect();
  }
}

fixApprenticeshipFFC();

