# Rimozione Sistema Fiscale Parametrico

## Panoramica

Il sistema fiscale parametrico (Gestione Scaglioni) è stato completamente rimosso dal progetto SoccerXpro V2. Questa operazione include:

- ❌ Pagina "Gestione Scaglioni" (`/tax/admin`)
- ❌ API `/api/tax-scenarios/*`
- ❌ Tabelle del database fiscali parametriche
- ❌ Documentazione del sistema

## Modifiche Effettuate

### Frontend
- ✅ Eliminato `client/src/pages/AdminTaxScales.jsx`
- ✅ Rimosso import e route da `client/src/App.jsx`
- ✅ Rimossa voce menu da `client/src/components/layout/MainLayout.jsx`

### Backend
- ✅ Eliminato `server/src/routes/taxScenarios.js`
- ✅ Rimossa route `/api/tax-scenarios` da `server/src/app.js`
- ✅ Eliminato `server/create-dynamic-tax-schema.sql`

### Database
- ✅ Rimosse tabelle da `server/prisma/schema.prisma`:
  - `tax_scenario`
  - `tax_bracket_table`
  - `tax_bracket_row`
  - `contribution_points`
  - `detrazione_override_points`
  - `l207_bonus_band`
  - `l207_detrazione_cfg`
  - `tax_extras`
- ✅ Rimosso enum `tax_bracket_kind`

### Documentazione
- ✅ Eliminato `docs/SISTEMA_FISCALE_PARAMETRICO.md`

## Migrazione Database

Per completare la rimozione dal database Supabase, esegui:

```bash
cd server
node scripts/drop-tax-scenarios-tables.js
```

**ATTENZIONE**: Questa operazione è IRREVERSIBILE e rimuoverà tutti i dati del sistema fiscale parametrico.

## Verifica

Dopo l'esecuzione della migrazione, verifica che:

1. ✅ La pagina `/tax/admin` restituisce 404
2. ✅ Le API `/api/tax-scenarios/*` non sono più disponibili
3. ✅ Le tabelle fiscali sono state eliminate da Supabase
4. ✅ Il Calcolatore Fiscale (`/tax/calculator`) continua a funzionare normalmente

## Sistema Fiscale Rimanente

Il sistema fiscale tradizionale rimane intatto:

- ✅ **Calcolatore Fiscale** (`/tax/calculator`) - Funziona con file CSV statici
- ✅ **Aliquote Stipendi** (`/taxrates/*`) - Sistema tradizionale
- ✅ **Aliquote Bonus** (`/bonustaxrates/*`) - Sistema tradizionale

## Rollback

Se necessario, il rollback richiede:

1. Ripristinare i file eliminati dal repository Git
2. Eseguire `create-dynamic-tax-schema.sql` per ricreare le tabelle
3. Rigenerare il client Prisma: `npx prisma generate`

---

**Data rimozione**: 2025-01-27  
**Motivo**: Semplificazione del sistema fiscale


