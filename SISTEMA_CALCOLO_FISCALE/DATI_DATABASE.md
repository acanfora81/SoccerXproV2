# DATI DATABASE PER CALCOLI FISCALI

## 🗄️ **Tabelle Database**

### **1. tax_irpef_bracket (Scaglioni IRPEF 2025)**
```sql
year | min  | max   | rate
-----|------|-------|-----
2025 | 0    | 15000 | 23
2025 | 15000| 28000 | 25
2025 | 28000| 50000 | 35
2025 | 50000| null  | 43
```

### **2. tax_config (Configurazioni 2025)**
```sql
year | detrazionifixed | detrazionipercentonirpef
-----|----------------|------------------------
2025 | 1880           | 0
```

### **3. tax_regional_additional (Addizionali Regionali Marche 2025)**
```sql
year | region | rate
-----|--------|-----
2025 | Marche | 1.23
```

### **4. tax_municipal_additional (Addizionali Comunali Pesaro 2025)**
```sql
year | region | municipality | rate
-----|--------|--------------|-----
2025 | Marche | Pesaro       | 0.50
```

## 🏛️ **Scaglioni Addizionali (Se Implementati)**

### **tax_regional_additional_scheme (Marche 2025)**
```sql
id | year | region | base                | is_progressive | is_default
---|------|--------|---------------------|----------------|-----------
1  | 2025 | Marche | IMPONIBILE_FISCALE  | true           | true
```

### **tax_regional_additional_bracket (Scaglioni Marche)**
```sql
id | scheme_id | min  | max   | rate
---|-----------|------|-------|-----
1  | 1         | 0    | 15000 | 1.23
2  | 1         | 15001| 28000 | 1.53
3  | 1         | 28001| 50000 | 1.70
4  | 1         | 50001| null  | 1.73
```

### **tax_municipal_additional_rule (Pesaro 2025)**
```sql
id | year | region | municipality | base                | exemption_threshold | is_progressive | flat_rate | is_default
---|------|--------|--------------|---------------------|-------------------|----------------|-----------|-----------
1  | 2025 | Marche | Pesaro       | IMPONIBILE_FISCALE  | 9000              | false          | 0.80      | true
```

### **tax_municipal_additional_bracket (Scaglioni Pesaro)**
```sql
id | rule_id | min | max   | rate
---|---------|-----|-------|-----
1  | 1       | 0   | 9000  | 0
2  | 1       | 9001| null  | 0.80
```

## 🔍 **Verifica Dati**

### **Query per Verificare IRPEF Brackets:**
```sql
SELECT * FROM tax_irpef_bracket WHERE year = 2025 ORDER BY min;
```

### **Query per Verificare Config:**
```sql
SELECT * FROM tax_config WHERE year = 2025;
```

### **Query per Verificare Addizionali Regionali:**
```sql
SELECT * FROM tax_regional_additional WHERE year = 2025 AND region = 'Marche';
```

### **Query per Verificare Addizionali Comunali:**
```sql
SELECT * FROM tax_municipal_additional WHERE year = 2025 AND region = 'Marche' AND municipality = 'Pesaro';
```

### **Query per Verificare Scaglioni Addizionali:**
```sql
-- Regionali
SELECT s.*, b.* 
FROM tax_regional_additional_scheme s
JOIN tax_regional_additional_bracket b ON s.id = b.scheme_id
WHERE s.year = 2025 AND s.region = 'Marche'
ORDER BY b.min;

-- Comunali
SELECT r.*, b.* 
FROM tax_municipal_additional_rule r
JOIN tax_municipal_additional_bracket b ON r.id = b.rule_id
WHERE r.year = 2025 AND r.region = 'Marche' AND r.municipality = 'Pesaro'
ORDER BY b.min;
```

## 📊 **Dati di Test**

### **Caso 1: Netto €33,500**
- **Lordo Atteso:** ~€45,939
- **IRPEF Attesa:** ~€6,745
- **Addizionali Attese:** ~€674
- **FFC Employer Atteso:** ~€2,871

### **Caso 2: Lordo €56,565**
- **Netto Atteso:** ~€36,823
- **IRPEF Attesa:** ~€12,682
- **Addizionali Attese:** ~€872
- **FFC Employer Atteso:** ~€3,535

## 🚨 **Note Importanti**

1. **Fallback:** Se i dati non sono nel database, il sistema usa valori hardcoded
2. **Year Default:** Se year è undefined, usa 2025
3. **Region/Municipality Default:** Se mancanti, usa 'DEFAULT'
4. **Precisione:** Tutti i calcoli usano `round2()` per arrotondamento a 2 decimali

