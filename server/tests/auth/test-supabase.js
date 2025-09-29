// Test Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function testSupabase() {
  try {
    console.log('🔵 [TEST] Test Supabase...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ [TEST] Variabili Supabase non configurate');
      return;
    }
    
    console.log('✅ [TEST] Variabili Supabase configurate');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey.substring(0, 20) + '...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connessione
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ [TEST] Errore connessione Supabase:', error.message);
      return;
    }
    
    console.log('✅ [TEST] Connessione Supabase riuscita');
    console.log('✅ [TEST] Utenti trovati:', data.users?.length || 0);
    
    // Test creazione utente
    const testEmail = 'test-supabase-' + Date.now() + '@example.com';
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (userError) {
      console.error('❌ [TEST] Errore creazione utente:', userError.message);
      return;
    }
    
    console.log('✅ [TEST] Utente creato:', userData.user.id);
    
    // Cleanup
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userData.user.id);
    if (deleteError) {
      console.error('❌ [TEST] Errore eliminazione utente:', deleteError.message);
    } else {
      console.log('✅ [TEST] Utente eliminato');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Errore test Supabase:', error.message);
  }
}

testSupabase();








