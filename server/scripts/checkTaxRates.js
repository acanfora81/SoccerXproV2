const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../prisma/.env') });

const { PrismaClient } = require('../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  const year = Number(process.argv[2]) || new Date().getFullYear();
  const teamId = process.argv[3] || undefined;
  const type = process.argv[4] || undefined; // e.g., PROFESSIONAL

  console.log(`\n🔍 TaxRate per anno ${year}${teamId ? `, team ${teamId}` : ''}${type ? `, type ${type}` : ''}`);

  const where = { year };
  if (teamId) where.teamId = teamId;
  if (type) where.type = type;

  const rows = await prisma.taxRate.findMany({ where, orderBy: [{ teamId: 'asc' }, { type: 'asc' }] });
  if (rows.length === 0) {
    console.log('❌ Nessuna riga tax_rates trovata');
  } else {
    console.table(rows.map(r => ({
      id: r.id,
      teamId: r.teamId,
      type: r.type,
      inpsWorker: String(r.inpsWorker),
      ffcWorker: String(r.ffcWorker),
      solidarityWorker: r.solidarityWorker != null ? String(r.solidarityWorker) : null,
      inpsEmployer: String(r.inpsEmployer),
      inailEmployer: r.inailEmployer != null ? String(r.inailEmployer) : null,
      ffcEmployer: String(r.ffcEmployer),
      solidarityEmployer: r.solidarityEmployer != null ? String(r.solidarityEmployer) : null,
    })));
  }
}

main().catch(e => {
  console.error('Errore:', e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});





