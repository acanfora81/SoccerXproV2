// Test registrazione semplice
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: __dirname + '/../../.env' });

async function testRegisterSimple() {
  try {
    console.log('🔵 [TEST] Test registrazione semplice...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ [TEST] Variabili Supabase non configurate');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test registrazione
    const testEmail = 'test-register-' + Date.now() + '@example.com';
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'testpassword123',
      email_confirm: true
    });
    
    if (error) {
      console.error('❌ [TEST] Errore registrazione:', error.message);
      return;
    }
    
    console.log('✅ [TEST] Registrazione riuscita:', data.user.id);
    
    // Test login
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: 'testpassword123'
    });
    
    if (loginError) {
      console.error('❌ [TEST] Errore login:', loginError.message);
    } else {
      console.log('✅ [TEST] Login riuscito:', loginData.user.id);
    }
    
    // Cleanup
    const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
    if (deleteError) {
      console.error('❌ [TEST] Errore eliminazione utente:', deleteError.message);
    } else {
      console.log('✅ [TEST] Utente eliminato');
    }
    
  } catch (error) {
    console.error('❌ [TEST] Errore test registrazione semplice:', error.message);
  }
}

testRegisterSimple();


