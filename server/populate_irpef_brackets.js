const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function populateIrpefBrackets() {
  try {
    console.log('🔵 Popolamento scaglioni IRPEF 2025...');

    // Scaglioni IRPEF 2025
    const irpefBrackets = [
      { min: 0, max: 28000, rate: 23 },
      { min: 28000, max: 50000, rate: 35 },
      { min: 50000, max: null, rate: 43 }
    ];

    // Verifica se esistono già
    const existing = await prisma.tax_irpef_bracket.findMany({
      where: { year: 2025 }
    });

    if (existing.length > 0) {
      console.log('⚠️ Scaglioni IRPEF 2025 già esistenti, aggiornamento...');
      await prisma.tax_irpef_bracket.deleteMany({
        where: { year: 2025 }
      });
    }

    // Inserisci i nuovi scaglioni
    for (const bracket of irpefBrackets) {
      await prisma.tax_irpef_bracket.create({
        data: {
          year: 2025,
          min: bracket.min,
          max: bracket.max,
          rate: bracket.rate
        }
      });
      console.log(`✅ Inserito scaglione: ${bracket.min}€ - ${bracket.max || '∞'}€ (${bracket.rate}%)`);
    }

    console.log('🟢 Scaglioni IRPEF 2025 popolati con successo!');

    // Popola anche la configurazione fiscale
    const existingConfig = await prisma.tax_config.findUnique({
      where: { year: 2025 }
    });

    if (!existingConfig) {
      await prisma.tax_config.create({
        data: {
          year: 2025,
          contributionrate: 0,
          solidarityrate: 0,
          detrazionifixed: 3080, // Detrazione da lavoro dipendente 2025
          detrazionipercentonirpef: 0,
          ulterioredetrazionefixed: 0,
          ulterioredetrazionepercent: 0,
          bonusl207fixed: 0
        }
      });
      console.log('✅ Configurazione fiscale 2025 creata');
    } else {
      console.log('⚠️ Configurazione fiscale 2025 già esistente');
    }

    // Popola addizionali regionali e comunali (esempi)
    const regionalAdd = await prisma.tax_regional_additional.findFirst({
      where: { year: 2025, region: 'DEFAULT' }
    });

    if (!regionalAdd) {
      await prisma.tax_regional_additional.create({
        data: {
          year: 2025,
          region: 'DEFAULT',
          rate: 1.0 // 1% addizionale regionale di default
        }
      });
      console.log('✅ Addizionale regionale DEFAULT creata (1%)');
    }

    const municipalAdd = await prisma.tax_municipal_additional.findFirst({
      where: { year: 2025, region: 'DEFAULT', municipality: 'DEFAULT' }
    });

    if (!municipalAdd) {
      await prisma.tax_municipal_additional.create({
        data: {
          year: 2025,
          region: 'DEFAULT',
          municipality: 'DEFAULT',
          rate: 0.5 // 0.5% addizionale comunale di default
        }
      });
      console.log('✅ Addizionale comunale DEFAULT creata (0.5%)');
    }

    console.log('🎯 Totale addizionali: 1.5% (1% regionale + 0.5% comunale)');

  } catch (error) {
    console.error('🔴 Errore durante il popolamento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

populateIrpefBrackets();



