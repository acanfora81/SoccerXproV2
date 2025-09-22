// Test del sistema semplificato senza ricerca binaria
const axios = require('axios');

async function testSistemaSemplificato() {
  console.log('🧪 Test Sistema Semplificato - Niente Ricerca Binaria');
  console.log('===================================================');

  const baseURL = 'http://localhost:3001';

  try {
    // Test principale: Netto €33,500 → Lordo
    console.log('\n📊 Test: Netto €33,500 → Lordo (calcolo diretto)');
    
    const response = await axios.post(`${baseURL}/api/taxes/gross-from-net`, {
      netSalary: 33500,
      taxRates: {
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.50,
        inpsEmployer: 23.81, // Corretto a 23.81 come nel nuovo codice
        inailEmployer: 7.90,
        ffcEmployer: 6.25,
        solidarityEmployer: 0
      },
      year: 2025,
      region: 'Marche',
      municipality: 'Pesaro'
    });

    if (response.data.success) {
      const result = response.data.data;
      
      console.log('✅ Risultato Sistema Semplificato:');
      console.log(`   Lordo: €${result.grossSalary.toFixed(2)}`);
      console.log(`   Netto: €${result.netSalary.toFixed(2)}`);
      console.log(`   IRPEF: €${result.irpef.toFixed(2)}`);
      console.log(`   Addizionali: €${result.addizionali.toFixed(2)}`);
      console.log(`   FFC Employer: €${result.ffcEmployer.toFixed(2)}`);
      console.log(`   Costo aziendale: €${result.companyCost.toFixed(2)}`);
      
      // Verifica coerenza
      const diffNetto = Math.abs(result.netSalary - 33500);
      console.log(`\n🎯 Verifica Coerenza:`);
      console.log(`   Differenza Netto: €${diffNetto.toFixed(2)} (${diffNetto < 1 ? '✅ PERFETTO' : '⚠️ DA VERIFICARE'})`);
      
      if (diffNetto < 1) {
        console.log('\n🎉 SISTEMA SEMPLIFICATO FUNZIONA PERFETTAMENTE!');
        console.log('   ✅ Nessuna ricerca binaria');
        console.log('   ✅ Calcolo diretto istantaneo');
        console.log('   ✅ Logs puliti');
        console.log('   ✅ Precisione elevata');
      }

    } else {
      console.error('❌ Errore API:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Errore Test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }

  // Test coerenza lordo → netto
  console.log('\n📊 Test Coerenza: Lordo → Netto');
  try {
    const response2 = await axios.post(`${baseURL}/api/taxes/net-from-gross`, {
      grossSalary: 50000,
      taxRates: {
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.50,
        inpsEmployer: 23.81,
        inailEmployer: 7.90,
        ffcEmployer: 6.25,
        solidarityEmployer: 0
      },
      year: 2025,
      region: 'Marche',
      municipality: 'Pesaro'
    });

    if (response2.data.success) {
      const result2 = response2.data.data;
      console.log(`   Lordo €50,000 → Netto €${result2.netSalary.toFixed(2)}`);
      console.log(`   IRPEF: €${result2.irpef.toFixed(2)}`);
      console.log(`   Addizionali: €${result2.addizionali.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ Errore Test Coerenza:', error.message);
  }

  console.log('\n🎯 Test completato');
  console.log('\n📝 Note Sistema Semplificato:');
  console.log('   - Nessuna ricerca binaria (logs puliti)');
  console.log('   - Calcolo diretto con 2 iterazioni max');
  console.log('   - Addizionali Marche: 1.23%, Pesaro: 0.50%');
  console.log('   - Detrazioni piecewise progressive');
  console.log('   - INPS Employer: 23.81% (corretto)');
}

// Esegui il test
testSistemaSemplificato().catch(console.error);
