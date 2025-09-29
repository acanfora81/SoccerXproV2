const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function populateNewTaxColumns() {
  try {
    console.log('🔵 Inizio popolamento nuove colonne tax_rates...');

    // Recupera tutti i record esistenti
    const existingRates = await prisma.taxRate.findMany();
    
    console.log(`🔵 Trovati ${existingRates.length} record da aggiornare`);

    for (const rate of existingRates) {
      console.log(`🔵 Aggiornando record ID ${rate.id} (${rate.type} ${rate.year})`);

      // Calcola i nuovi valori basati sui dati esistenti
      const inpsWorker = parseFloat(rate.inps) || 0;
      const ffcWorker = parseFloat(rate.ffc) || 0;
      
      // Determina le aliquote datore in base al tipo
      let inpsEmployer, inailEmployer;
      if (rate.type === 'PROFESSIONAL') {
        inpsEmployer = 30.0;
        inailEmployer = 1.5;
      } else if (rate.type === 'APPRENTICESHIP') {
        inpsEmployer = 15.0;
        inailEmployer = 0.8;
      } else {
        inpsEmployer = 10.0;
        inailEmployer = 1.0;
      }

      // Aggiorna il record con i nuovi valori
      await prisma.taxRate.update({
        where: { id: rate.id },
        data: {
          inpsWorker: inpsWorker,
          inpsEmployer: inpsEmployer,
          inailEmployer: inailEmployer,
          ffcWorker: ffcWorker,
          ffcEmployer: 0.0,
          solidarityWorker: 0.0,
          solidarityEmployer: 0.5
        }
      });

      console.log(`✅ Aggiornato record ${rate.id}:`, {
        inpsWorker,
        inpsEmployer,
        inailEmployer,
        ffcWorker
      });
    }

    console.log('🟢 Popolamento completato con successo!');

    // Verifica i risultati
    const updatedRates = await prisma.taxRate.findMany();
    console.log('🔵 Verifica risultati:');
    updatedRates.forEach(rate => {
      console.log(`- ${rate.type} ${rate.year}: Worker(${rate.inpsWorker}%/${rate.ffcWorker}%) Employer(${rate.inpsEmployer}%/${rate.inailEmployer}%)`);
    });

  } catch (error) {
    console.error('🔴 Errore durante il popolamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateNewTaxColumns();














