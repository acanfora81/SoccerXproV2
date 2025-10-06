// Script per verificare i dati performance nel database
const { getPrismaClient } = require('../src/config/database');

async function checkPerformanceData() {
  const prisma = getPrismaClient();
  
  try {
    console.log('🔍 Verifica dati performance nel database...\n');
    
    // Conta totale record
    const totalCount = await prisma.performanceData.count();
    console.log(`📊 Totale record: ${totalCount}\n`);
    
    // Controlla quanti hanno total_distance_m NULL o 0
    const nullDistance = await prisma.performanceData.count({
      where: {
        OR: [
          { total_distance_m: null },
          { total_distance_m: 0 }
        ]
      }
    });
    
    console.log(`❌ Record con total_distance_m NULL o 0: ${nullDistance} (${((nullDistance/totalCount)*100).toFixed(1)}%)`);
    
    // Controlla quanti hanno sprint_distance_m NULL o 0
    const nullSprint = await prisma.performanceData.count({
      where: {
        OR: [
          { sprint_distance_m: null },
          { sprint_distance_m: 0 }
        ]
      }
    });
    
    console.log(`❌ Record con sprint_distance_m NULL o 0: ${nullSprint} (${((nullSprint/totalCount)*100).toFixed(1)}%)`);
    
    // Controlla quanti hanno top_speed_kmh NULL o 0
    const nullSpeed = await prisma.performanceData.count({
      where: {
        OR: [
          { top_speed_kmh: null },
          { top_speed_kmh: 0 }
        ]
      }
    });
    
    console.log(`❌ Record con top_speed_kmh NULL o 0: ${nullSpeed} (${((nullSpeed/totalCount)*100).toFixed(1)}%)\n`);
    
    // Mostra alcuni record di esempio
    console.log('📋 Esempi di record (ultimi 5):');
    const examples = await prisma.performanceData.findMany({
      take: 5,
      orderBy: { session_date: 'desc' },
      select: {
        id: true,
        session_date: true,
        session_name: true,
        total_distance_m: true,
        sprint_distance_m: true,
        top_speed_kmh: true,
        player_load: true,
        duration_minutes: true,
        player: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    examples.forEach((record, i) => {
      console.log(`\n${i+1}. ${record.player.firstName} ${record.player.lastName} - ${new Date(record.session_date).toLocaleDateString('it-IT')}`);
      console.log(`   Session: ${record.session_name || 'N/A'}`);
      console.log(`   Distanza: ${record.total_distance_m || 0}m`);
      console.log(`   Sprint: ${record.sprint_distance_m || 0}m`);
      console.log(`   Vel.Max: ${record.top_speed_kmh || 0} km/h`);
      console.log(`   PL: ${record.player_load || 0}`);
      console.log(`   Durata: ${record.duration_minutes || 0} min`);
    });
    
    // Verifica se ci sono record con dati validi
    console.log('\n\n🔍 Cerca record con dati completi...');
    const validRecords = await prisma.performanceData.findMany({
      where: {
        AND: [
          { total_distance_m: { not: null } },
          { total_distance_m: { gt: 0 } },
          { top_speed_kmh: { not: null } },
          { top_speed_kmh: { gt: 0 } }
        ]
      },
      take: 5,
      orderBy: { session_date: 'desc' },
      select: {
        id: true,
        session_date: true,
        session_name: true,
        total_distance_m: true,
        sprint_distance_m: true,
        top_speed_kmh: true,
        player: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (validRecords.length > 0) {
      console.log(`\n✅ Trovati ${validRecords.length} record con dati completi:`);
      validRecords.forEach((record, i) => {
        console.log(`${i+1}. ${record.player.firstName} ${record.player.lastName} - ${record.total_distance_m}m, ${record.top_speed_kmh} km/h`);
      });
    } else {
      console.log('\n⚠️  ATTENZIONE: Nessun record trovato con dati completi!');
      console.log('\n💡 SOLUZIONE: I dati potrebbero essere in altri campi o non importati.');
      console.log('   Controlla i file CSV di esempio e verifica il mapping delle colonne.');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPerformanceData();

