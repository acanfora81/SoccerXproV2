// Test per verificare che il calcolatore fiscale funzioni correttamente
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testCalculatorFix() {
  try {
    console.log('🧪 TEST CALCOLATORE FISCALE');
    console.log('============================');

    // Test 1: API Excel gross-from-net
    console.log('\n1️⃣ Test API Excel: Netto → Lordo');
    console.log('==================================');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/taxes/excel/gross-from-net`, {
        netSalary: 33500,
        year: 2025,
        region: 'Marche',
        municipality: 'Pesaro'
      });
      
      if (response.data.success) {
        const result = response.data.data;
        console.log('✅ API Excel gross-from-net funzionante');
        console.log(`📊 Netto: €${result.netSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Lordo: €${result.grossSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 IRPEF: €${result.irpef.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Addizionali: €${result.addizionali.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 FFC Employer: €${result.ffcEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Costo Aziendale: €${result.companyCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      } else {
        console.log('❌ Errore API Excel gross-from-net:', response.data.error);
      }
    } catch (error) {
      console.log('❌ Errore API Excel gross-from-net:', error.response?.data || error.message);
    }

    // Test 2: API Excel net-from-gross
    console.log('\n2️⃣ Test API Excel: Lordo → Netto');
    console.log('==================================');
    
    try {
      const response = await axios.post(`${BASE_URL}/api/taxes/excel/net-from-gross`, {
        grossSalary: 56565,
        year: 2025,
        region: 'Marche',
        municipality: 'Pesaro'
      });
      
      if (response.data.success) {
        const result = response.data.data;
        console.log('✅ API Excel net-from-gross funzionante');
        console.log(`📊 Lordo: €${result.grossSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Netto: €${result.netSalary.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 IRPEF: €${result.irpef.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Addizionali: €${result.addizionali.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 FFC Employer: €${result.ffcEmployer.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
        console.log(`📊 Costo Aziendale: €${result.companyCost.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`);
      } else {
        console.log('❌ Errore API Excel net-from-gross:', response.data.error);
      }
    } catch (error) {
      console.log('❌ Errore API Excel net-from-gross:', error.response?.data || error.message);
    }

    console.log('\n🔧 CORREZIONI APPLICATE:');
    console.log('=========================');
    console.log('✅ Frontend ora usa le API Excel:');
    console.log('   - /api/taxes/excel/gross-from-net (invece di /api/taxes/gross-from-net)');
    console.log('   - /api/taxes/excel/net-from-gross (invece di /api/taxes/net-from-gross)');
    console.log('');
    console.log('✅ Mapping della risposta aggiornato per il formato Excel');
    console.log('');
    console.log('🎯 ISTRUZIONI PER TESTARE:');
    console.log('==========================');
    console.log('1. Apri il browser e vai su: http://localhost:5173/dashboard/contracts');
    console.log('2. Crea un nuovo contratto');
    console.log('3. Inserisci "33.500,00" nel campo "Stipendio Netto"');
    console.log('4. Il calcolatore dovrebbe ora mostrare i calcoli automatici');
    console.log('5. Verifica che il FFC Employer non sia più €0,00');

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

testCalculatorFix();


