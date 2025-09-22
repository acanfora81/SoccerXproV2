const { PrismaClient } = require('./prisma/generated/client');
const { calcolaStipendioCompleto } = require('./src/utils/taxCalculator');

const prisma = new PrismaClient();

async function testCalculation35k() {
  try {
    console.log('🧮 TEST CALCOLO 35.000€ LORDI');
    console.log('=====================================');

    // Recupera le aliquote dal database
    const taxRates = await prisma.taxRate.findFirst({
      where: {
        type: 'PROFESSIONAL',
        year: 2025
      }
    });

    if (!taxRates) {
      console.log('❌ Nessuna aliquota trovata per PROFESSIONAL 2025');
      return;
    }

    console.log('📊 Aliquote trovate:', {
      inpsWorker: taxRates.inpsWorker,
      inpsEmployer: taxRates.inpsEmployer,
      inailEmployer: taxRates.inailEmployer,
      ffcWorker: taxRates.ffcWorker,
      ffcEmployer: taxRates.ffcEmployer,
      solidarityWorker: taxRates.solidarityWorker,
      solidarityEmployer: taxRates.solidarityEmployer
    });

    // Test calcolo con 35.000€ lordi
    const grossSalary = 35000;
    console.log(`\n💰 STIPENDIO LORDO: ${grossSalary.toLocaleString()}€`);

    const result = await calcolaStipendioCompleto(
      grossSalary,
      taxRates,
      2025,
      'DEFAULT',
      'DEFAULT'
    );

    console.log('\n📋 RISULTATO CALCOLO:');
    console.log('=====================');
    console.log(`🏃‍♂️ NETTO GIOCATORE: ${result.netSalary.toLocaleString()}€`);
    console.log(`🏢 COSTO SOCIETÀ: ${result.companyCost.toLocaleString()}€`);
    
    console.log('\n📊 DETTAGLIO CONTRIBUTI LAVORATORE:');
    console.log(`- INPS Worker: ${result.inpsWorker.toLocaleString()}€ (${taxRates.inpsWorker}%)`);
    console.log(`- FFC Worker: ${result.ffcWorker.toLocaleString()}€ (${taxRates.ffcWorker}%)`);
    console.log(`- Solidarity Worker: ${result.solidarityWorker.toLocaleString()}€ (${taxRates.solidarityWorker}%)`);
    console.log(`- Totale Contributi: ${result.totaleContributiWorker.toLocaleString()}€`);

    console.log('\n📊 DETTAGLIO TASSE:');
    console.log(`- Imponibile: ${result.taxableIncome.toLocaleString()}€`);
    console.log(`- IRPEF: ${result.irpef.toLocaleString()}€`);
    console.log(`- Addizionali: ${result.addizionali.toLocaleString()}€`);

    console.log('\n📊 DETTAGLIO CONTRIBUTI DATORE:');
    console.log(`- INPS Employer: ${result.inpsEmployer.toLocaleString()}€ (${taxRates.inpsEmployer}%)`);
    console.log(`- INAIL Employer: ${result.inailEmployer.toLocaleString()}€ (${taxRates.inailEmployer}%)`);
    console.log(`- Solidarity Employer: ${result.solidarityEmployer.toLocaleString()}€ (${taxRates.solidarityEmployer}%)`);
    console.log(`- Totale Contributi Datore: ${result.totaleContributiEmployer.toLocaleString()}€`);

    console.log('\n🎯 VERIFICA:');
    console.log(`Netto calcolato: ${result.netSalary.toLocaleString()}€`);
    console.log(`Costo società: ${result.companyCost.toLocaleString()}€`);
    console.log(`Differenza netto vs lordo: ${(grossSalary - result.netSalary).toLocaleString()}€`);
    console.log(`Costo aggiuntivo società: ${(result.companyCost - grossSalary).toLocaleString()}€`);

    // Verifica che il calcolo sia ragionevole
    const nettoPercentuale = (result.netSalary / grossSalary) * 100;
    const costoPercentuale = (result.companyCost / grossSalary) * 100;
    
    console.log('\n✅ CONTROLLI QUALITÀ:');
    console.log(`Netto è il ${nettoPercentuale.toFixed(1)}% del lordo`);
    console.log(`Costo società è il ${costoPercentuale.toFixed(1)}% del lordo`);
    
    if (nettoPercentuale > 60 && nettoPercentuale < 80) {
      console.log('✅ Netto ragionevole (60-80% del lordo)');
    } else {
      console.log('⚠️ Netto fuori range normale');
    }
    
    if (costoPercentuale > 120 && costoPercentuale < 150) {
      console.log('✅ Costo società ragionevole (120-150% del lordo)');
    } else {
      console.log('⚠️ Costo società fuori range normale');
    }

  } catch (error) {
    console.error('🔴 Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCalculation35k();



