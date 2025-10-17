# 🚀 Applicazione Migrazione Fiscal Setup V2

## 📋 Pre-requisiti

1. ✅ Prisma Client generato (`npx prisma generate` già eseguito)
2. ⏳ Database PostgreSQL raggiungibile
3. ⏳ Variabili ambiente configurate (`.env` con `DATABASE_URL`)

## 🔧 Comandi per Applicare Migrazione

### 1. Verifica Connessione DB
```bash
cd server
npx prisma db pull --force
```

### 2. Genera e Applica Migrazione
```bash
# Crea migrazione (senza applicarla)
npx prisma migrate dev --name fiscal_setup_v2_parlante --create-only

# Rivedi il file SQL generato in:
# server/prisma/migrations/YYYYMMDDHHMMSS_fiscal_setup_v2_parlante/migration.sql

# Applica migrazione
npx prisma migrate deploy
```

### 3. Verifica Tabelle Create
```bash
npx prisma studio
```

Dovresti vedere le nuove tabelle:
- `tax_rates_v2`
- `tax_contribution_profiles`
- `tax_contribution_points`
- `tax_contribution_brackets`
- `tax_irpef_detraction_overrides`
- `tax_regional_additionals`
- `tax_regional_additional_brackets_v2`
- `tax_municipal_additionals`
- `tax_municipal_additional_brackets_v2`
- `tax_bonus_l207_bands`
- `tax_extra_deduction_l207`

## 📊 Popolamento Iniziale (Opzionale)

### Via SQL (se hai dati legacy da migrare)
```sql
-- Esempio: Copia dati da TaxRate legacy a tax_rates_v2
INSERT INTO soccerxpro.tax_rates_v2 (
  id, team_id, year, contract_type,
  inps_worker_pct, ffc_worker_pct, solidarity_worker_pct,
  inps_employer_pct, ffc_employer_pct, inail_employer_pct, 
  solidarity_employer_pct, fondo_rate_pct,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  "teamId",
  year,
  type::text::soccerxpro."ContractType",
  "inpsWorker"::numeric,
  "ffcWorker"::numeric,
  COALESCE("solidarityWorker", 0)::numeric,
  "inpsEmployer"::numeric,
  "ffcEmployer"::numeric,
  COALESCE("inailEmployer", 0)::numeric,
  COALESCE("solidarityEmployer", 0)::numeric,
  0.5,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM soccerxpro.tax_rates
WHERE year >= 2024;
```

### Via API (consigliato per nuove configurazioni)
Usa la UI `/dashboard/tax/fiscal-setup` per configurare:
1. Aliquote contributive
2. Scaglioni IRPEF
3. Addizionali regionale/comunale
4. Bonus L.207/2019

Oppure usa endpoint `/api/fiscal-setup/copy-from-year` per duplicare anno precedente.

## ✅ Test Endpoint V2

### Test Netto → Lordo
```bash
curl -X POST http://localhost:5002/api/taxes/v2/gross-from-net \
  -H "Content-Type: application/json" \
  -d '{
    "netSalary": 33500,
    "year": 2025,
    "contractType": "PROFESSIONAL",
    "region": "Marche",
    "municipality": "Pesaro",
    "teamId": "your-team-id"
  }'
```

**Risultato Atteso**:
```json
{
  "success": true,
  "data": {
    "grossSalary": 56565.00,
    "netSalary": 33500.00,
    "companyCost": 81300.00,
    "totaleContributiWorker": 5195.52,
    "totaleContributiEmployer": 16975.50,
    ...
  }
}
```

### Test Lordo → Netto
```bash
curl -X POST http://localhost:5002/api/taxes/v2/net-from-gross \
  -H "Content-Type: application/json" \
  -d '{
    "grossSalary": 56565,
    "year": 2025,
    "contractType": "PROFESSIONAL",
    "region": "Marche",
    "municipality": "Pesaro",
    "teamId": "your-team-id"
  }'
```

## 🐛 Troubleshooting

### Errore: "Fiscal profile not found"
**Causa**: Tabelle vuote, nessuna configurazione per teamId/year/contractType.  
**Soluzione**: Popola `tax_rates_v2` tramite UI o SQL.

### Errore: "Cannot find module 'engine-dynamic'"
**Causa**: Path import errato.  
**Soluzione**: Verifica `require('../lib/tax/engine-dynamic')` in `fiscalProfileLoader.js`.

### Errore: "Unknown column inps_worker_pct"
**Causa**: Migrazione non applicata.  
**Soluzione**: Esegui `npx prisma migrate deploy`.

## 📈 Monitoring

Dopo l'applicazione, verifica i log del server per:
- `📊 [FiscalProfileLoader] Loading profile for...`
- `✅ [FiscalProfileLoader] Profile loaded successfully`
- `🟦 [V2] /api/taxes/v2/gross-from-net REQUEST:`
- `🟩 [V2] /api/taxes/v2/gross-from-net RESPONSE:`

## 🔄 Rollback (se necessario)

```bash
# Identifica ultima migrazione applicata
npx prisma migrate status

# Rollback manuale
npx prisma migrate resolve --rolled-back fiscal_setup_v2_parlante

# Oppure revert SQL manualmente
DROP TABLE IF EXISTS soccerxpro.tax_rates_v2 CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_contribution_profiles CASCADE;
-- ... etc
```

---

**Nota**: Una volta applicata la migrazione e popolate le tabelle, il sistema fiscale sarà completamente DB-driven e configurabile via UI.





