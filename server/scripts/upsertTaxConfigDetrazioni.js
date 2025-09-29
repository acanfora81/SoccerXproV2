const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../prisma/.env') });

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const yearArg = process.argv[2];
  const year = Number(yearArg) || new Date().getFullYear();

  // Defaults per specifica
  const payload = {
    detrazioneFascia1: 1955,
    detrazioneMinimo: 690,
    detrazioneFascia2: 1910,
    detrazioneFascia2Max: 1190,
    detrazioneFascia3: 1910,
  };

  console.log(`\n🔧 Upsert tax_config detrazioni per anno ${year}`);

  // Verifica se esiste la riga per l'anno
  const existing = await prisma.tax_config.findUnique({ where: { year } });

  if (!existing) {
    console.log('ℹ️ Nessuna riga trovata: creo nuovo record con i soli campi obbligatori e detrazioni.');
    // Nota: contributionrate/solidarityrate sono NOT NULL: impostiamo 0 salvo override successivo da UI
    await prisma.tax_config.create({
      data: {
        year,
        contributionrate: 0,
        solidarityrate: 0,
        detrazionifixed: 0,
        detrazionipercentonirpef: 0,
        ulterioredetrazionefixed: 0,
        ulterioredetrazionepercent: 0,
        bonusl207fixed: 0,
        ...payload,
      },
    });
    console.log('✅ Creato nuovo record tax_config');
  } else {
    console.log('✅ Record esistente: aggiorno solo i nuovi campi');
    await prisma.tax_config.update({
      where: { year },
      data: payload,
    });
    console.log('✅ Aggiornato record tax_config');
  }
}

main()
  .catch((e) => {
    console.error('❌ Errore upsert detrazioni:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });











