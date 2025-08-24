// 🔍 Script per testare Supabase Auth direttamente
// Crea questo file come debug-supabase.js nella cartella server

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

console.log('🔵 Test Supabase Auth...');

// Test configurazione environment
console.log('🔍 Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Presente' : '❌ Mancante');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Presente' : '❌ Mancante');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Presente' : '❌ Mancante');

// Test client Supabase
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSupabase() {
  console.log('\n🧪 Test 1: Connessione Supabase...');
  
  try {
    // Test connessione base
    const { data, error } = await supabasePublic.from('user_profiles').select('count').limit(1);
    
    if (error) {
      console.log('🟡 Errore query test:', error.message);
      console.log('🔍 Codice errore:', error.code);
      console.log('🔍 Dettagli:', error.details);
    } else {
      console.log('✅ Connessione database OK');
    }
  } catch (err) {
    console.log('🔴 Errore connessione:', err.message);
  }

  console.log('\n🧪 Test 2: Registrazione Supabase Admin...');
  
  try {
    // Test registrazione con admin
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: 'debug.test@temp.com',
      password: 'TempPassword123!',
      email_confirm: true
    });
    
    if (error) {
      console.log('🟡 Errore registrazione admin:', error.message);
      console.log('🔍 Codice errore:', error.code);
    } else {
      console.log('✅ Registrazione admin OK');
      
      // Cleanup - elimina utente test
      try {
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        console.log('🧹 Cleanup utente test completato');
      } catch (cleanupErr) {
        console.log('🟡 Errore cleanup:', cleanupErr.message);
      }
    }
  } catch (err) {
    console.log('🔴 Errore test admin:', err.message);
  }

  console.log('\n🧪 Test 3: Login Supabase Public...');
  
  try {
    // Test login fallito (credenziali fake)
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email: 'fake@test.com',
      password: 'fake123'
    });
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        console.log('✅ Auth public funziona (errore credenziali atteso)');
      } else {
        console.log('🟡 Errore auth unexpected:', error.message);
      }
    } else {
      console.log('🤔 Login inaspettatamente riuscito');
    }
  } catch (err) {
    console.log('🔴 Errore test public:', err.message);
  }
}

testSupabase().then(() => {
  console.log('\n🏁 Test Supabase completato');
  process.exit(0);
}).catch(err => {
  console.log('🔴 Errore fatale:', err.message);
  process.exit(1);
});