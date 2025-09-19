#!/usr/bin/env node

/**
 * Script per rimuovere le tabelle del sistema fiscale parametrico da Supabase
 * 
 * Questo script esegue la migrazione 002_drop_tax_scenarios_tables.sql
 * per rimuovere completamente il sistema fiscale parametrico dal database.
 * 
 * Uso:
 *   node scripts/drop-tax-scenarios-tables.js
 * 
 * ATTENZIONE: Questa operazione è IRREVERSIBILE!
 * Tutti i dati del sistema fiscale parametrico verranno eliminati.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function dropTaxScenariosTables() {
  console.log('🗑️  Avvio rimozione sistema fiscale parametrico...');
  
  try {
    // Leggi il file di migrazione
    const migrationPath = path.join(__dirname, '../prisma/migrations/002_drop_tax_scenarios_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 File migrazione letto:', migrationPath);
    
    // Esegui la migrazione
    console.log('⚡ Esecuzione migrazione...');
    await prisma.$executeRawUnsafe(migrationSQL);
    
    console.log('✅ Migrazione completata con successo!');
    console.log('🗑️  Sistema fiscale parametrico rimosso completamente.');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Verifica che l'utente sia sicuro
console.log('⚠️  ATTENZIONE: Questa operazione rimuoverà PERMANENTEMENTE');
console.log('   tutte le tabelle e i dati del sistema fiscale parametrico.');
console.log('   Questa operazione è IRREVERSIBILE!');
console.log('');
console.log('   Tabelle che verranno eliminate:');
console.log('   - tax_scenario');
console.log('   - tax_bracket_table');
console.log('   - tax_bracket_row');
console.log('   - contribution_points');
console.log('   - detrazione_override_points');
console.log('   - l207_bonus_band');
console.log('   - l207_detrazione_cfg');
console.log('   - tax_extras');
console.log('   - tax_bracket_kind (enum)');
console.log('');

// Esegui la migrazione
dropTaxScenariosTables();
