// Test dettagliato per capire la differenza
const { calcolaStipendioCompleto } = require('./server/src/utils/taxCalculator');

async function testDettaglioCalcolo() {
  try {
    console.log('🔍 TEST DETTAGLIATO CALCOLO');
    console.log('============================');

    // Test con lordo 56.565 (quello che ti aspetti)
    console.log('\n📊 TEST 1: Lordo €56.565 (quello che ti aspetti)');
    console.log('--------------------------------------------------');
    
    const result1 = await calcolaStipendioCompleto(56565, {}, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato lordo €56.565:');
    console.log(`   - Netto: €${result1.netSalary.toFixed(2)}`);
    console.log(`   - IRPEF: €${result1.irpef.toFixed(2)}`);
    console.log(`   - Addizionali: €${result1.addizionali.toFixed(2)}`);
    console.log(`   - FFC Employer: €${result1.ffcEmployer.toFixed(2)}`);

    // Test con lordo 50.615 (quello che calcola il sistema)
    console.log('\n📊 TEST 2: Lordo €50.615 (quello che calcola il sistema)');
    console.log('--------------------------------------------------------');
    
    const result2 = await calcolaStipendioCompleto(50615, {}, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato lordo €50.615:');
    console.log(`   - Netto: €${result2.netSalary.toFixed(2)}`);
    console.log(`   - IRPEF: €${result2.irpef.toFixed(2)}`);
    console.log(`   - Addizionali: €${result2.addizionali.toFixed(2)}`);
    console.log(`   - FFC Employer: €${result2.ffcEmployer.toFixed(2)}`);

    // Confronto dettagliato
    console.log('\n🔍 CONFRONTO DETTAGLIATO:');
    console.log('=========================');
    console.log(`Lordo €56.565 → Netto €${result1.netSalary.toFixed(2)}`);
    console.log(`Lordo €50.615 → Netto €${result2.netSalary.toFixed(2)}`);
    console.log(`Differenza netto: €${(result1.netSalary - result2.netSalary).toFixed(2)}`);
    
    console.log('\n📊 DIFFERENZE IRPEF:');
    console.log(`IRPEF €56.565: €${result1.irpef.toFixed(2)}`);
    console.log(`IRPEF €50.615: €${result2.irpef.toFixed(2)}`);
    console.log(`Differenza IRPEF: €${(result1.irpef - result2.irpef).toFixed(2)}`);
    
    console.log('\n📊 DIFFERENZE ADDIZIONALI:');
    console.log(`Addizionali €56.565: €${result1.addizionali.toFixed(2)}`);
    console.log(`Addizionali €50.615: €${result2.addizionali.toFixed(2)}`);
    console.log(`Differenza addizionali: €${(result1.addizionali - result2.addizionali).toFixed(2)}`);

    // Calcolo manuale per capire
    console.log('\n🧮 CALCOLO MANUALE PER CAPIRE:');
    console.log('==============================');
    
    const gross1 = 56565;
    const gross2 = 50615;
    
    // Contributi lavoratore (stessi per entrambi)
    const inpsWorker1 = gross1 * 0.0919;
    const ffcWorker1 = gross1 * 0.0125;
    const solidarityWorker1 = gross1 * 0.005;
    const totaleContributiWorker1 = inpsWorker1 + ffcWorker1 + solidarityWorker1;
    
    const inpsWorker2 = gross2 * 0.0919;
    const ffcWorker2 = gross2 * 0.0125;
    const solidarityWorker2 = gross2 * 0.005;
    const totaleContributiWorker2 = inpsWorker2 + ffcWorker2 + solidarityWorker2;
    
    console.log(`Contributi lavoratore €56.565: €${totaleContributiWorker1.toFixed(2)}`);
    console.log(`Contributi lavoratore €50.615: €${totaleContributiWorker2.toFixed(2)}`);
    console.log(`Differenza contributi: €${(totaleContributiWorker1 - totaleContributiWorker2).toFixed(2)}`);
    
    const taxableIncome1 = gross1 - totaleContributiWorker1;
    const taxableIncome2 = gross2 - totaleContributiWorker2;
    
    console.log(`Imponibile fiscale €56.565: €${taxableIncome1.toFixed(2)}`);
    console.log(`Imponibile fiscale €50.615: €${taxableIncome2.toFixed(2)}`);
    console.log(`Differenza imponibile: €${(taxableIncome1 - taxableIncome2).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Errore test:', error);
  }
}

testDettaglioCalcolo();












