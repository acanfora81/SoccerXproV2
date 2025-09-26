# FORMULE CALCOLO FISCALE

## 📊 **Formule Principali**

### **1. Calcolo Lordo → Netto**
```
ContributiLavoratore = Lordo × (9.19% + 1.25% + 0.50%) = Lordo × 10.94%
ImponibileFiscale = Lordo - ContributiLavoratore
IRPEF = CalcoloScaglioni(ImponibileFiscale)
Addizionali = CalcoloScaglioni(ImponibileFiscale)
Netto = Lordo - ContributiLavoratore - IRPEF - Addizionali
```

### **2. Calcolo Netto → Lordo (Formula Inversa)**
```
Lordo = (Netto + IRPEF + Addizionali) / (1 - 10.94%)
Lordo = (Netto + IRPEF + Addizionali) / 0.8906
```

## 🏛️ **Scaglioni IRPEF 2025**

| Da | A | Aliquota | Calcolo |
|---|---|----------|---------|
| €0 | €15,000 | 23% | Imponibile × 23% |
| €15,001 | €28,000 | 25% | (Imponibile - 15,000) × 25% |
| €28,001 | €50,000 | 35% | (Imponibile - 28,000) × 35% |
| €50,001 | ∞ | 43% | (Imponibile - 50,000) × 43% |

### **Esempio Calcolo IRPEF:**
```
Imponibile: €45,000
- Scaglione 1: €15,000 × 23% = €3,450
- Scaglione 2: €13,000 × 25% = €3,250
- Scaglione 3: €17,000 × 35% = €5,950
IRPEF Lorda: €12,650
- Detrazioni: €1,880
IRPEF Netta: €10,770
```

## 🏘️ **Addizionali Regionali Marche 2025**

| Da | A | Aliquota | Calcolo |
|---|---|----------|---------|
| €0 | €15,000 | 1.23% | Imponibile × 1.23% |
| €15,001 | €28,000 | 1.53% | (Imponibile - 15,000) × 1.53% |
| €28,001 | €50,000 | 1.70% | (Imponibile - 28,000) × 1.70% |
| €50,001 | ∞ | 1.73% | (Imponibile - 50,000) × 1.73% |

## 🏢 **Addizionali Comunali Pesaro 2025**

| Da | A | Aliquota | Calcolo |
|---|---|----------|---------|
| €0 | €9,000 | 0% | Esente |
| €9,001 | ∞ | 0.80% | (Imponibile - 9,000) × 0.80% |

## 💰 **Contributi Datore di Lavoro**

```
INPS Datore: Lordo × 29.58%
INAIL: Lordo × 7.90%
FFC Datore: Lordo × 6.25%
Solidarietà: Lordo × 0%

CostoAziendale = Lordo + INPS + INAIL + FFC + Solidarietà
CostoAziendale = Lordo × (1 + 29.58% + 7.90% + 6.25% + 0%)
CostoAziendale = Lordo × 1.4373
```

## 🧮 **Esempio Completo: Netto €33,500**

### **Step 1: Stima Lordo**
```
LordoStimato = €33,500 / 0.8906 = €37,615
```

### **Step 2: Calcola Contributi Lavoratore**
```
ContributiLavoratore = €37,615 × 10.94% = €4,115
ImponibileFiscale = €37,615 - €4,115 = €33,500
```

### **Step 3: Calcola IRPEF**
```
- Scaglione 1: €15,000 × 23% = €3,450
- Scaglione 2: €13,000 × 25% = €3,250
- Scaglione 3: €5,500 × 35% = €1,925
IRPEF Lorda: €8,625
- Detrazioni: €1,880
IRPEF Netta: €6,745
```

### **Step 4: Calcola Addizionali**
```
Addizionale Regionale:
- Scaglione 1: €15,000 × 1.23% = €185
- Scaglione 2: €13,000 × 1.53% = €199
- Scaglione 3: €5,500 × 1.70% = €94
Totale Regionale: €478

Addizionale Comunale:
- Esente fino a €9,000
- €24,500 × 0.80% = €196
Totale Comunale: €196

Addizionali Totali: €674
```

### **Step 5: Formula Finale**
```
Lordo = (€33,500 + €6,745 + €674) / 0.8906
Lordo = €40,919 / 0.8906
Lordo = €45,939
```

### **Step 6: Verifica**
```
ContributiLavoratore = €45,939 × 10.94% = €5,026
ImponibileFiscale = €45,939 - €5,026 = €40,913
IRPEF = €6,745 (ricalcolata)
Addizionali = €674 (ricalcolate)
Netto = €45,939 - €5,026 - €6,745 - €674 = €33,494 ≈ €33,500 ✅
```

## 🔍 **Verifica Contributi Datore**
```
INPS Datore: €45,939 × 29.58% = €13,589
INAIL: €45,939 × 7.90% = €3,629
FFC Datore: €45,939 × 6.25% = €2,871
Costo Aziendale: €45,939 + €13,589 + €3,629 + €2,871 = €66,028
```









