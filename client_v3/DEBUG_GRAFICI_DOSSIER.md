# Debug Grafici Dossier - Analisi e Correzioni

## Problema Identificato

I grafici nella pagina `DossierPage` non funzionavano perché il backend non restituiva i campi necessari per popolare i grafici.

## Analisi Backend

### Endpoint: `GET /api/performance/player/:playerId/dossier`

**File**: `server/src/routes/performance/performance.js`

#### Dati Richiesti dal Frontend
Il componente `ChartsSection` cercava questi campi:
- `total_distance_m`
- `sprint_distance_m`
- `top_speed_kmh`

#### Dati Restituiti (PRIMA della correzione)
Il backend restituiva solo:
```javascript
{
  id, date, type, minutes, PL, notes,
  topSpeed,  // ❌ nome diverso
  hsr, zone15_20, zone20_25, zone25plus,
  acc, dec, avgHR, maxHR, rpe, sRPE
}
```

**Problema**: Mancavano `total_distance_m` e `sprint_distance_m`, e `topSpeed` era in formato camelCase invece di snake_case.

## Correzioni Applicate

### 1. Backend - Aggiunta Campi Mancanti

**File modificato**: `server/src/routes/performance/performance.js` (linee ~2768-2798)

**Modifica**:
```javascript
breakdown: {
  bySession: sessions.map(s => {
    // ...
    return {
      id: s.id,
      date: safeDate(s.session_date).toLocaleDateString('it-IT'),
      type: s.session_name || 'Allenamento',
      minutes: safeNum(s.duration_minutes),
      PL: safeNum(s.player_load),
      notes: s.notes || null,
      // ✅ AGGIUNTI campi per grafici
      total_distance_m: safeNum(s.total_distance_m || 0),
      sprint_distance_m: safeNum(s.sprint_distance_m || 0),
      top_speed_kmh: safeNum(s.top_speed_kmh),
      // ✅ Alias per compatibilità con altri componenti
      topSpeed: safeNum(s.top_speed_kmh),
      hsr: safeNum(s.high_intensity_runs),
      // ... altri campi
    };
  })
}
```

### 2. Frontend - Miglioramento Grafici

**File modificato**: `client_v3/src/features/performance/pages/DossierPage.jsx`

#### Modifiche al componente `ChartsSection`:

1. **Separazione grafici**: Invece di avere un grafico misto Area+Line (non supportato correttamente), ora ci sono 3 grafici separati:
   - Distanza totale per sessione (LineChart)
   - Sprint distance per sessione (AreaChart)
   - Velocità massima per sessione (LineChart)

2. **Styling migliorato**:
   - Griglia con trasparenza
   - Tooltip con sfondo scuro e bordi arrotondati
   - Assi con colori leggibili
   - Dot più visibili sui LineChart
   - Area chart con riempimento trasparente

3. **Debug logging**:
   - Aggiunti log console per verificare dati ricevuti e mappati
   - Messaggio più chiaro quando non ci sono dati

## Verifica Funzionamento

### Passi per verificare:

1. **Avvia il server backend**:
   ```bash
   cd server
   npm run dev
   ```

2. **Avvia il frontend**:
   ```bash
   cd client_v3
   npm run dev
   ```

3. **Testa il flusso**:
   - Vai su `http://localhost:5173/app/dashboard/performance`
   - Clicca su un giocatore → Apri Dossier
   - Nel drawer, clicca "Apri in pagina"
   - Nella pagina completa, cambia il toggle da "Vista Card" a "Vista Grafici"
   - Verifica che i 3 grafici vengano visualizzati correttamente

### Log Console Attesi

```javascript
🔍 [ChartsSection] Dati sessioni ricevuti: [
  { id: 1, date: '06/10/2025', total_distance_m: 5420, sprint_distance_m: 245, top_speed_kmh: 28.5, ... },
  // ...
]
🔍 [ChartsSection] Dati mappati per grafici: [
  { date: '06/10/2025', total_distance_m: 5420, sprint_distance_m: 245, top_speed_kmh: 28.5, duration_minutes: 90 },
  // ...
]
```

## Possibili Problemi Residui

### 1. Dati Mancanti nel Database
Se i campi `total_distance_m` o `sprint_distance_m` sono NULL nel database, i grafici mostreranno valori a 0.

