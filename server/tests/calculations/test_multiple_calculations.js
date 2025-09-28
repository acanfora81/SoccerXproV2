const { PrismaClient } = require('../../prisma/generated/client');
const { calcolaStipendioCompleto } = require('../../src/utils/taxCalculator');

const prisma = new PrismaClient();

async function testMultipleCalculations() {
  try {
    console.log('🧮 TEST CALCOLI MULTIPLI');
    console.log('========================');

    // Test con diversi importi
    const testAmounts = [15000, 25000, 35000, 50000, 75000];

    for (const grossSalary of testAmounts) {
      console.log(`\n💰 TEST CON ${grossSalary.toLocaleString('it-IT')}€ LORDI`);
      console.log('='.repeat(50));

      // Recupera aliquote
      const taxRates = await prisma.taxRate.findFirst({
        where: {
          year: 2025,
          type: 'PROFESSIONAL'
        }
      });

      if (!taxRates) {
        console.log('❌ Nessuna aliquota trovata');
        continue;
      }

      // Calcola stipendio completo
      const result = await calcolaStipendioCompleto(
        grossSalary,
        taxRates,
        2025,
        'DEFAULT',
        'DEFAULT'
      );

      // Calcoli manuali per verifica
      const inpsWorker = grossSalary * (taxRates.inpsWorker / 100);
      const ffcWorker = grossSalary * (taxRates.ffcWorker / 100);
      const solidarityWorker = grossSalary * (taxRates.solidarityWorker / 100);
      const totalContributionsWorker = inpsWorker + ffcWorker + solidarityWorker;
      const taxableIncome = grossSalary - totalContributionsWorker;

      // IRPEF manuale
      let irpef = 0;
      if (taxableIncome > 0) {
        irpef += Math.min(taxableIncome, 28000) * 0.23;
      }
      if (taxableIncome > 28000) {
        irpef += Math.min(taxableIncome - 28000, 7000) * 0.33;
      }
      if (taxableIncome > 35000) {
        irpef += (taxableIncome - 35000) * 0.43;
      }
      irpef = Math.max(irpef - 1880, 0); // Detrazioni

      // Addizionali manuali
      const addizionali = taxableIncome * 0.0203; // 1.23% + 0.8%

      // Netto manuale
      const netSalaryManual = grossSalary - totalContributionsWorker - irpef - addizionali;

      // Contributi datore manuali
      const inpsEmployer = grossSalary * (taxRates.inpsEmployer / 100);
      const inailEmployer = grossSalary * (taxRates.inailEmployer / 100);
      const ffcEmployer = grossSalary * (taxRates.ffcEmployer / 100);
      const solidarityEmployer = grossSalary * (taxRates.solidarityEmployer / 100);
      const totalContributionsEmployer = inpsEmployer + inailEmployer + ffcEmployer + solidarityEmployer;
      const companyCostManual = grossSalary + totalContributionsEmployer;

      console.log('📊 RISULTATI SISTEMA vs MANUALI:');
      console.log(`Netto Sistema:     €${result.netSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      console.log(`Netto Manuale:     €${netSalaryManual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      console.log(`Costo Sistema:     €${result.companyCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      console.log(`Costo Manuale:     €${companyCostManual.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      
      // Verifica differenze
      const netDiff = Math.abs(result.netSalary - netSalaryManual);
      const costDiff = Math.abs(result.companyCost - companyCostManual);
      
      console.log(`Differenza Netto:  €${netDiff.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      console.log(`Differenza Costo:  €${costDiff.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      
      if (netDiff < 1 && costDiff < 1) {
        console.log('✅ CALCOLO CORRETTO');
      } else {
        console.log('❌ CALCOLO ERRATO');
      }

      // Percentuali
      const netPercentage = (result.netSalary / grossSalary * 100).toFixed(1);
      const costPercentage = (result.companyCost / grossSalary * 100).toFixed(1);
      console.log(`Netto: ${netPercentage}% del lordo`);
      console.log(`Costo: ${costPercentage}% del lordo`);
    }

  } catch (error) {
    console.error('🔴 Errore durante il test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMultipleCalculations();




