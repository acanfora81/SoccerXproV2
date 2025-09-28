// Test delle modifiche chirurgiche con scaglioni database
const axios = require('axios');

async function testModificheChirurgiche() {
  console.log('🧪 Test Modifiche Chirurgiche - Database-Driven');
  console.log('===============================================');

  const baseURL = 'http://localhost:3001';

  try {
    // Test principale: Netto €33,500 → Lordo
    console.log('\n📊 Test Principale: Netto €33,500 → Lordo');
    console.log('Target Excel: €56,565');
    
    const response = await axios.post(`${baseURL}/api/taxes/gross-from-net`, {
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

    if (response.data.success) {
      const result = response.data.data;
      
      // Calcola differenze
      const targetLordo = 56565;
      const diffLordo = Math.abs(result.grossSalary - targetLordo);
      const diffNetto = Math.abs(result.netSalary - 33500);
      const precisione = ((targetLordo - diffLordo) / targetLordo * 100);
      
      console.log('\n✅ Risultato Modifiche Chirurgiche:');
      console.log(`   Lordo Calcolato: €${result.grossSalary.toFixed(2)}`);
      console.log(`   Target Excel:     €${targetLordo.toFixed(2)}`);
      console.log(`   Differenza:       €${diffLordo.toFixed(2)} (${(diffLordo/targetLordo*100).toFixed(1)}%)`);
      console.log(`   Precisione:       ${precisione.toFixed(1)}%`);
      console.log(`   Netto Verificato: €${result.netSalary.toFixed(2)} (diff: €${diffNetto.toFixed(2)})`);
      
      console.log('\n📊 Dettaglio Fiscale:');
      console.log(`   IRPEF (piecewise):     €${result.irpef.toFixed(2)}`);
      console.log(`   Addizionali (scaglioni): €${result.addizionali.toFixed(2)}`);
      console.log(`   Contributi Lavoratore: €${result.totaleContributiWorker.toFixed(2)}`);
      console.log(`   FFC Employer:          €${result.ffcEmployer.toFixed(2)}`);
      console.log(`   Costo Aziendale:       €${result.companyCost.toFixed(2)}`);
      
      // Valutazione risultato
      if (precisione >= 95) {
        console.log('\n🎉 ECCELLENTE: Precisione >= 95%');
      } else if (precisione >= 90) {
        console.log('\n✅ BUONO: Precisione >= 90%');
      } else if (precisione >= 85) {
        console.log('\n⚠️  ACCETTABILE: Precisione >= 85%');
      } else {
        console.log('\n❌ NECESSARIO AFFINAMENTO: Precisione < 85%');
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

  // Test coerenza inversa
  console.log('\n📊 Test Coerenza: Lordo €56,565 → Netto');
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
      const diffNetto2 = Math.abs(result2.netSalary - 33500);
      console.log(`   Netto Calcolato: €${result2.netSalary.toFixed(2)}`);
      console.log(`   Target:          €33,500.00`);
      console.log(`   Differenza:      €${diffNetto2.toFixed(2)} (${(diffNetto2/33500*100).toFixed(1)}%)`);
      
      if (diffNetto2 < 100) {
        console.log('   ✅ Coerenza verificata');
      } else {
        console.log('   ⚠️  Coerenza da verificare');
      }
    }
  } catch (error) {
    console.error('❌ Errore Test Coerenza:', error.message);
  }

  console.log('\n🎯 Test completato');
  console.log('\n📝 Note:');
  console.log('   - Sistema ora usa database con scaglioni progressivi');
  console.log('   - Detrazioni piecewise invece di €1,880 fissi');
  console.log('   - Addizionali regionali Marche: 1.23%/1.53%/1.70%/1.73%');
  console.log('   - Addizionali comunali Pesaro: esente fino a €9,000, poi 0.8%');
  console.log('   - Ricerca binaria ottimizzata per convergenza');
}

// Esegui il test
testModificheChirurgiche().catch(console.error);











