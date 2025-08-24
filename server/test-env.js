// 🧪 Test configurazione .env - server/test-env.js
require('dotenv').config();

console.log('🔵 === TEST CONFIGURAZIONE ENV ===\n');

// Test variabili base
console.log('🟢 NODE_ENV:', process.env.NODE_ENV);
console.log('🟢 PORT:', process.env.PORT);
console.log('🟢 APP_NAME:', process.env.APP_NAME);

// Test Database
console.log('\n🔵 === DATABASE ===');
console.log('🟢 DATABASE_URL presente:', !!process.env.DATABASE_URL);
console.log('🟢 DB_HOST:', process.env.DB_HOST);

// Test Supabase
console.log('\n🔵 === SUPABASE ===');
console.log('🟢 SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('🟢 SUPABASE_ANON_KEY presente:', !!process.env.SUPABASE_ANON_KEY);
console.log('🟢 SUPABASE_ANON_KEY lunghezza:', process.env.SUPABASE_ANON_KEY?.length || 0);
console.log('🟢 SUPABASE_SERVICE_ROLE_KEY presente:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('🟢 SUPABASE_SERVICE_ROLE_KEY lunghezza:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0);

// Test JWT
console.log('\n🔵 === JWT AUTHENTICATION ===');
console.log('🟢 JWT_SECRET presente:', !!process.env.JWT_SECRET);
console.log('🟢 JWT_SECRET lunghezza:', process.env.JWT_SECRET?.length || 0);
console.log('🟢 JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN);
console.log('🟢 SESSION_SECRET presente:', !!process.env.SESSION_SECRET);
console.log('🟢 SESSION_SECRET lunghezza:', process.env.SESSION_SECRET?.length || 0);

// Test CORS
console.log('\n🔵 === CORS ===');
console.log('🟢 CORS_ORIGIN:', process.env.CORS_ORIGIN);

// Validazione lunghezze
console.log('\n🔵 === VALIDAZIONE ===');

// JWT Secret dovrebbe essere ~128 caratteri (64 bytes hex)
if (process.env.JWT_SECRET?.length >= 100) {
    console.log('✅ JWT_SECRET: Lunghezza OK');
} else {
    console.log('❌ JWT_SECRET: Troppo corto!');
}

// Session Secret dovrebbe essere ~64 caratteri (32 bytes hex)
if (process.env.SESSION_SECRET?.length >= 50) {
    console.log('✅ SESSION_SECRET: Lunghezza OK');
} else {
    console.log('❌ SESSION_SECRET: Troppo corto!');
}

// Supabase Anon Key dovrebbe iniziare con eyJ
if (process.env.SUPABASE_ANON_KEY?.startsWith('eyJ')) {
    console.log('✅ SUPABASE_ANON_KEY: Formato JWT OK');
} else {
    console.log('❌ SUPABASE_ANON_KEY: Non sembra un JWT!');
}

// Supabase Service Role Key dovrebbe iniziare con eyJ
if (process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ')) {
    console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Formato JWT OK');
} else {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY: Non sembra un JWT!');
}

// Supabase URL dovrebbe essere https
if (process.env.SUPABASE_URL?.startsWith('https://')) {
    console.log('✅ SUPABASE_URL: Formato OK');
} else {
    console.log('❌ SUPABASE_URL: Dovrebbe iniziare con https://');
}

console.log('\n🔵 === TEST COMPLETATO ===');

// Test connessione Supabase (opzionale)
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('\n🔵 === TEST CONNESSIONE SUPABASE ===');
    
    // Semplice test URL
    try {
        const url = new URL(process.env.SUPABASE_URL);
        console.log('✅ SUPABASE_URL è un URL valido');
        console.log('🟢 Host:', url.hostname);
    } catch (error) {
        console.log('❌ SUPABASE_URL non è un URL valido:', error.message);
    }
}