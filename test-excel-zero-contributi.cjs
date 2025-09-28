// Test con contributi lavoratore a 0% per vedere se corrisponde all'Excel
const { calcolaExcelLike } = require('./server/src/utils/excelCalculator');

async function testExcelZeroContributi() {
  try {
    console.log('🧪 TEST EXCEL CON CONTRIBUTI LAVORATORE A 0%');
    console.log('============================================');

    // Test con lordo 56.565 (quello del tuo Excel)
    console.log('\n📊 TEST: Lordo €56.565 (dal tuo Excel)');
    console.log('========================================');
    
    const result = await calcolaExcelLike(56565, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato con lordo €56.565:');
    console.log(`   - Netto: €${result.netSalary.toFixed(2)}`);
    console.log(`   - Contributi lavoratore: €${result.totaleContributiWorker.toFixed(2)}`);
    console.log(`   - IRPEF: €${result.irpef.toFixed(2)}`);
    console.log(`   - Addizionali: €${result.addizionali.toFixed(2)}`);
    console.log(`   - INPS Employer: €${result.inpsEmployer.toFixed(2)}`);
    console.log(`   - INAIL Employer: €${result.inailEmployer.toFixed(2)}`);
    console.log(`   - FFC Employer: €${result.ffcEmployer.toFixed(2)}`);
    console.log(`   - Costo aziendale: €${result.companyCost.toFixed(2)}`);

    // Calcolo manuale per capire
    console.log('\n🧮 CALCOLO MANUALE:');
    console.log('===================');
    
    const gross = 56565;
    
    // Contributi lavoratore
    const inpsWorker = gross * 0.0919;
    const ffcWorker = gross * 0.0125;
    const solidarityWorker = gross * 0.005;
    const totaleContributiWorker = inpsWorker + ffcWorker + solidarityWorker;
    
    // Imponibile fiscale
    const taxableIncome = gross - totaleContributiWorker;
    
    // IRPEF manuale
    let irpef = 0;
    if (taxableIncome > 0) {
      const income1 = Math.min(taxableIncome, 15000);
      irpef += income1 * 0.23;
    }
    if (taxableIncome > 15000) {
      const income2 = Math.min(taxableIncome - 15000, 13000);
      irpef += income2 * 0.25;
    }
    if (taxableIncome > 28000) {
      const income3 = Math.min(taxableIncome - 28000, 22000);
      irpef += income3 * 0.35;
    }
    if (taxableIncome > 50000) {
      const income4 = taxableIncome - 50000;
      irpef += income4 * 0.43;
    }
    irpef = Math.max(irpef - 1880, 0);
    
    // Addizionali
    const addizionali = taxableIncome * (0.0123 + 0.005); // Marche + Pesaro
    
    // Netto
    const netto = gross - totaleContributiWorker - irpef - addizionali;
    
    console.log(`Lordo: €${gross.toFixed(2)}`);
    console.log(`Contributi lavoratore: €${totaleContributiWorker.toFixed(2)}`);
    console.log(`Imponibile fiscale: €${taxableIncome.toFixed(2)}`);
    console.log(`IRPEF: €${irpef.toFixed(2)}`);
    console.log(`Addizionali: €${addizionali.toFixed(2)}`);
    console.log(`Netto: €${netto.toFixed(2)}`);
    
    // Confronto con Excel
    console.log('\n🎯 CONFRONTO CON EXCEL:');
    console.log('=======================');
    console.log(`Excel netto: €33.500,00`);
    console.log(`Sistema netto: €${netto.toFixed(2)}`);
    console.log(`Differenza: €${(netto - 33500).toFixed(2)}`);
    
    if (Math.abs(netto - 33500) < 100) {
      console.log('🎉 QUASI PERFETTO! La logica è corretta!');
    } else {
      console.log('⚠️ Ancora differenze significative');
    }

  } catch (error) {
    console.error('❌ Errore test:', error);
  }
}

testExcelZeroContributi();











