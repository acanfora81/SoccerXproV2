#!/usr/bin/env node

/**
 * Script per assegnare licenza SCOUTING a un account
 * 
 * Uso:
 * node scripts/grant-scouting-license.js <accountId> [plan] [seats]
 * 
 * Esempio:
 * node scripts/grant-scouting-license.js 2c682524-e93f-4269-9499-0b3c40ff2a5d BASIC 10
 */

const { getPrismaClient } = require('../src/config/database');

async function grantScoutingLicense(accountId, plan = 'BASIC', seats = 10) {
  const prisma = getPrismaClient();
  
  try {
    console.log(`🔍 Verifico account ${accountId}...`);
    
    // Verifica che l'account esista
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, name: true, slug: true }
    });
    
    if (!account) {
      throw new Error(`Account ${accountId} non trovato`);
    }
    
    console.log(`✅ Account trovato: ${account.name} (${account.slug})`);
    
    // Verifica se esiste già una licenza SCOUTING
    const existingLicense = await prisma.accountModuleLicense.findUnique({
      where: {
        accountId_module: {
          accountId: accountId,
          module: 'SCOUTING'
        }
      }
    });
    
    if (existingLicense) {
      console.log(`🔄 Licenza SCOUTING esistente trovata (status: ${existingLicense.status})`);
      
      // Aggiorna la licenza esistente
      const updatedLicense = await prisma.accountModuleLicense.update({
        where: {
          accountId_module: {
            accountId: accountId,
            module: 'SCOUTING'
          }
        },
        data: {
          status: 'ACTIVE',
          plan: plan,
          seats: seats,
          endDate: null, // Nessuna scadenza
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Licenza SCOUTING aggiornata per account ${account.name}`);
      console.log(`   - Status: ${updatedLicense.status}`);
      console.log(`   - Plan: ${updatedLicense.plan}`);
      console.log(`   - Seats: ${updatedLicense.seats}`);
      
    } else {
      console.log(`🆕 Creo nuova licenza SCOUTING...`);
      
      // Crea nuova licenza
      const newLicense = await prisma.accountModuleLicense.create({
        data: {
          accountId: accountId,
          module: 'SCOUTING',
          plan: plan,
          status: 'ACTIVE',
          seats: seats,
          features: {},
          startDate: new Date(),
          endDate: null, // Nessuna scadenza
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Licenza SCOUTING creata per account ${account.name}`);
      console.log(`   - ID: ${newLicense.id}`);
      console.log(`   - Status: ${newLicense.status}`);
      console.log(`   - Plan: ${newLicense.plan}`);
      console.log(`   - Seats: ${newLicense.seats}`);
    }
    
    console.log(`\n🎯 Prossimi passi:`);
    console.log(`   1. Aggiungi in server/.env: FEATURE_SCOUTING_MODULE=true`);
    console.log(`   2. Riavvia il server`);
    console.log(`   3. Assicurati che l'utente abbia ruolo: SCOUT, DIRECTOR_SPORT, o ADMIN`);
    
  } catch (error) {
    console.error(`❌ Errore:`, error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Parse arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.log(`❌ Uso: node scripts/grant-scouting-license.js <accountId> [plan] [seats]`);
  console.log(`   Esempio: node scripts/grant-scouting-license.js 2c682524-e93f-4269-9499-0b3c40ff2a5d BASIC 10`);
  process.exit(1);
}

const accountId = args[0];
const plan = args[1] || 'BASIC';
const seats = parseInt(args[2]) || 10;

// Validazione UUID
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (!uuidRegex.test(accountId)) {
  console.error(`❌ AccountId non valido: ${accountId}`);
  console.error(`   Deve essere un UUID valido`);
  process.exit(1);
}

console.log(`🚀 Assegno licenza SCOUTING...`);
console.log(`   Account: ${accountId}`);
console.log(`   Plan: ${plan}`);
console.log(`   Seats: ${seats}`);
console.log(``);

grantScoutingLicense(accountId, plan, seats);


