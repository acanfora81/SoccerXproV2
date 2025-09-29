// Debug registrazione
const { createClient } = require('@supabase/supabase-js');
const { PrismaClient } = require('../../prisma/generated/client');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function debugRegister() {
  try {
    console.log('🔵 [DEBUG] Debug registrazione...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ [DEBUG] Variabili Supabase non configurate');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const prisma = new PrismaClient();
    
    // Test connessione database
    await prisma.$connect();
    console.log('✅ [DEBUG] Connessione database riuscita');
    
    // Test connessione Supabase
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error('❌ [DEBUG] Errore connessione Supabase:', error.message);
      return;
    }
    console.log('✅ [DEBUG] Connessione Supabase riuscita');
    
    // Test creazione team
    const team = await prisma.team.create({
      data: {
        name: 'Debug Team',
        slug: 'debug-team-' + Date.now(),
        plan: 'basic',
        isActive: true,
        maxUsers: 5,
        maxPlayers: 25,
        email: 'debug@example.com',
        subscriptionStatus: 'trial',
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        subscriptionEndsAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
    
    console.log('✅ [DEBUG] Team creato:', team.id);
    
    // Test creazione utente Supabase
    const testEmail = 'debug-' + Date.now() + '@example.com';
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'debugpassword123',
      email_confirm: true
    });
    
    if (userError) {
      console.error('❌ [DEBUG] Errore creazione utente Supabase:', userError.message);
      return;
    }
    
    console.log('✅ [DEBUG] Utente Supabase creato:', userData.user.id);
    
    // Test creazione user profile
    const userProfile = await prisma.userProfile.create({
      data: {
        auth_user_id: userData.user.id,
        email: testEmail,
        first_name: 'Debug',
        last_name: 'User',
        role: 'ADMIN',
        teamId: team.id,
        theme_preference: 'light',
        language_preference: 'it',
        is_active: true
      }
    });
    
    console.log('✅ [DEBUG] UserProfile creato:', userProfile.id);
    
    // Test query completa
    const teamWithUsers = await prisma.team.findUnique({
      where: { id: team.id },
      include: { users: true }
    });
    
    console.log('✅ [DEBUG] Team con users:', teamWithUsers);
    
    // Cleanup
    await prisma.userProfile.delete({ where: { id: userProfile.id } });
    await prisma.team.delete({ where: { id: team.id } });
    await supabase.auth.admin.deleteUser(userData.user.id);
    console.log('✅ [DEBUG] Cleanup completato');
    
  } catch (error) {
    console.error('❌ [DEBUG] Errore debug registrazione:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugRegister();








