// prisma-test.js
const { PrismaClient } = require('../../prisma/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const teams = await prisma.team.findMany();
    console.log("✅ Connessione riuscita, squadre trovate:", teams);
  } catch (err) {
    console.error("❌ Errore nella connessione o query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();


