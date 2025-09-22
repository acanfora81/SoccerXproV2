# 📊 Gestione Scaglioni IRPEF

Questo documento spiega come gestire gli scaglioni IRPEF nel sistema SoccerXpro.

## 🎯 Panoramica

Gli scaglioni IRPEF sono utilizzati per calcolare l'imposta sul reddito delle persone fisiche in base al reddito imponibile. Il sistema supporta:

- **Visualizzazione** degli scaglioni esistenti
- **Inserimento manuale** di nuovi scaglioni
- **Caricamento da CSV** per importazioni massive
- **Gestione per anno** fiscale

## 📋 Formato Scaglioni IRPEF

Ogni scaglione IRPEF è definito da:

- **year**: Anno fiscale (es. 2025)
- **min**: Importo minimo dello scaglione (es. 0)
- **max**: Importo massimo dello scaglione (lasciare vuoto per ∞)
- **rate**: Aliquota IRPEF in percentuale (es. 23)

### Esempio Scaglioni 2025

```
Da €0 a €15.000 → 23%
Da €15.000 a €28.000 → 25%
Da €28.000 a €50.000 → 35%
Da €50.000 in su → 43%
```

## 🚀 API Endpoints

### 1. Visualizza Scaglioni
```
GET /api/taxrates/irpef-brackets?year=2025
```

**Risposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2025,
      "min": 0,
      "max": 15000,
      "rate": 23
    },
    {
      "id": 2,
      "year": 2025,
      "min": 15000,
      "max": 28000,
      "rate": 25
    }
  ]
}
```

### 2. Inserisci Scaglioni
```
POST /api/taxrates/irpef-brackets
```

**Body:**
```json
{
  "year": 2025,
  "brackets": [
    { "min": 0, "max": 15000, "rate": 23 },
    { "min": 15000, "max": 28000, "rate": 25 },
    { "min": 28000, "max": 50000, "rate": 35 },
    { "min": 50000, "max": null, "rate": 43 }
  ]
}
```

### 3. Elimina Scaglioni per Anno
```
DELETE /api/taxrates/irpef-brackets/2025
```

### 4. Carica da CSV
```
POST /api/taxrates/irpef-upload
```

**Form Data:**
- `file`: File CSV con formato specificato

## 📁 Formato CSV

Il file CSV deve contenere le seguenti colonne separate da `;`:

```csv
year;min;max;rate
2025;0;15000;23
2025;15000;28000;25
2025;28000;50000;35
2025;50000;;43
```

### Note sul Formato CSV:
- **Separatore**: Punto e virgola (`;`)
- **Headers**: Obbligatori nella prima riga
- **max vuoto**: Per l'ultimo scaglione (∞)
- **Encoding**: UTF-8

## 🖥️ Pagine Frontend

### 1. Gestione Scaglioni IRPEF
**Percorso:** `/tax/irpef-brackets`

**Funzionalità:**
- Visualizza scaglioni per anno
- Inserimento manuale di nuovi scaglioni
- Eliminazione scaglioni per anno
- Calcolo automatico delle imposte

### 2. Carica Scaglioni da CSV
**Percorso:** `/tax/irpef-upload`

**Funzionalità:**
- Upload file CSV
- Anteprima dati
- Download template
- Validazione formato

## 🔧 Integrazione con Calcoli Fiscali

Gli scaglioni IRPEF sono utilizzati automaticamente nei calcoli fiscali:

1. **taxCalculator.js**: Recupera scaglioni dal database
2. **excelCalculator.js**: Usa scaglioni per calcoli Excel-like
3. **salaryCalculator.js**: Wrapper per entrambi i calcolatori

### Esempio di Utilizzo

```javascript
// Nel calcolatore fiscale
const brackets = await prisma.tax_irpef_bracket.findMany({
  where: { year: 2025 },
  orderBy: { min: 'asc' }
});

// Calcolo IRPEF progressiva
let irpef = 0;
let remainingIncome = taxableIncome;

for (const bracket of brackets) {
  if (remainingIncome <= 0) break;
  
  const bracketMin = bracket.min;
  const bracketMax = bracket.max || Infinity;
  
  if (taxableIncome > bracketMin) {
    const incomeInBracket = Math.min(remainingIncome, bracketMax - bracketMin);
    irpef += incomeInBracket * (bracket.rate / 100);
    remainingIncome -= incomeInBracket;
  }
}
```

## 📊 Esempi di Calcolo

### Scenario: Reddito Imponibile €40.000

Con gli scaglioni 2025:
- **0-15.000**: €15.000 × 23% = €3.450
- **15.000-28.000**: €13.000 × 25% = €3.250
- **28.000-40.000**: €12.000 × 35% = €4.200
- **Totale IRPEF**: €10.900

### Scenario: Reddito Imponibile €60.000

Con gli scaglioni 2025:
- **0-15.000**: €15.000 × 23% = €3.450
- **15.000-28.000**: €13.000 × 25% = €3.250
- **28.000-50.000**: €22.000 × 35% = €7.700
- **50.000-60.000**: €10.000 × 43% = €4.300
- **Totale IRPEF**: €18.700

## 🚨 Note Importanti

1. **Unicità**: Non possono esistere scaglioni sovrapposti per lo stesso anno
2. **Ordine**: Gli scaglioni devono essere ordinati per importo minimo crescente
3. **Copertura**: Tutti i redditi devono essere coperti dagli scaglioni
4. **Aggiornamenti**: L'inserimento di nuovi scaglioni sostituisce quelli esistenti per l'anno

## 🔍 Troubleshooting

### Errore: "Headers mancanti"
- Verifica che il CSV contenga le colonne: `year`, `min`, `max`, `rate`
- Controlla che la prima riga contenga gli headers

### Errore: "Dati non numerici"
- Verifica che i valori numerici non contengano caratteri speciali
- Usa il punto (.) come separatore decimale

### Errore: "Scaglioni sovrapposti"
- Verifica che gli scaglioni non si sovrappongano
- Controlla che il `max` di uno scaglione sia uguale al `min` del successivo

## 📞 Supporto

Per problemi o domande:
1. Controlla i log del server per errori dettagliati
2. Verifica il formato del CSV con il template
3. Testa con dati di esempio prima di caricare dati reali


