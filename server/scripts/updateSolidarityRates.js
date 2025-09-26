const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../prisma/.env') });

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const year = Number(process.argv[2]) || new Date().getFullYear();
  const teamId = process.argv[3]; // required to avoid mass updates
  const type = (process.argv[4] || 'PROFESSIONAL').toUpperCase();
  const worker = Number(process.argv[5] || 1.25);
  const employer = Number(process.argv[6] || 5.0);

  if (!teamId) {
    console.error('Usage: node scripts/updateSolidarityRates.js <year> <teamId> [type] [worker%] [employer%]');
    process.exit(1);
  }

  console.log(`\n🔧 Aggiorno solidarity per ${year}, team ${teamId}, type ${type} → worker=${worker}%, employer=${employer}%`);

  const saved = await prisma.taxRate.updateMany({
    where: { year, teamId, type },
    data: { solidarityWorker: worker, solidarityEmployer: employer },
  });

  console.log(`✅ Aggiornate ${saved.count} righe`);
}

main().catch(e => {
  console.error('❌ Errore aggiornamento:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});





