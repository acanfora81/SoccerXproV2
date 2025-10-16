/*
 Esegue un test end-to-end dei calcoli con netto=33500 usando dati reali DB
 Regione/Comune: Marche/Pesaro
 Contratto: PROFESSIONAL
*/

const { getPrismaClient } = require('../server/src/config/database');
const { calcolaLordoDaNetto } = require('../server/src/utils/taxCalculator');

async function main() {
  const prisma = getPrismaClient();
  const year = 2025;
  const region = 'Marche';
  const municipality = 'Pesaro';
  const contractType = 'PROFESSIONAL';
  const teamId = undefined; // lascia fuori il filtro teamId se non specificato
  const netSalary = 33500;

  console.log('🟦 Test 33500 netto → lordo', { year, region, municipality, contractType, teamId, netSalary });

  // Carica taxRates dal DB
  const where = { year, type: contractType };
  if (teamId) where.teamId = teamId;
  const rate = await prisma.taxRate.findFirst({ where });

  if (!rate) {
    console.warn('⚠️ Nessuna taxRate trovata per', { year, contractType, teamId });
  }

  const taxRates = rate ? {
    inpsWorker: parseFloat(rate.inpsWorker) || 0,
    inpsEmployer: parseFloat(rate.inpsEmployer) || 0,
    ffcWorker: parseFloat(rate.ffcWorker) || 0,
    ffcEmployer: parseFloat(rate.ffcEmployer) || 0,
    inailEmployer: parseFloat(rate.inailEmployer) || 0,
    solidarityWorker: parseFloat(rate.solidarityWorker) || 0,
    solidarityEmployer: parseFloat(rate.solidarityEmployer) || 0,
  } : {
    // fallback minimi
    inpsWorker: 9.19,
    inpsEmployer: 30,
    ffcWorker: 0.5,
    ffcEmployer: 6.25,
    inailEmployer: 1.5,
    solidarityWorker: 0,
    solidarityEmployer: 0,
  };

  console.log('🟦 taxRates usati:', taxRates);

  const result = await calcolaLordoDaNetto(netSalary, taxRates, year, region, municipality, contractType, teamId);

  console.log('🟩 Risultato calcolo 33500 → lordo:', result);
}

main().catch((e) => {
  console.error('❌ Errore test 33500:', e);
  process.exit(1);
});