**Soluzione**: Verificare i dati importati con:
```sql
SELECT id, session_date, total_distance_m, sprint_distance_m, top_speed_kmh 
FROM PerformanceData 
WHERE playerId = [ID_GIOCATORE]
ORDER BY session_date DESC
LIMIT 10;
```

### 2. Filtri Troppo Restrittivi
Se i filtri (periodo, tipo sessione, ecc.) escludono tutte le sessioni, vedrai il messaggio "Nessun dato disponibile".

**Soluzione**: Prova a cambiare i filtri o selezionare "Tutto" per periodo e tipo sessione.

### 3. Grafici Non Renderizzano
Se Recharts non carica correttamente, verifica che sia installato:
```bash
npm list recharts
```

Se mancante:
```bash
npm install recharts
```

## Problema: Dati a Zero

### Sintomo
I log console mostrano che i dati vengono ricevuti ma tutti i valori sono 0:
```javascript
{date: '31/08/2025', total_distance_m: 0, sprint_distance_m: 0, top_speed_kmh: 0}
```

### Causa Probabile
I campi `total_distance_m`, `sprint_distance_m`, e `top_speed_kmh` nel database sono **NULL** o **0**.

### Verifica Database
Esegui lo script di verifica:
```bash
cd server
node scripts/check-performance-data.js
```

Questo script ti dirà:
- Quanti record hanno questi campi NULL/0
- Esempi di record esistenti
- Se ci sono record con dati validi

### Soluzioni Possibili

#### Soluzione 1: I dati non sono stati importati correttamente
Se i file CSV hanno colonne con nomi diversi (es. `Distanza`, `Total Distance`, ecc.), il sistema di import potrebbe non averle mappate correttamente.

**Azione**: Reimporta i dati usando l'interfaccia di Import con il sistema di suggerimenti.

#### Soluzione 2: I dati sono in campi diversi
Alcuni dispositivi GPS usano nomi di campi diversi. Controlla se i dati sono in:
- `distance_per_min` (calcolabile moltiplicando per `duration_minutes`)
- `equivalent_distance_m`
- Altri campi custom in `extras` (JSON)

**Azione**: Modifica il backend per calcolare i campi mancanti dai dati disponibili.

#### Soluzione 3: Dati di esempio mancanti
Se stai usando dati di test, potrebbero mancare completamente questi campi.

**Azione**: Importa file CSV reali con tutti i campi necessari (vedi `/public/examples/`).

## Aggiornamenti Frontend

### Grafici Dinamici per Tab
Ora i grafici cambiano in base alla tab attiva:

- **Panoramica**: Distanza totale + Player Load
- **Intensità**: Zone di velocità (stacked) + HSR
- **Cardio**: HR Media/Max + RPE/sRPE
- **Acc/Dec**: Accelerazioni + Decelerazioni
- **Sessioni**: Distanza + Minuti + Velocità max

### Dati Mappati
Il componente ora mappa correttamente TUTTI i campi dal backend:
```javascript
{
  date, total_distance_m, PL, minutes,
  zone15_20, zone20_25, zone25plus, hsr,
  avgHR, maxHR, rpe, sRPE,
  acc, dec, sprint_distance_m, top_speed_kmh
}
```

## Checklist Finale

- [x] Backend restituisce tutti i campi necessari in `breakdown.bySession`
- [x] Frontend mappa correttamente TUTTI i dati ricevuti
- [x] Grafici dinamici implementati per ogni tab
- [x] Grafici specifici per ogni tipo di metrica (stacked area, line, dual line)
- [x] Styling coerente con il tema light/dark
- [x] Log di debug per troubleshooting
- [x] Messaggio "Nessun dato" chiaro quando non ci sono sessioni
- [x] Script di verifica database creato
- [ ] **DA FARE**: Verificare e correggere i dati nel database
- [ ] **DA TESTARE**: Verificare grafici con dati reali

## Note Finali

- I grafici rispettano i filtri attivi (periodo, tipo sessione, ecc.)
- I dati vengono aggiornati automaticamente quando cambiano i filtri
- Il toggle "Vista Card" / "Vista Grafici" funziona senza perdere i dati

