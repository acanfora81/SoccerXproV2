// scripts/seed-first-team.js
// Script per creare il team Vis Pesaro 1898 e assegnare utenti esistenti

const { PrismaClient } = require('../server/prisma/generated/client');

const prisma = getPrismaClient();

async function createVisPesaroTeam() {
  try {
    console.log('🟢 Creazione team Vis Pesaro 1898...'); // INFO - rimuovere in produzione
    
    // Verifica se esiste già un team
    const existingTeam = await prisma.team.findFirst();
    if (existingTeam) {
      console.log('🟡 Team già esistente:', existingTeam.name); // WARNING - rimuovere in produzione
      return;
    }

    // Crea team Vis Pesaro 1898
    const team = await prisma.team.create({
      data: {
        name: "Vis Pesaro 1898",
        slug: "vis-pesaro-1898",
        plan: "pro",
        email: "info@vispesaro1898.it",
        phone: "+39 0721 67890",
        address: "Stadio Tonino Benelli, Via dei Cappuccini, Pesaro (PU)",
        maxPlayers: 50,
        maxUsers: 15,
        subscriptionStatus: "active"
      }
    });

    console.log('🟢 Team creato:', team.name, 'ID:', team.id); // INFO - rimuovere in produzione

    // Trova tutti gli utenti esistenti
    const users = await prisma.userProfile.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        teamId: true
      }
    });

    console.log('🔵 Utenti trovati:', users.length); // INFO DEV - rimuovere in produzione

    // Assegna tutti gli utenti al team Vis Pesaro
    let assignedCount = 0;
    for (const user of users) {
      if (!user.teamId) { // Solo se non hanno già un team
        await prisma.userProfile.update({
          where: { id: user.id },
          data: { teamId: team.id }
        });
        
        console.log(`🟢 Utente ${user.first_name} ${user.last_name} (${user.email}) assegnato a Vis Pesaro 1898`); // INFO - rimuovere in produzione
        assignedCount++;
      } else {
        console.log(`🟡 Utente ${user.first_name} ${user.last_name} già ha team`); // WARNING - rimuovere in produzione
      }
    }

    // Verifica risultato
    const teamWithUsers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        users: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true
          }
        }
      }
    });

    console.log('🟢 SUCCESSO: Team Vis Pesaro 1898 creato!'); // INFO - rimuovere in produzione
    console.log('🟢 Utenti assegnati:', assignedCount); // INFO - rimuovere in produzione
    console.log('🟢 Utenti nel team:', teamWithUsers.users.length); // INFO - rimuovere in produzione
    
    // Mostra riepilogo
    console.log('\n📊 RIEPILOGO TEAM:');
    console.log(`Nome: ${teamWithUsers.name}`);
    console.log(`Slug: ${teamWithUsers.slug}`);
    console.log(`Piano: ${teamWithUsers.plan}`);
    console.log(`Email: ${teamWithUsers.email}`);
    console.log(`Telefono: ${teamWithUsers.phone}`);
    console.log(`Indirizzo: ${teamWithUsers.address}`);
    console.log(`Max Giocatori: ${teamWithUsers.maxPlayers}`);
    console.log(`Max Utenti: ${teamWithUsers.maxUsers}`);
    
    console.log('\n👥 UTENTI ASSEGNATI:');
    teamWithUsers.users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.role})`);
    });

    console.log('\n✅ Step 1C completato - Team multi-tenant ready!'); // INFO - rimuovere in produzione

  } catch (error) {
    console.log('🔴 Errore creazione team:', error.message); // ERROR - mantenere essenziali
    console.log('🔴 Stack:', error.stack); // ERROR - mantenere essenziali
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui script
createVisPesaroTeam();