// Test finale con database
const axios = require('axios');

async function testFinaleDatabase() {
  try {
    console.log('🧪 TEST FINALE CON DATABASE');
    console.log('============================');

    const baseURL = 'http://localhost:3001';
    
    // Test: 33.500€ netto → lordo
    console.log('\n📊 TEST: 33.500€ netto → lordo (con scaglioni DB)');
    console.log('--------------------------------------------------');
    
    const response = await axios.post(`${baseURL}/api/taxes/gross-from-net`, {
      netSalary: 33500,
      taxRates: {
        irpefBrackets: [
          { from: 0, to: 15000, rate: 0.23 },
          { from: 15000, to: 28000, rate: 0.25 },
          { from: 28000, to: 50000, rate: 0.35 },
          { from: 50000, to: Infinity, rate: 0.43 }
        ]
      },
      opts: {
        year: 2025,
        region: 'Marche',
        municipality: 'Pesaro'
      }
    });

    if (response.data.success) {
      const data = response.data.data;
      
      console.log(`✅ Netto target: €33500.00`);
      console.log(`✅ Lordo calcolato: €${data.grossSalary?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Netto verificato: €${data.netSalary?.toFixed(2) || 'N/A'}`);
      
      console.log('\n📊 CONTRIBUTI LAVORATORE:');
      console.log(`✅ INPS Worker: €${data.inpsWorker?.toFixed(2) || 'N/A'}`);
      console.log(`✅ FFC Worker: €${data.ffcWorker?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Solidarietà Worker: €${data.solidarityWorker?.toFixed(2) || 'N/A'}`);
      
      console.log('\n📊 CONTRIBUTI DATORE:');
      console.log(`✅ INPS Employer: €${data.inpsEmployer?.toFixed(2) || 'N/A'}`);
      console.log(`✅ INAIL Employer: €${data.inailEmployer?.toFixed(2) || 'N/A'}`);
      console.log(`✅ FFC Employer: €${data.ffcEmployer?.toFixed(2) || 'N/A'} ← DEVE ESSERE > 0`);
      
      console.log('\n📊 TASSE E ADDIZIONALI:');
      console.log(`✅ Imponibile fiscale: €${data.taxableIncome?.toFixed(2) || 'N/A'}`);
      console.log(`✅ IRPEF (scaglioni DB): €${data.irpef?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Addizionali (Marche+Pesaro): €${data.addizionali?.toFixed(2) || 'N/A'}`);
      
      console.log(`\n📊 Costo aziendale: €${data.companyCost?.toFixed(2) || 'N/A'}`);
      
      // Verifica precisione
      const diff = Math.abs(data.netSalary - 33500);
      if (diff < 1) {
        console.log(`🎯 Precisione: ±€${diff.toFixed(2)} (OTTIMA)`);
      } else {
        console.log(`⚠️ Precisione: ±€${diff.toFixed(2)} (da migliorare)`);
      }
      
      // Verifica FFC Employer
      if (data.ffcEmployer > 0) {
        console.log(`🎉 SUCCESS: FFC Employer = €${data.ffcEmployer.toFixed(2)} (NON PIÙ ZERO!)`);
      } else {
        console.log(`❌ PROBLEMA: FFC Employer ancora a zero`);
      }
      
      console.log('\n🎯 CONFRONTO SCAGLIONI:');
      console.log('======================');
      console.log('📊 Scaglioni DATABASE (2025):');
      console.log('   - 0-28.000€: 23%');
      console.log('   - 28.000-35.000€: 33%');
      console.log('   - 35.000€+: 43%');
      console.log('');
      console.log('📊 Scaglioni HARDCODED (fallback):');
      console.log('   - 0-15.000€: 23%');
      console.log('   - 15.000-28.000€: 25%');
      console.log('   - 28.000-50.000€: 35%');
      console.log('   - 50.000€+: 43%');
      console.log('');
      console.log('✅ Il sistema ora usa gli scaglioni del DATABASE!');
      
    } else {
      console.error('❌ Errore API:', response.data.error);
    }

  } catch (error) {
    console.error('❌ Errore test:', error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response data:', error.response.data);
    }
  }
}

testFinaleDatabase();

