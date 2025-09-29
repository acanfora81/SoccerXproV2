const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function updateTaxRates2025() {
  try {
    console.log('🔵 Aggiornamento aliquote 2025 corrette...');

    // Aggiorna PROFESSIONAL con aliquote corrette
    await prisma.taxRate.updateMany({
      where: { 
        type: 'PROFESSIONAL',
        year: 2025
      },
      data: {
        inpsWorker: 9.19,    // Corretto (era 29.58)
        inpsEmployer: 30.0,  // Mantenuto
        inailEmployer: 1.5,  // Mantenuto
        ffcWorker: 6.25,     // Mantenuto
        ffcEmployer: 0.0,    // Mantenuto
        solidarityWorker: 0.0,    // Mantenuto
        solidarityEmployer: 0.5   // Mantenuto
      }
    });

    // Aggiorna APPRENTICESHIP con aliquote corrette
    await prisma.taxRate.updateMany({
      where: { 
        type: 'APPRENTICESHIP',
        year: 2025
      },
      data: {
        inpsWorker: 5.84,    // Corretto (era 11.61)
        inpsEmployer: 15.0,  // Mantenuto
        inailEmployer: 0.8,  // Mantenuto
        ffcWorker: 6.25,     // Mantenuto
        ffcEmployer: 0.0,    // Mantenuto
        solidarityWorker: 0.0,    // Mantenuto
        solidarityEmployer: 0.5   // Mantenuto
      }
    });

    console.log('✅ Aliquote 2025 aggiornate con successo!');

    // Verifica i risultati
    const updatedRates = await prisma.taxRate.findMany({
      where: { year: 2025 }
    });
    
    console.log('🔵 Aliquote finali 2025:');
    updatedRates.forEach(rate => {
      console.log(`- ${rate.type}: Worker(${rate.inpsWorker}%/${rate.ffcWorker}%) Employer(${rate.inpsEmployer}%/${rate.inailEmployer}%)`);
    });

  } catch (error) {
    console.error('🔴 Errore durante l\'aggiornamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaxRates2025();














