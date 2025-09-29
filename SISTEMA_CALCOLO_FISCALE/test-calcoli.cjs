// Test dei calcoli fiscali per verificare i risultati
const axios = require('axios');

async function testCalcoli() {
  console.log('🧪 Test Calcoli Fiscali - Verifica Risultati');
  console.log('============================================');

  const baseURL = 'http://localhost:3001';

  // Test 1: Netto €33,500 → Lordo
  console.log('\n📊 Test 1: Netto €33,500 → Lordo');
  try {
    const response1 = await axios.post(`${baseURL}/api/taxes/gross-from-net`, {
      netSalary: 33500,
      taxRates: {
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.50,
        inpsEmployer: 29.58,
        inailEmployer: 7.90,
        ffcEmployer: 6.25,
        solidarityEmployer: 0
      },
      year: 2025,
      region: 'Marche',
      municipality: 'Pesaro'
    });

    if (response1.data.success) {
      const result1 = response1.data.data;
      console.log('✅ Risultato:');
      console.log(`   Lordo: €${result1.grossSalary.toFixed(2)}`);
      console.log(`   Netto: €${result1.netSalary.toFixed(2)}`);
      console.log(`   IRPEF: €${result1.irpef.toFixed(2)}`);
      console.log(`   Addizionali: €${result1.addizionali.toFixed(2)}`);
      console.log(`   FFC Employer: €${result1.ffcEmployer.toFixed(2)}`);
      console.log(`   Costo aziendale: €${result1.companyCost.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ Errore Test 1:', error.message);
  }

  // Test 2: Lordo €56,565 → Netto
  console.log('\n📊 Test 2: Lordo €56,565 → Netto');
  try {
    const response2 = await axios.post(`${baseURL}/api/taxes/net-from-gross`, {
      grossSalary: 56565,
      taxRates: {
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.50,
        inpsEmployer: 29.58,
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
      console.log('✅ Risultato:');
      console.log(`   Lordo: €${result2.grossSalary.toFixed(2)}`);
      console.log(`   Netto: €${result2.netSalary.toFixed(2)}`);
      console.log(`   IRPEF: €${result2.irpef.toFixed(2)}`);
      console.log(`   Addizionali: €${result2.addizionali.toFixed(2)}`);
      console.log(`   FFC Employer: €${result2.ffcEmployer.toFixed(2)}`);
      console.log(`   Costo aziendale: €${result2.companyCost.toFixed(2)}`);
    }
  } catch (error) {
    console.error('❌ Errore Test 2:', error.message);
  }

  // Test 3: Verifica coerenza (netto → lordo → netto)
  console.log('\n📊 Test 3: Verifica Coerenza (€33,500)');
  try {
    // Netto → Lordo
    const response3a = await axios.post(`${baseURL}/api/taxes/gross-from-net`, {
      netSalary: 33500,
      taxRates: {
        inpsWorker: 9.19,
        ffcWorker: 1.25,
        solidarityWorker: 0.50,
        inpsEmployer: 29.58,
        inailEmployer: 7.90,
        ffcEmployer: 6.25,
        solidarityEmployer: 0
      },
      year: 2025,
      region: 'Marche',
      municipality: 'Pesaro'
    });

    if (response3a.data.success) {
      const lordo = response3a.data.data.grossSalary;
      console.log(`   Netto €33,500 → Lordo €${lordo.toFixed(2)}`);

      // Lordo → Netto
      const response3b = await axios.post(`${baseURL}/api/taxes/net-from-gross`, {
        grossSalary: lordo,
        taxRates: {
          inpsWorker: 9.19,
          ffcWorker: 1.25,
          solidarityWorker: 0.50,
          inpsEmployer: 29.58,
          inailEmployer: 7.90,
          ffcEmployer: 6.25,
          solidarityEmployer: 0
        },
        year: 2025,
        region: 'Marche',
        municipality: 'Pesaro'
      });

      if (response3b.data.success) {
        const netto = response3b.data.data.netSalary;
        const differenza = Math.abs(netto - 33500);
        console.log(`   Lordo €${lordo.toFixed(2)} → Netto €${netto.toFixed(2)}`);
        console.log(`   Differenza: €${differenza.toFixed(2)}`);
        
        if (differenza < 1) {
          console.log('   ✅ Coerenza verificata!');
        } else {
          console.log('   ❌ Coerenza non verificata!');
        }
      }
    }
  } catch (error) {
    console.error('❌ Errore Test 3:', error.message);
  }

  console.log('\n🎯 Test completati');
}

// Esegui i test
testCalcoli().catch(console.error);












