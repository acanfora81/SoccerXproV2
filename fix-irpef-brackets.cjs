// Correzione scaglioni IRPEF nel database per 2025
const { PrismaClient } = require('./server/prisma/generated/client');

async function fixIrpefBrackets() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CORREZIONE SCAGLIONI IRPEF 2025');
    console.log('==================================');

    // Prima elimino gli scaglioni esistenti per 2025
    console.log('\n🗑️ Eliminazione scaglioni esistenti per 2025...');
    const deleted = await prisma.tax_irpef_bracket.deleteMany({
      where: { year: 2025 }
    });
    console.log(`✅ Eliminati ${deleted.count} scaglioni esistenti`);

    // Inserisco gli scaglioni corretti per 2025
    console.log('\n➕ Inserimento scaglioni IRPEF corretti per 2025...');
    
    const newBrackets = [
      { year: 2025, min: 0, max: 15000, rate: 23 },
      { year: 2025, min: 15000, max: 28000, rate: 25 },
      { year: 2025, min: 28000, max: 50000, rate: 35 },
      { year: 2025, min: 50000, max: null, rate: 43 }
    ];

    for (const bracket of newBrackets) {
      const created = await prisma.tax_irpef_bracket.create({
        data: bracket
      });
      console.log(`✅ Creato scaglione: €${bracket.min.toFixed(2)} - €${bracket.max ? bracket.max.toFixed(2) : '∞'} → ${bracket.rate}%`);
    }

    // Verifica finale
    console.log('\n🔍 Verifica scaglioni finali per 2025:');
    const finalBrackets = await prisma.tax_irpef_bracket.findMany({
      where: { year: 2025 },
      orderBy: { min: 'asc' }
    });

    console.log('✅ Scaglioni IRPEF 2025 aggiornati:');
    finalBrackets.forEach((bracket, index) => {
      console.log(`   ${index + 1}. Da €${bracket.min.toFixed(2)} a €${bracket.max ? bracket.max.toFixed(2) : '∞'} → ${bracket.rate}%`);
    });

    console.log('\n🎯 RISULTATO ATTESO:');
    console.log('====================');
    console.log('Con gli scaglioni corretti:');
    console.log('- 33.500€ netto → ~56.565€ lordo');
    console.log('- FFC Employer: ~3.535€ (6,25% di 56.565€)');

  } catch (error) {
    console.error('❌ Errore correzione scaglioni:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixIrpefBrackets();


