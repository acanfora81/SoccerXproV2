# ISTRUZIONI USO SISTEMA CALCOLO FISCALE

## 🚀 **Come Testare il Sistema**

### **1. Avvia il Server**
```bash
cd server
npm start
```

### **2. Esegui i Test**
```bash
cd SISTEMA_CALCOLO_FISCALE
node test-calcoli.cjs
```

### **3. Verifica i Log del Server**
Controlla la console del server per vedere:
- Calcoli IRPEF e addizionali
- Accesso al database
- Fallback utilizzati
- Errori eventuali

## 🔍 **Debug dei Calcoli**

### **Problema: I conti non tornano**

1. **Verifica i dati nel database:**
   - Controlla `tax_irpef_bracket` per l'anno 2025
   - Controlla `tax_config` per le detrazioni
   - Controlla `tax_regional_additional` e `tax_municipal_additional`

2. **Verifica i log del server:**
   - Cerca "🔵 Calcolo IRPEF per year"
   - Cerca "🔵 Scaglioni trovati"
   - Cerca "🔵 Addizionali totali dal DB"

3. **Testa con parametri specifici:**
   ```javascript
   // Nel test-calcoli.cjs, modifica:
   netSalary: 33500,
   year: 2025,
   region: 'Marche',
   municipality: 'Pesaro'
   ```

### **Problema: Errore "year: undefined"**

Il sistema gestisce automaticamente questo caso:
- Usa `validYear = year || 2025`
- Fallback a valori hardcoded se necessario

### **Problema: Addizionali sbagliate**

Controlla se il database ha:
- Addizionali regionali per Marche
- Addizionali comunali per Pesaro
- Scaglioni addizionali se implementati

## 📊 **Verifica Manuale dei Calcoli**

### **Esempio: Netto €33,500**

1. **Contributi Lavoratore:**
   ```
   Lordo = €45,939
   INPS: €45,939 × 9.19% = €4,222
   FFC: €45,939 × 1.25% = €574
   Solidarietà: €45,939 × 0.50% = €230
   Totale: €5,026
   ```

2. **Imponibile Fiscale:**
   ```
   €45,939 - €5,026 = €40,913
   ```

3. **IRPEF:**
   ```
   Scaglione 1: €15,000 × 23% = €3,450
   Scaglione 2: €13,000 × 25% = €3,250
   Scaglione 3: €12,913 × 35% = €4,520
   Totale: €11,220
   Detrazioni: €1,880
   IRPEF Netta: €9,340
   ```

4. **Addizionali:**
   ```
   Regionale: €40,913 × 1.23% = €503
   Comunale: €40,913 × 0.50% = €205
   Totale: €708
   ```

5. **Netto Finale:**
   ```
   €45,939 - €5,026 - €9,340 - €708 = €30,865
   ```

**❌ Il netto non corrisponde!** C'è un errore nei calcoli.

## 🐛 **Possibili Bug**

### **1. Scaglioni IRPEF Sbagliati**
- Verifica che i bracket nel database siano corretti
- Controlla che `max` sia `null` per l'ultimo scaglione

### **2. Detrazioni Sbagliate**
- Verifica `tax_config.detrazionifixed`
- Controlla se ci sono detrazioni percentuali

### **3. Addizionali Sbagliate**
- Verifica le aliquote regionali e comunali
- Controlla se ci sono scaglioni addizionali

### **4. Formula Inversa Sbagliata**
- La formula `Lordo = (Netto + IRPEF + Addizionali) / 0.8906` potrebbe essere errata
- Verifica che i contributi lavoratore siano 10.94%

## 🔧 **Come Correggere**

1. **Modifica i dati nel database:**
   ```sql
   UPDATE tax_irpef_bracket SET rate = 23 WHERE year = 2025 AND min = 0;
   ```

2. **Modifica i fallback hardcoded:**
   - Apri `taxCalculator.js`
   - Cerca la sezione "FALLBACK"
   - Modifica i valori hardcoded

3. **Modifica la formula:**
   - Apri `taxCalculator.js`
   - Cerca `calcolaLordoDaNetto`
   - Modifica la formula matematica

## 📞 **Supporto**

Se i calcoli non tornano ancora:
1. Esegui `test-calcoli.cjs` e copia l'output
2. Verifica i dati nel database con le query in `DATI_DATABASE.md`
3. Confronta con le formule in `FORMULE_CALCOLO.md`
4. Controlla i log del server per errori