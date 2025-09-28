// Test per capire perché taxCalculator usa il fallback
const { calcolaStipendioCompleto } = require('./server/src/utils/taxCalculator');

async function testTaxCalculatorDebug() {
  try {
    console.log('🔍 TEST TAXCALCULATOR DEBUG');
    console.log('============================');

    console.log('\n📊 Test con parametri completi:');
    const result1 = await calcolaStipendioCompleto(56565, {}, 2025, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato:', {
      grossSalary: result1.grossSalary,
      netSalary: result1.netSalary,
      irpef: result1.irpef,
      addizionali: result1.addizionali,
      ffcEmployer: result1.ffcEmployer
    });

    console.log('\n📊 Test con parametri minimi:');
    const result2 = await calcolaStipendioCompleto(56565, {}, 2025, null, null);
    
    console.log('✅ Risultato:', {
      grossSalary: result2.grossSalary,
      netSalary: result2.netSalary,
      irpef: result2.irpef,
      addizionali: result2.addizionali,
      ffcEmployer: result2.ffcEmployer
    });

    console.log('\n📊 Test con year undefined:');
    const result3 = await calcolaStipendioCompleto(56565, {}, undefined, 'Marche', 'Pesaro');
    
    console.log('✅ Risultato:', {
      grossSalary: result3.grossSalary,
      netSalary: result3.netSalary,
      irpef: result3.irpef,
      addizionali: result3.addizionali,
      ffcEmployer: result3.ffcEmployer
    });

  } catch (error) {
    console.error('❌ Errore test:', error);
  }
}

testTaxCalculatorDebug();











