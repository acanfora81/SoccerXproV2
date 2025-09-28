# 🗑️ Cleanup Tabelle Fiscali Obsolete

## 📅 Data: 25 Gennaio 2025

## 🎯 Obiettivo
Rimozione delle tabelle fiscali obsolete che non vengono utilizzate dal calcolatore dei contratti.

## ❌ Tabelle Rimosse

### 1. `tax_municipal_additional`
- **Motivo**: Obsoleta, sostituita da `tax_municipal_additional_rule` + `tax_municipal_additional_bracket`
- **Funzionalità**: Supportava solo addizionali comunali fisse
- **Sostituzione**: Usa `tax_municipal_additional_rule` con `flat_rate` per addizionali fisse

### 2. `tax_regional_additional`
- **Motivo**: Obsoleta, sostituita da `tax_regional_additional_scheme` + `tax_regional_additional_bracket`
- **Funzionalità**: Supportava solo addizionali regionali fisse
- **Sostituzione**: Usa `tax_regional_additional_scheme` con `flat_rate` per addizionali fisse

## ✅ Tabelle Mantenute (Utilizzate dal Calcolatore)

1. **`TaxRate`** - Aliquote contributive
2. **`tax_irpef_bracket`** - Scaglioni IRPEF
3. **`tax_config`** - Configurazione detrazioni
4. **`tax_extra_deduction_rule`** - Ulteriore detrazione
5. **`tax_bonus_l207_rule`** - Bonus L207
6. **`tax_regional_additional_scheme`** - Schema addizionale regionale
7. **`tax_regional_additional_bracket`** - Scaglioni addizionale regionale
8. **`tax_municipal_additional_rule`** - Regola addizionale comunale
9. **`tax_municipal_additional_bracket`** - Scaglioni addizionale comunale
10. **`BonusTaxRate`** - Aliquote bonus (solo gestione, non calcoli)

## 🔧 Modifiche Effettuate

### 1. Schema Prisma
- ✅ Rimosso `model tax_municipal_additional`
- ✅ Rimosso `model tax_regional_additional`

### 2. Migrazione Database
- ✅ Creata migrazione `20250125130000_remove_obsolete_tax_tables`
- ✅ SQL: `DROP TABLE` per entrambe le tabelle

### 3. Script Aggiornati
- ✅ `update_tax_rates_correct_2025.js` - Aggiornato per usare le nuove tabelle
- ✅ `server/src/routes/tax/taxratesUpload.js` - Aggiunti warning per sezioni obsolete

### 4. Client Prisma
- ✅ Rigenerato con `npx prisma generate`

## 🚨 Note Importanti

### Per Addizionali Fisse
**Prima (Obsoleto):**
```javascript
await prisma.tax_regional_additional.create({
  data: { year: 2025, region: 'DEFAULT', rate: 1.23 }
});
```

**Dopo (Corretto):**
```javascript
await prisma.tax_regional_additional_scheme.upsert({
  where: { year_region_is_default: { year: 2025, region: 'DEFAULT', is_default: true } },
  update: { is_progressive: false, flat_rate: 1.23 },
  create: { year: 2025, region: 'DEFAULT', is_progressive: false, flat_rate: 1.23, is_default: true }
});
```

### Per Addizionali Progressive
Le addizionali progressive continuano a funzionare come prima usando:
- `tax_regional_additional_scheme` + `tax_regional_additional_bracket`
- `tax_municipal_additional_rule` + `tax_municipal_additional_bracket`

## 🎯 Benefici

1. **Semplificazione**: Meno tabelle da gestire
2. **Coerenza**: Un solo sistema per addizionali (fisse e progressive)
3. **Manutenibilità**: Codice più pulito e meno duplicazioni
4. **Performance**: Meno tabelle = query più veloci

## ⚠️ Compatibilità

- ✅ **Calcolatore fiscale**: Funziona perfettamente (non usava le tabelle obsolete)
- ✅ **API esistenti**: Continuano a funzionare
- ⚠️ **Script legacy**: Alcuni potrebbero avere warning ma funzionano
- ✅ **Database**: Migrazione sicura con `DROP TABLE IF EXISTS`

## 🔍 Verifica

Per verificare che tutto funzioni:

1. **Test calcolatore**: Crea un contratto e verifica i calcoli fiscali
2. **Test API**: Chiama gli endpoint per addizionali
3. **Test database**: Verifica che le tabelle obsolete siano state rimosse

```sql
-- Verifica rimozione tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'soccerxpro' 
AND table_name IN ('tax_municipal_additional', 'tax_regional_additional');
-- Dovrebbe restituire 0 righe
```

## 📞 Supporto

Se riscontri problemi:
1. Controlla i log del server per errori
2. Verifica che la migrazione sia stata applicata
3. Rigenera il client Prisma se necessario: `npx prisma generate`




