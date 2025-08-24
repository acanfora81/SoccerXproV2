// server/seed-vis-pesaro.js
// Script per creare il team Vis Pesaro 1898 e assegnare utenti esistenti

const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function createVisPesaroTeam() {
  try {
    console.log('🟢 Creazione team Vis Pesaro 1898...');
    
    // Verifica se esiste già un team
    const existingTeam = await prisma.team.findFirst();
    if (existingTeam) {
      console.log('🟡 Team già esistente:', existingTeam.name);
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

    console.log('🟢 Team creato:', team.name, 'ID:', team.id);

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

    console.log('🔵 Utenti trovati:', users.length);

    // Assegna tutti gli utenti al team Vis Pesaro
    let assignedCount = 0;
    for (const user of users) {
      if (!user.teamId) { // Solo se non hanno già un team
        await prisma.userProfile.update({
          where: { id: user.id },
          data: { teamId: team.id }
        });
        
        console.log(`🟢 Utente ${user.first_name} ${user.last_name} (${user.email}) assegnato a Vis Pesaro 1898`);
        assignedCount++;
      } else {
        console.log(`🟡 Utente ${user.first_name} ${user.last_name} già ha team`);
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

    console.log('🟢 SUCCESSO: Team Vis Pesaro 1898 creato!');
    console.log('🟢 Utenti assegnati:', assignedCount);
    console.log('🟢 Utenti nel team:', teamWithUsers.users.length);
    
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

    console.log('\n✅ Step 1C completato - Team multi-tenant ready!');

  } catch (error) {
    console.log('🔴 Errore creazione team:', error.message);
    console.log('🔴 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui script
createVisPesaroTeam();