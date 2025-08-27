// server/assign-players-to-team.js
// Script per assegnare giocatori esistenti al team Vis Pesaro 1898

const { PrismaClient } = require('./prisma/generated/client');

const prisma = new PrismaClient();

async function assignPlayersToTeam() {
  try {
    console.log('🔵 Assegnazione giocatori al team Vis Pesaro 1898...');
    
    // Trova il team Vis Pesaro
    const team = await prisma.team.findFirst({
      where: { 
        name: "Vis Pesaro 1898" 
      }
    });

    if (!team) {
      console.log('🔴 Team Vis Pesaro 1898 non trovato!');
      return;
    }

    console.log('🟢 Team trovato:', team.name, 'ID:', team.id);

    // Trova tutti i giocatori senza team
    const players = await prisma.player.findMany({
      where: {
        teamId: null // Solo giocatori non ancora assegnati
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        teamId: true
      }
    });

    console.log('🔵 Giocatori senza team trovati:', players.length);

    if (players.length === 0) {
      console.log('🟡 Nessun giocatore da assegnare (tutti già hanno un team)');
      return;
    }

    // Assegna ogni giocatore al team Vis Pesaro
    let assignedCount = 0;
    for (const player of players) {
      await prisma.player.update({
        where: { id: player.id },
        data: { teamId: team.id }
      });
      
      console.log(`🟢 Giocatore ${player.firstName} ${player.lastName} (${player.position}) assegnato a Vis Pesaro 1898`);
      assignedCount++;
    }

    // Verifica risultato finale
    const teamWithPlayers = await prisma.team.findUnique({
      where: { id: team.id },
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            shirtNumber: true
          }
        },
        users: {
          select: {
            first_name: true,
            last_name: true,
            role: true
          }
        }
      }
    });

    console.log('\n📊 RIEPILOGO FINALE:');
    console.log(`Team: ${teamWithPlayers.name}`);
    console.log(`Giocatori assegnati: ${assignedCount}`);
    console.log(`Giocatori totali nel team: ${teamWithPlayers.players.length}`);
    console.log(`Utenti nel team: ${teamWithPlayers.users.length}`);
    
    console.log('\n👥 ROSTER VIS PESARO 1898:');
    teamWithPlayers.players.forEach(player => {
      const shirt = player.shirtNumber ? `#${player.shirtNumber}` : 'No #';
      console.log(`- ${player.firstName} ${player.lastName} (${player.position}) ${shirt}`);
    });

    console.log('\n👔 STAFF VIS PESARO 1898:');
    teamWithPlayers.users.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.role})`);
    });

    console.log('\n✅ Step 2 completato - Giocatori collegati al team!');
    console.log('🎯 Multi-tenancy core implementato con successo!');

  } catch (error) {
    console.log('🔴 Errore assegnazione giocatori:', error.message);
    console.log('🔴 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui script
assignPlayersToTeam();