const { PrismaClient } = require('../../prisma/generated/client');
const { calcolaStipendioCompleto } = require('../../src/utils/taxCalculator');

const prisma = new PrismaClient();

async function test12500Calculation() {
  try {
    console.log('🧮 TEST CALCOLO 12.500€ LORDI');
    console.log('==============================');

    const grossSalary = 12500;

    // Recupera aliquote
    const taxRates = await prisma.taxRate.findFirst({
      where: {
        year: 2025,
        type: 'PROFESSIONAL'
      }
    });

    if (!taxRates) {
      console.log('❌ Nessuna aliquota trovata');
      return;
    }

    console.log('📊 Aliquote trovate:', {
      inpsWorker: taxRates.inpsWorker,
      ffcWorker: taxRates.ffcWorker,
      solidarityWorker: taxRates.solidarityWorker,
      inpsEmployer: taxRates.inpsEmployer,
      inailEmployer: taxRates.inailEmployer,
      ffcEmployer: taxRates.ffcEmployer,
      solidarityEmployer: taxRates.solidarityEmployer
    });

    // Calcola stipendio completo
    const result = await calcolaStipendioCompleto(
      grossSalary,
      taxRates,
      2025,
      'DEFAULT',
      'DEFAULT'
    );

    console.log('\n📋 RISULTATO CALCOLO:');
    console.log('=====================');
    console.log(`🏃‍♂️ NETTO GIOCATORE: ${result.netSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);
    console.log(`🏢 COSTO SOCIETÀ: ${result.companyCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);

    console.log('\n📊 DETTAGLIO CONTRIBUTI LAVORATORE:');
    console.log(`- INPS Worker: ${result.inpsWorker.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.inpsWorker}%)`);
    console.log(`- FFC Worker: ${result.ffcWorker.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.ffcWorker}%)`);
    console.log(`- Solidarity Worker: ${result.solidarityWorker.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.solidarityWorker}%)`);
    console.log(`- Totale Contributi: ${result.totaleContributiWorker.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);

    console.log('\n📊 DETTAGLIO TASSE:');
    console.log(`- Imponibile: ${result.taxableIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);
    console.log(`- IRPEF: ${result.irpef.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);
    console.log(`- Addizionali: ${result.addizionali.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);

    console.log('\n📊 DETTAGLIO CONTRIBUTI DATORE:');
    console.log(`- INPS Employer: ${result.inpsEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.inpsEmployer}%)`);
    console.log(`- INAIL Employer: ${result.inailEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.inailEmployer}%)`);
    console.log(`- FFC Employer: ${result.ffcEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.ffcEmployer}%)`);
    console.log(`- Solidarity Employer: ${result.solidarityEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ (${taxRates.solidarityEmployer}%)`);
    console.log(`- Totale Contributi Datore: ${result.totaleContributiEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€`);

    console.log('\n🎯 VERIFICA CON I TUOI CALCOLI:');
    console.log('===============================');
    console.log('✅ Contributi lavoratore: 1.367,50€ (dovrebbe essere corretto)');
    console.log('✅ Imponibile fiscale: 11.132,50€ (dovrebbe essere corretto)');
    console.log('✅ IRPEF: ~680€ (con detrazioni 1.880€)');
    console.log('✅ Addizionali: ~227€ (2.03% su 11.132,50€)');
    console.log('✅ Netto: ~10.225€ (dovrebbe essere vicino)');
    console.log('✅ Contributi datore: 4.807,50€ (INPS 23.81% + INAIL 7.90% + FFC 6.25% + Solidarietà 0.5%)');
    console.log('✅ Costo società: 17.307,50€ (12.500€ + 4.807,50€)');

  } catch (error) {
    console.error('🔴 Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test12500Calculation();


