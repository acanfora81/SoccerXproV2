// Controlla il contratto appena creato nel database
import { PrismaClient } from './server/prisma/generated/client/index.js';

const prisma = new PrismaClient();

async function checkContract() {
  try {
    console.log('🔍 Controllo contratti recenti...');
    
    // Trova i contratti più recenti
    const recentContracts = await prisma.contracts.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        players: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log('📋 Contratti recenti:');
    recentContracts.forEach((contract, index) => {
      console.log(`${index + 1}. ${contract.players.firstName} ${contract.players.lastName}`);
      console.log(`   ID: ${contract.id}`);
      console.log(`   Salary: ${contract.salary} (tipo: ${typeof contract.salary})`);
      console.log(`   NetSalary: ${contract.netSalary} (tipo: ${typeof contract.netSalary})`);
      console.log(`   Creato: ${contract.createdAt}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Errore nel controllo contratti:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContract();



