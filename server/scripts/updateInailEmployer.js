const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../prisma/.env') });

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const year = Number(process.argv[2]) || new Date().getFullYear();
  const teamId = process.argv[3]; // required to avoid mass updates
  const type = (process.argv[4] || 'PROFESSIONAL').toUpperCase();
  const inailEmployer = Number(process.argv[5] || 7.90);

  if (!teamId) {
    console.error('Usage: node scripts/updateInailEmployer.js <year> <teamId> [type] [inailEmployer%]');
    process.exit(1);
  }

  console.log(`\n🔧 Aggiorno INAIL Employer per ${year}, team ${teamId}, type ${type} → ${inailEmployer}%`);

  const saved = await prisma.taxRate.updateMany({
    where: { year, teamId, type },
    data: { inailEmployer: inailEmployer },
  });

  console.log(`✅ Aggiornate ${saved.count} righe`);
}

main().catch(e => {
  console.error('❌ Errore aggiornamento:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});











