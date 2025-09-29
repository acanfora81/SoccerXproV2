const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../prisma/.env') });

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const yearArg = process.argv[2];
  const year = Number(yearArg) || new Date().getFullYear();
  console.log(`\n🔍 Verifica dati fiscali per anno ${year}`);

  const taxConfig = await prisma.tax_config.findUnique({ where: { year } });
  if (!taxConfig) {
    console.log('❌ Nessuna riga in tax_config per questo anno');
  } else {
    const {
      contributionrate,
      solidarityrate,
      detrazionifixed,
      detrazionipercentonirpef,
      ulterioredetrazionefixed,
      ulterioredetrazionepercent,
      bonusl207fixed,
      detrazioneFascia1,
      detrazioneMinimo,
      detrazioneFascia2,
      detrazioneFascia2Max,
      detrazioneFascia3,
    } = taxConfig;

    console.log('✅ tax_config trovato:');
    console.table({
      contributionrate,
      solidarityrate,
      detrazionifixed,
      detrazionipercentonirpef,
      ulterioredetrazionefixed,
      ulterioredetrazionepercent,
      bonusl207fixed,
      detrazioneFascia1,
      detrazioneMinimo,
      detrazioneFascia2,
      detrazioneFascia2Max,
      detrazioneFascia3,
    });
  }

  const extraRules = await prisma.tax_extra_deduction_rule.findMany({
    where: { year },
    orderBy: { min: 'asc' },
  });
  if (extraRules.length === 0) {
    console.log('ℹ️ Nessuna regola in tax_extra_deduction_rule per questo anno');
  } else {
    console.log(`✅ ${extraRules.length} regole in tax_extra_deduction_rule:`);
    console.table(
      extraRules.map((r) => ({ min: r.min, max: r.max ?? null, amount: r.amount }))
    );
  }

  // IRPEF brackets presence
  const brackets = await prisma.tax_irpef_bracket.findMany({
    where: { year },
    orderBy: { min: 'asc' },
  });
  console.log(`IRPEF brackets: ${brackets.length}`);
}

main()
  .catch((e) => {
    console.error('Errore verifica dati:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });











