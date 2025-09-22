const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function updateTaxRatesCorrect() {
  try {
    console.log('🔵 Aggiornamento aliquote corrette 2025...');

    // Aggiorna aliquote PROFESSIONAL
    await prisma.taxRate.updateMany({
      where: {
        year: 2025,
        type: 'PROFESSIONAL'
      },
      data: {
        // Contributi lavoratore
        inpsWorker: 9.19,        // ✅ Corretto
        ffcWorker: 1.25,         // ✅ Corretto (era 6.25)
        solidarityWorker: 0.5,   // ✅ Corretto
        
        // Contributi datore
        inpsEmployer: 23.81,     // ✅ Corretto (era 30)
        inailEmployer: 7.90,     // ✅ Corretto (era 1.5)
        ffcEmployer: 6.25,       // ✅ Corretto
        solidarityEmployer: 0.5  // ✅ Corretto
      }
    });

    console.log('✅ Aliquote PROFESSIONAL aggiornate');

    // Aggiorna aliquote APPRENTICESHIP
    await prisma.taxRate.updateMany({
      where: {
        year: 2025,
        type: 'APPRENTICESHIP'
      },
      data: {
        // Contributi lavoratore
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.5,
        
        // Contributi datore
        inpsEmployer: 23.81,
        inailEmployer: 7.90,
        ffcEmployer: 6.25,
        solidarityEmployer: 0.5
      }
    });

    console.log('✅ Aliquote APPRENTICESHIP aggiornate');

    // Aggiorna scaglioni IRPEF
    await prisma.tax_irpef_bracket.deleteMany({
      where: { year: 2025 }
    });

    const irpefBrackets = [
      { min: 0, max: 28000, rate: 23 },
      { min: 28000, max: 35000, rate: 33 },  // ✅ Corretto (era 35%)
      { min: 35000, max: null, rate: 43 }
    ];

    for (const bracket of irpefBrackets) {
      await prisma.tax_irpef_bracket.create({
        data: {
          year: 2025,
          min: bracket.min,
          max: bracket.max,
          rate: bracket.rate
        }
      });
      console.log(`✅ Scaglione IRPEF: ${bracket.min}€ - ${bracket.max || '∞'}€ (${bracket.rate}%)`);
    }

    // Aggiorna detrazioni
    await prisma.tax_config.updateMany({
      where: { year: 2025 },
      data: {
        detrazionifixed: 1880  // ✅ Corretto (era 3080)
      }
    });

    console.log('✅ Detrazioni aggiornate a 1.880€');

    // Aggiorna addizionali per Marche/Pesaro
    await prisma.tax_regional_additional.updateMany({
      where: { year: 2025, region: 'DEFAULT' },
      data: { rate: 1.23 }  // ✅ Corretto (era 1.0)
    });

    await prisma.tax_municipal_additional.updateMany({
      where: { year: 2025, region: 'DEFAULT', municipality: 'DEFAULT' },
      data: { rate: 0.8 }   // ✅ Corretto (era 0.5)
    });

    console.log('✅ Addizionali aggiornate: 1,23% + 0,8% = 2,03%');

    console.log('🎯 Aggiornamento completato!');

  } catch (error) {
    console.error('🔴 Errore durante l\'aggiornamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateTaxRatesCorrect();




