// Test database team
const { PrismaClient } = require('../../prisma/generated/client');

async function testDatabaseTeam() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔵 [TEST] Test database team...');
    
    // Test connessione
    await prisma.$connect();
    console.log('✅ [TEST] Connessione database riuscita');
    
    // Test creazione team
    const team = await prisma.team.create({
      data: {
        name: 'Test Team DB',
        slug: 'test-team-db-' + Date.now(),
        plan: 'basic',
        isActive: true,
        maxUsers: 5,
        maxPlayers: 25,
        email: 'test@example.com',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('✅ [TEST] Team creato:', team.id);
    
    // Test creazione user profile
    const userProfile = await prisma.userProfile.create({
      data: {
        auth_user_id: 'test-auth-user-' + Date.now(),
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'ADMIN',
        teamId: team.id,
        theme_preference: 'light',
        language_preference: 'it',
        is_active: true
      }
    });
    
    console.log('✅ [TEST] UserProfile creato:', userProfile.id);
    
    // Test query team con user
    const teamWithUsers = await prisma.team.findUnique({
      where: { id: team.id },
      include: { users: true }
    });
    
    console.log('✅ [TEST] Team con users:', teamWithUsers);
    
    // Cleanup
    await prisma.userProfile.delete({ where: { id: userProfile.id } });
    await prisma.team.delete({ where: { id: team.id } });
    console.log('✅ [TEST] Cleanup completato');
    
  } catch (error) {
    console.error('❌ [TEST] Errore test database team:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseTeam();








