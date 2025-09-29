# 📈 Campo Slope per Variazioni Lineari

## 📅 Data: 25 Gennaio 2025

## 🎯 Obiettivo
Aggiunta del campo `slope` ai modelli `tax_extra_deduction_rule` e `tax_bonus_l207_rule` per supportare variazioni lineari progressive.

## 🔧 Modifiche Schema

### 1. `tax_extra_deduction_rule`
```prisma
model tax_extra_deduction_rule {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  year      Int
  min       Float
  max       Float?
  amount    Float    // importo fisso (valore alla soglia "min")
  slope     Float?   @default(0)  // variazione lineare €/€ sopra min
  createdat DateTime @default(now()) @db.Timestamptz(6)

  @@index([year, min], map: "idx_extra_deduction_year_min")
  @@schema("soccerxpro")
}
```

### 2. `tax_bonus_l207_rule`
```prisma
model tax_bonus_l207_rule {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  year      Int
  min       Float
  max       Float?
  amount    Float    // importo iniziale alla soglia "min"
  slope     Float?   @default(0)  // €/€ di variazione lineare
  createdat DateTime @default(now()) @db.Timestamptz(6)

  @@unique([year, min], map: "uq_bonus_l207_year_min")
  @@index([year, min], map: "idx_bonus_l207_year_min")
  @@schema("soccerxpro")
}
```

## 📊 Funzionamento del Campo Slope

### **Formula di Calcolo:**
```
importo_finale = amount + (slope × (reddito_imponibile - min))
```

### **Esempi Pratici:**

#### **Esempio 1: Ulteriore Detrazione Lineare**
```sql
-- Scaglione: 15.000€ - 50.000€
-- amount: 1.000€ (detrazione base a 15.000€)
-- slope: 0.05 (5 centesimi per ogni euro sopra 15.000€)

-- Calcolo per reddito 30.000€:
-- importo = 1.000 + (0.05 × (30.000 - 15.000))
-- importo = 1.000 + (0.05 × 15.000)
-- importo = 1.000 + 750 = 1.750€
```

#### **Esempio 2: Bonus L207 Progressivo**
```sql
-- Scaglione: 0€ - 28.000€
-- amount: 500€ (bonus base a 0€)
-- slope: 0.02 (2 centesimi per ogni euro)

-- Calcolo per reddito 20.000€:
-- importo = 500 + (0.02 × (20.000 - 0))
-- importo = 500 + (0.02 × 20.000)
-- importo = 500 + 400 = 900€
```

## 🔄 Migrazione Database

### **SQL di Migrazione:**
```sql
-- AddColumn
ALTER TABLE "soccerxpro"."tax_extra_deduction_rule" ADD COLUMN "slope" DOUBLE PRECISION DEFAULT 0;

-- AddColumn
ALTER TABLE "soccerxpro"."tax_bonus_l207_rule" ADD COLUMN "slope" DOUBLE PRECISION DEFAULT 0;
```

### **Compatibilità:**
- ✅ **Retrocompatibile**: Campo opzionale con default 0
- ✅ **Esistenti**: Record esistenti mantengono comportamento precedente
- ✅ **Nuovi**: Possibilità di usare variazioni lineari

## 🎯 Casi d'Uso

### **1. Detrazioni Progressive**
- **Prima**: Solo importi fissi per scaglione
- **Dopo**: Importo base + variazione lineare

### **2. Bonus Graduali**
- **Prima**: Bonus fisso per scaglione
- **Dopo**: Bonus base + incremento progressivo

### **3. Soglie di Esonero**
- **Prima**: Esonero totale o parziale
- **Dopo**: Esonero graduale con slope negativo

## 🔧 Implementazione nel Calcolatore

### **Aggiornamento taxCalculator.js:**
```javascript
// Per ulteriore detrazione
const extraRules = await prisma.tax_extra_deduction_rule.findMany({
  where: { year: validYear },
  orderBy: { min: 'asc' }
});

for (const rule of extraRules) {
  const ruleMax = rule.max ?? Infinity;
  if (taxableIncome >= rule.min && taxableIncome < ruleMax) {
    // Calcolo con slope
    const baseAmount = rule.amount;
    const slopeAmount = rule.slope * (taxableIncome - rule.min);
    ulterioreDetrazione = baseAmount + slopeAmount;
    break;
  }
}
```

## 📋 Esempi di Configurazione

### **Scenario 1: Detrazione Lineare Crescente**
```json
{
  "year": 2025,
  "min": 15000,
  "max": 50000,
  "amount": 1000,
  "slope": 0.05
}
```
**Risultato**: 1.000€ + 5 centesimi per ogni euro sopra 15.000€

### **Scenario 2: Bonus Decrescente**
```json
{
  "year": 2025,
  "min": 0,
  "max": 28000,
  "amount": 2000,
  "slope": -0.03
}
```
**Risultato**: 2.000€ - 3 centesimi per ogni euro (bonus decrescente)

### **Scenario 3: Importo Fisso (Comportamento Precedente)**
```json
{
  "year": 2025,
  "min": 0,
  "max": 15000,
  "amount": 500,
  "slope": 0
}
```
**Risultato**: 500€ fisso (slope = 0)

## 🚀 Benefici

1. **Flessibilità**: Supporta qualsiasi tipo di variazione lineare
2. **Precisione**: Calcoli più accurati per regole fiscali complesse
3. **Retrocompatibilità**: Mantiene funzionamento esistente
4. **Estensibilità**: Facile aggiungere nuove regole progressive

## ⚠️ Note Importanti

1. **Slope Positivo**: Aumenta l'importo con il reddito
2. **Slope Negativo**: Diminuisce l'importo con il reddito
3. **Slope Zero**: Comportamento fisso (come prima)
4. **Validazione**: Slope può essere qualsiasi valore (positivo, negativo, zero)

## 🔍 Test

Per testare il nuovo campo:

1. **Inserisci regola con slope**:
```sql
INSERT INTO tax_extra_deduction_rule (year, min, max, amount, slope) 
VALUES (2025, 15000, 50000, 1000, 0.05);
```

2. **Verifica calcolo**:
```javascript
// Reddito 30.000€ dovrebbe dare: 1.000 + (0.05 × 15.000) = 1.750€
```

3. **Testa retrocompatibilità**:
```sql
INSERT INTO tax_extra_deduction_rule (year, min, max, amount, slope) 
VALUES (2025, 0, 15000, 500, 0);
-- Dovrebbe comportarsi come prima
```





