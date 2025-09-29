# 📊 File di Esempio per Aliquote Fiscali

## 🎯 **File Disponibili:**

### 1. **Aliquote Stipendio (Tax Rates)**
- `taxrates-semplice-2025.csv` - **INIZIA CON QUESTO** (formato base)
- `taxrates-example-2025-complete.csv` - Formato completo con tutte le colonne

### 2. **Aliquote Bonus**
- `bonus-taxrates-example-italian.csv` - Aliquote per bonus e indennità

## 📋 **Come Usare:**

### **Step 1: Carica Aliquote Stipendio**
1. Vai su **Dashboard → Contratti → Carica Aliquote**
2. Scarica il file `taxrates-semplice-2025.csv`
3. Carica il file nel sistema

### **Step 2: Carica Aliquote Bonus (Opzionale)**
1. Vai su **Dashboard → Contratti → Carica Aliquote Bonus**
2. Scarica il file `bonus-taxrates-example-italian.csv`
3. Carica il file nel sistema

## 📝 **Formato File Aliquote Stipendio:**

```csv
year;type;inps;inail;ffc
2025;PROFESSIONAL;9,19;0,00;1,25
2025;APPRENTICESHIP;5,84;0,00;1,25
2025;AMATEUR;2,00;0,00;0,50
2025;YOUTH;1,50;0,00;0,30
```

### **Colonne:**
- `year`: Anno fiscale (es. 2025)
- `type`: Tipo contratto (PROFESSIONAL, APPRENTICESHIP, AMATEUR, YOUTH, etc.)
- `inps`: Aliquota INPS lavoratore (%)
- `inail`: Aliquota INAIL lavoratore (%)
- `ffc`: Aliquota FFC lavoratore (%)

### **Tipi Contratto Validi:**
- `PROFESSIONAL` - Professionista
- `APPRENTICESHIP` - Apprendistato
- `AMATEUR` - Dilettante
- `YOUTH` - Giovanile
- `TRAINING_AGREEMENT` - Accordo formativo
- `LOAN` - Prestito
- `PERMANENT` - Permanente
- `TRIAL` - Prova

## 📝 **Formato File Aliquote Bonus:**

```csv
year;type;taxRate
2025;IMAGE_RIGHTS;20,00
2025;LOYALTY_BONUS;15,00
2025;SIGNING_BONUS;25,00
2025;ACCOMMODATION_BONUS;10,00
2025;CAR_ALLOWANCE;10,00
2025;TRANSFER_ALLOWANCE;5,00
```

### **Tipi Bonus Validi:**
- `IMAGE_RIGHTS` - Diritti Immagine
- `LOYALTY_BONUS` - Bonus Fedeltà
- `SIGNING_BONUS` - Bonus Firma
- `ACCOMMODATION_BONUS` - Bonus Alloggio
- `CAR_ALLOWANCE` - Indennità Auto
- `TRANSFER_ALLOWANCE` - Indennità di Trasferta

## ⚠️ **Note Importanti:**

1. **Separatore**: Usa `;` (punto e virgola) come separatore
2. **Decimali**: Usa `,` (virgola) per i decimali (formato italiano)
3. **Encoding**: Salva il file in UTF-8
4. **Header**: La prima riga deve contenere i nomi delle colonne

## 🚀 **Dopo il Caricamento:**

Una volta caricate le aliquote, i calcoli fiscali automatici funzioneranno nel modale di creazione/modifica contratti!

## 📞 **Supporto:**

Se hai problemi con il caricamento, controlla:
1. Il formato del file (CSV con separatore `;`)
2. I nomi delle colonne (esatti come negli esempi)
3. I tipi di contratto (deve essere uno dei valori validi)
4. I valori numerici (usare virgola per i decimali)












