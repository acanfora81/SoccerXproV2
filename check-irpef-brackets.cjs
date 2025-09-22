// Verifica se esistono scaglioni IRPEF nel database
const { PrismaClient } = require('./server/prisma/generated/client');

async function checkIrpefBrackets() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VERIFICA SCAGLIONI IRPEF NEL DATABASE');
    console.log('========================================');

    // Verifica scaglioni per 2025
    console.log('\n📊 Scaglioni IRPEF per anno 2025:');
    const brackets2025 = await prisma.tax_irpef_bracket.findMany({
      where: { year: 2025 },
      orderBy: { min: 'asc' }
    });

    if (brackets2025.length > 0) {
      console.log(`✅ Trovati ${brackets2025.length} scaglioni per 2025:`);
      brackets2025.forEach((bracket, index) => {
        console.log(`   ${index + 1}. Da €${bracket.min.toFixed(2)} a €${bracket.max ? bracket.max.toFixed(2) : '∞'} → ${bracket.rate}%`);
      });
    } else {
      console.log('❌ NESSUNO scaglione IRPEF trovato per 2025!');
    }

    // Verifica tutti gli anni disponibili
    console.log('\n📊 Tutti gli anni con scaglioni IRPEF:');
    const allYears = await prisma.tax_irpef_bracket.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' }
    });

    if (allYears.length > 0) {
      console.log('✅ Anni disponibili:', allYears.map(y => y.year).join(', '));
    } else {
      console.log('❌ NESSUNO scaglione IRPEF nel database!');
    }

    // Verifica configurazione fiscale per 2025
    console.log('\n📊 Configurazione fiscale per 2025:');
    const config2025 = await prisma.tax_config.findUnique({
      where: { year: 2025 }
    });

    if (config2025) {
      console.log('✅ Configurazione 2025 trovata:');
      console.log(`   - Contributi: ${config2025.contributionrate}%`);
      console.log(`   - Solidarietà: ${config2025.solidarityrate}%`);
      console.log(`   - Detrazioni fisse: €${config2025.detrazionifixed}`);
      console.log(`   - Detrazioni % IRPEF: ${config2025.detrazionipercentonirpef}%`);
    } else {
      console.log('❌ NESSUNA configurazione fiscale per 2025!');
    }

    // Verifica addizionali regionali per Marche
    console.log('\n📊 Addizionali regionali Marche 2025:');
    const addRegionale = await prisma.tax_regional_additional.findFirst({
      where: { year: 2025, region: 'Marche' }
    });

    if (addRegionale) {
      console.log(`✅ Addizionale Marche: ${addRegionale.rate}%`);
    } else {
      console.log('❌ NESSUNA addizionale regionale per Marche 2025!');
    }

    // Verifica addizionali comunali per Pesaro
    console.log('\n📊 Addizionali comunali Pesaro 2025:');
    const addComunale = await prisma.tax_municipal_additional.findFirst({
      where: { year: 2025, region: 'Marche', municipality: 'Pesaro' }
    });

    if (addComunale) {
      console.log(`✅ Addizionale Pesaro: ${addComunale.rate}%`);
    } else {
      console.log('❌ NESSUNA addizionale comunale per Pesaro 2025!');
    }

    console.log('\n💡 DIAGNOSI:');
    console.log('============');
    if (brackets2025.length === 0) {
      console.log('🔴 PROBLEMA: Mancano gli scaglioni IRPEF per 2025');
      console.log('   Il taxCalculator cerca scaglioni nel DB ma non li trova');
      console.log('   Per questo usa il fallback hardcoded');
    } else {
      console.log('✅ Scaglioni IRPEF presenti, il problema è altrove');
    }

  } catch (error) {
    console.error('❌ Errore verifica database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIrpefBrackets();


