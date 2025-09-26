// Test per confrontare Excel vs Sistema
const { calcolaStipendioCompleto } = require('./server/src/utils/taxCalculator');

async function testExcelVsSystem() {
  try {
    console.log('🔍 CONFRONTO EXCEL vs SISTEMA');
    console.log('=============================');

    // Test con lordo 56.565 (quello che ti aspetti dall'Excel)
    console.log('\n📊 TEST: Lordo €56.565 (dal tuo Excel)');
    console.log('========================================');
    
    const resultExcel = await calcolaStipendioCompleto(56565, {}, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato sistema con lordo €56.565:');
    console.log(`   - Netto: €${resultExcel.netSalary.toFixed(2)}`);
    console.log(`   - Contributi lavoratore: €${resultExcel.totaleContributiWorker.toFixed(2)}`);
    console.log(`   - IRPEF: €${resultExcel.irpef.toFixed(2)}`);
    console.log(`   - Addizionali: €${resultExcel.addizionali.toFixed(2)}`);
    console.log(`   - FFC Employer: €${resultExcel.ffcEmployer.toFixed(2)}`);

    // Test con lordo 50.615 (quello che calcola il sistema)
    console.log('\n📊 TEST: Lordo €50.615 (dal sistema)');
    console.log('=====================================');
    
    const resultSystem = await calcolaStipendioCompleto(50615, {}, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato sistema con lordo €50.615:');
    console.log(`   - Netto: €${resultSystem.netSalary.toFixed(2)}`);
    console.log(`   - Contributi lavoratore: €${resultSystem.totaleContributiWorker.toFixed(2)}`);
    console.log(`   - IRPEF: €${resultSystem.irpef.toFixed(2)}`);
    console.log(`   - Addizionali: €${resultSystem.addizionali.toFixed(2)}`);
    console.log(`   - FFC Employer: €${resultSystem.ffcEmployer.toFixed(2)}`);

    // Analisi dettagliata delle differenze
    console.log('\n🔍 ANALISI DIFFERENZE:');
    console.log('======================');
    
    const diffNetto = resultExcel.netSalary - resultSystem.netSalary;
    const diffContributi = resultExcel.totaleContributiWorker - resultSystem.totaleContributiWorker;
    const diffIrpef = resultExcel.irpef - resultSystem.irpef;
    const diffAddizionali = resultExcel.addizionali - resultSystem.addizionali;
    
    console.log(`Differenza netto: €${diffNetto.toFixed(2)}`);
    console.log(`Differenza contributi: €${diffContributi.toFixed(2)}`);
    console.log(`Differenza IRPEF: €${diffIrpef.toFixed(2)}`);
    console.log(`Differenza addizionali: €${diffAddizionali.toFixed(2)}`);

    // Calcolo manuale per capire
    console.log('\n🧮 CALCOLO MANUALE DETTAGLIATO:');
    console.log('===============================');
    
    const grossExcel = 56565;
    const grossSystem = 50615;
    
    // Contributi lavoratore (stessi %)
    const inpsWorkerExcel = grossExcel * 0.0919;
    const ffcWorkerExcel = grossExcel * 0.0125;
    const solidarityWorkerExcel = grossExcel * 0.005;
    const totaleContributiWorkerExcel = inpsWorkerExcel + ffcWorkerExcel + solidarityWorkerExcel;
    
    const inpsWorkerSystem = grossSystem * 0.0919;
    const ffcWorkerSystem = grossSystem * 0.0125;
    const solidarityWorkerSystem = grossSystem * 0.005;
    const totaleContributiWorkerSystem = inpsWorkerSystem + ffcWorkerSystem + solidarityWorkerSystem;
    
    console.log(`\n📊 CONTRIBUTI LAVORATORE:`);
    console.log(`Excel (€56.565):`);
    console.log(`  - INPS: €${inpsWorkerExcel.toFixed(2)} (9,19%)`);
    console.log(`  - FFC: €${ffcWorkerExcel.toFixed(2)} (1,25%)`);
    console.log(`  - Solidarietà: €${solidarityWorkerExcel.toFixed(2)} (0,50%)`);
    console.log(`  - TOTALE: €${totaleContributiWorkerExcel.toFixed(2)}`);
    
    console.log(`\nSistema (€50.615):`);
    console.log(`  - INPS: €${inpsWorkerSystem.toFixed(2)} (9,19%)`);
    console.log(`  - FFC: €${ffcWorkerSystem.toFixed(2)} (1,25%)`);
    console.log(`  - Solidarietà: €${solidarityWorkerSystem.toFixed(2)} (0,50%)`);
    console.log(`  - TOTALE: €${totaleContributiWorkerSystem.toFixed(2)}`);
    
    // Imponibile fiscale
    const taxableIncomeExcel = grossExcel - totaleContributiWorkerExcel;
    const taxableIncomeSystem = grossSystem - totaleContributiWorkerSystem;
    
    console.log(`\n📊 IMPONIBILE FISCALE:`);
    console.log(`Excel: €${taxableIncomeExcel.toFixed(2)}`);
    console.log(`Sistema: €${taxableIncomeSystem.toFixed(2)}`);
    console.log(`Differenza: €${(taxableIncomeExcel - taxableIncomeSystem).toFixed(2)}`);

    // Calcolo IRPEF manuale
    console.log(`\n📊 CALCOLO IRPEF MANUALE:`);
    
    function calcIrpefManual(taxableIncome) {
      let irpef = 0;
      
      // Scaglione 1: 0-15.000€ → 23%
      if (taxableIncome > 0) {
        const income1 = Math.min(taxableIncome, 15000);
        irpef += income1 * 0.23;
        console.log(`  - Scaglione 1 (0-15k): €${income1.toFixed(2)} × 23% = €${(income1 * 0.23).toFixed(2)}`);
      }
      
      // Scaglione 2: 15.000-28.000€ → 25%
      if (taxableIncome > 15000) {
        const income2 = Math.min(taxableIncome - 15000, 13000);
        irpef += income2 * 0.25;
        console.log(`  - Scaglione 2 (15k-28k): €${income2.toFixed(2)} × 25% = €${(income2 * 0.25).toFixed(2)}`);
      }
      
      // Scaglione 3: 28.000-50.000€ → 35%
      if (taxableIncome > 28000) {
        const income3 = Math.min(taxableIncome - 28000, 22000);
        irpef += income3 * 0.35;
        console.log(`  - Scaglione 3 (28k-50k): €${income3.toFixed(2)} × 35% = €${(income3 * 0.35).toFixed(2)}`);
      }
      
      // Scaglione 4: 50.000€+ → 43%
      if (taxableIncome > 50000) {
        const income4 = taxableIncome - 50000;
        irpef += income4 * 0.43;
        console.log(`  - Scaglione 4 (50k+): €${income4.toFixed(2)} × 43% = €${(income4 * 0.43).toFixed(2)}`);
      }
      
      // Detrazioni
      const detrazioni = 1880;
      irpef = Math.max(irpef - detrazioni, 0);
      console.log(`  - Detrazioni: -€${detrazioni.toFixed(2)}`);
      console.log(`  - IRPEF finale: €${irpef.toFixed(2)}`);
      
      return irpef;
    }
    
    console.log(`\nExcel (imponibile €${taxableIncomeExcel.toFixed(2)}):`);
    const irpefExcel = calcIrpefManual(taxableIncomeExcel);
    
    console.log(`\nSistema (imponibile €${taxableIncomeSystem.toFixed(2)}):`);
    const irpefSystem = calcIrpefManual(taxableIncomeSystem);
    
    console.log(`\n📊 RIEPILOGO DIFFERENZE:`);
    console.log(`=======================`);
    console.log(`Lordo Excel: €${grossExcel.toFixed(2)}`);
    console.log(`Lordo Sistema: €${grossSystem.toFixed(2)}`);
    console.log(`Differenza lordo: €${(grossExcel - grossSystem).toFixed(2)}`);
    console.log(`\nNetto Excel: €${resultExcel.netSalary.toFixed(2)}`);
    console.log(`Netto Sistema: €${resultSystem.netSalary.toFixed(2)}`);
    console.log(`Differenza netto: €${diffNetto.toFixed(2)}`);
    
    console.log(`\n💡 POSSIBILI CAUSE:`);
    console.log(`===================`);
    console.log(`1. Contributi lavoratore diversi nell'Excel`);
    console.log(`2. Detrazioni IRPEF diverse nell'Excel`);
    console.log(`3. Addizionali diverse nell'Excel`);
    console.log(`4. Logica di calcolo diversa nell'Excel`);

  } catch (error) {
    console.error('❌ Errore test:', error);
  }
}

testExcelVsSystem();









