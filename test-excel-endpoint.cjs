// Test endpoint Excel-like
const axios = require('axios');

async function testExcelEndpoint() {
  try {
    console.log('🧪 TEST ENDPOINT EXCEL-LIKE');
    console.log('============================');

    const baseURL = 'http://localhost:3001';
    
    // Test: 33.500€ netto → lordo (modalità Excel)
    console.log('\n📊 TEST: 33.500€ netto → lordo (modalità Excel)');
    console.log('--------------------------------------------------');
    
    const response = await axios.post(`${baseURL}/api/taxes/excel/gross-from-net`, {
      netSalary: 33500,
      year: 2025,
      region: 'Marche',
      municipality: 'Pesaro'
    });

    if (response.data.success) {
      const data = response.data.data;
      
      console.log(`✅ Netto target: €33500.00`);
      console.log(`✅ Lordo calcolato: €${data.grossSalary?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Netto verificato: €${data.netSalary?.toFixed(2) || 'N/A'}`);
      
      console.log('\n📊 CONTRIBUTI LAVORATORE (dovrebbero essere 0):');
      console.log(`✅ INPS Worker: €${data.inpsWorker?.toFixed(2) || 'N/A'}`);
      console.log(`✅ FFC Worker: €${data.ffcWorker?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Solidarietà Worker: €${data.solidarityWorker?.toFixed(2) || 'N/A'}`);
      
      console.log('\n📊 CONTRIBUTI DATORE (come nel tuo Excel):');
      console.log(`✅ INPS Employer: €${data.inpsEmployer?.toFixed(2) || 'N/A'} (29,58%)`);
      console.log(`✅ INAIL Employer: €${data.inailEmployer?.toFixed(2) || 'N/A'} (7,9%)`);
      console.log(`✅ FFC Employer: €${data.ffcEmployer?.toFixed(2) || 'N/A'} (6,25%)`);
      
      console.log('\n📊 TASSE E ADDIZIONALI:');
      console.log(`✅ Imponibile fiscale: €${data.taxableIncome?.toFixed(2) || 'N/A'}`);
      console.log(`✅ IRPEF: €${data.irpef?.toFixed(2) || 'N/A'}`);
      console.log(`✅ Addizionali: €${data.addizionali?.toFixed(2) || 'N/A'}`);
      
      console.log(`\n📊 Costo aziendale: €${data.companyCost?.toFixed(2) || 'N/A'}`);
      
      // Verifica precisione
      const diff = Math.abs(data.netSalary - 33500);
      if (diff < 1) {
        console.log(`🎯 Precisione: ±€${diff.toFixed(2)} (OTTIMA)`);
      } else {
        console.log(`⚠️ Precisione: ±€${diff.toFixed(2)} (da migliorare)`);
      }
      
      // Confronto con Excel
      console.log('\n🎯 CONFRONTO CON EXCEL:');
      console.log('=======================');
      console.log('📊 Tuo Excel:');
      console.log('   - Netto: €33.500,00');
      console.log('   - Lordo: €56.565,00');
      console.log('   - INPS Employer: €16.731,93');
      console.log('   - INAIL Employer: €4.468,64');
      console.log('   - FFC Employer: €3.535,31');
      console.log('');
      console.log('📊 Sistema Excel-like:');
      console.log(`   - Netto: €${data.netSalary?.toFixed(2) || 'N/A'}`);
      console.log(`   - Lordo: €${data.grossSalary?.toFixed(2) || 'N/A'}`);
      console.log(`   - INPS Employer: €${data.inpsEmployer?.toFixed(2) || 'N/A'}`);
      console.log(`   - INAIL Employer: €${data.inailEmployer?.toFixed(2) || 'N/A'}`);
      console.log(`   - FFC Employer: €${data.ffcEmployer?.toFixed(2) || 'N/A'}`);
      
      // Verifica se corrisponde
      const lordoMatch = Math.abs(data.grossSalary - 56565) < 10;
      const inpsMatch = Math.abs(data.inpsEmployer - 16731.93) < 10;
      const inailMatch = Math.abs(data.inailEmployer - 4468.64) < 10;
      const ffcMatch = Math.abs(data.ffcEmployer - 3535.31) < 10;
      
      if (lordoMatch && inpsMatch && inailMatch && ffcMatch) {
        console.log('\n🎉 PERFETTO! I calcoli corrispondono al tuo Excel!');
      } else {
        console.log('\n⚠️ Ci sono ancora differenze da sistemare');
        if (!lordoMatch) console.log(`   - Lordo: atteso €56.565, calcolato €${data.grossSalary?.toFixed(2)}`);
        if (!inpsMatch) console.log(`   - INPS: atteso €16.731,93, calcolato €${data.inpsEmployer?.toFixed(2)}`);
        if (!inailMatch) console.log(`   - INAIL: atteso €4.468,64, calcolato €${data.inailEmployer?.toFixed(2)}`);
        if (!ffcMatch) console.log(`   - FFC: atteso €3.535,31, calcolato €${data.ffcEmployer?.toFixed(2)}`);
      }
      
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

testExcelEndpoint();

