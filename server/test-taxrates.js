const { PrismaClient } = require('./prisma/generated/client'); // oppure "@prisma/client" se hai rimesso output standard
const prisma = new PrismaClient();

async function main() {
  const rates = await prisma.taxRate.findMany();
  console.log("Aliquote trovate in Supabase:", rates);
}

main()
  .catch((e) => {
    console.error("Errore Prisma:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



