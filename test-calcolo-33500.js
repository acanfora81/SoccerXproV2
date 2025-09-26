const { calcolaLordoDaNetto } = require('./server/src/utils/taxCalculator');

async function testCalcolo33500() {
  try {
    console.log('🔵 Test calcolo 33500€ netto → lordo');
    
    // Simula le aliquote fiscali standard
    const taxRates = {
      inpsWorker: 9.19,
      ffcWorker: 6.25,
      solidarityWorker: 0,
      inpsEmployer: 30.0,
      inailEmployer: 1.5,
      ffcEmployer: 0,
      solidarityEmployer: 0.5
    };
    
    const netSalary = 33500;
    const year = 2025;
    const region = 'Marche';
    const municipality = 'Pesaro';
    const contractType = 'FULL_TIME';
    
    console.log('📊 Parametri:');
    console.log('- Netto:', netSalary);
    console.log('- Anno:', year);
    console.log('- Regione:', region);
    console.log('- Comune:', municipality);
    console.log('- Tipo contratto:', contractType);
    console.log('- Aliquote:', taxRates);
    
    const result = await calcolaLordoDaNetto(netSalary, taxRates, year, region, municipality, contractType);
    
    console.log('\n📈 Risultato calcolo:');
    console.log('- Lordo calcolato:', result.grossSalary);
    console.log('- Netto risultante:', result.netSalary);
    console.log('- Differenza netto:', Math.abs(result.netSalary - netSalary));
    console.log('- Imponibile fiscale:', result.taxableIncome);
    console.log('- IRPEF:', result.irpef);
    console.log('- Addizionali:', result.addizionali);
    console.log('- Contributi worker:', result.totaleContributiWorker);
    console.log('- Costo azienda:', result.companyCost);
    
    // Verifica se il calcolo è corretto
    if (Math.abs(result.netSalary - netSalary) <= 1) {
      console.log('\n✅ Calcolo CORRETTO!');
    } else {
      console.log('\n❌ Calcolo ERRATO!');
      console.log('Differenza netto:', Math.abs(result.netSalary - netSalary));
    }
    
  } catch (error) {
    console.error('❌ Errore nel test:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCalcolo33500();









