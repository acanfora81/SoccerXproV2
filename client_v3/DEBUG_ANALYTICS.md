# 🔬 Debug Chirurgico - Analytics Avanzate

## Istruzioni per il Debug

### 1. Apri la Console del Browser
- Chrome/Edge: `F12` → Tab "Console"
- Firefox: `F12` → Tab "Console"

### 2. Vai alla pagina Analytics Avanzate
- URL: `http://localhost:5173/app/dashboard/performance/analytics?period=custom&startDate=2025-07-01&endDate=2025-09-30`

### 3. Cerca questi log nella console:

#### ✅ Dati ricevuti dal backend:
```
🟢 Performance data aggregati caricati: X date uniche
🔍 Primo record aggregato: { ... }
🔍 [ENERGETICO] Verifica campi primo record: { ... }
🔍 [ACCELERAZIONI] Verifica campi primo record: { ... }
🔍 [RISCHIO] Verifica campi primo record: { ... }
```

#### ✅ Dati processati:
```
🔍 [DEBUG CHIRURGICO] performanceData RAW: { ... }
🔍 [DEBUG CHIRURGICO] filteredData PROCESSED: { ... }
```

#### ✅ Dati nei componenti:
```
🟢 Energetico component - dati ricevuti: X records
🔍 Primo record: { ... }
🟡 Processing energetic data - totale record: X
✅ Energetic data processed: X data points
```

### 4. Copia e incolla nella console per analisi manuale:

```javascript
// Test 1: Verifica fetch API diretta
fetch('http://localhost:3001/api/performance?period=custom&startDate=2025-07-01&endDate=2025-09-30&aggregate=true', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('📊 DATI RAW DAL BACKEND:', data);
  console.log('📊 Numero record:', data.data?.length || 0);
  console.log('📊 Primo record:', data.data?.[0]);
  console.log('📊 Campi disponibili:', data.data?.[0] ? Object.keys(data.data[0]) : 'NESSUN DATO');
  
  // Verifica campi critici
  const first = data.data?.[0];
  if (first) {
    console.log('📊 [ENERGETICO] avg_metabolic_power_wkg:', first.avg_metabolic_power_wkg);
    console.log('📊 [ENERGETICO] distance_over_20wkg_m:', first.distance_over_20wkg_m);
    console.log('📊 [ACCELERAZIONI] num_acc_over_3_ms2:', first.num_acc_over_3_ms2);
    console.log('📊 [RISCHIO] player_load:', first.player_load);
  }
});

// Test 2: Verifica se i dati sono nel database
fetch('http://localhost:3001/api/performance?period=all&limit=1', {
  credentials: 'include'
})
.then(r => r.json())
.then(data => {
  console.log('📊 TEST: C\'è almeno 1 record nel DB?', data.data?.length > 0 ? 'SÌ ✅' : 'NO ❌');
  if (data.data?.length > 0) {
    console.log('📊 Record esempio:', data.data[0]);
  }
});
```

### 5. Verifica query SQL diretta (da eseguire nel database):

```sql
-- Conta quanti record ci sono
SELECT COUNT(*) FROM "soccerxpro"."PerformanceData";

-- Verifica i campi critici NON NULL
SELECT 
  COUNT(*) as total_records,
  COUNT(avg_metabolic_power_wkg) as has_met_power,
  COUNT(distance_over_20wkg_m) as has_dist_20wkg,
  COUNT(num_acc_over_3_ms2) as has_acc,
  COUNT(player_load) as has_player_load
FROM "soccerxpro"."PerformanceData"
WHERE session_date >= '2025-07-01' AND session_date <= '2025-09-30';

-- Mostra un esempio di record completo
SELECT * FROM "soccerxpro"."PerformanceData" 
WHERE session_date >= '2025-07-01' 
LIMIT 1;
```

### 6. Problemi comuni e soluzioni:

#### Problema: "Nessun dato disponibile" nei grafici
**Possibili cause:**
1. ❌ I dati non arrivano dall'API → Controlla log `🟢 Performance data aggregati caricati`
2. ❌ I campi sono `null` o `undefined` → Controlla log `🔍 [ENERGETICO] Verifica campi`
3. ❌ Il filtro `period` non include le date → Verifica URL `startDate` e `endDate`
4. ❌ `filteredData` è vuoto → Controlla log `🔍 [DEBUG CHIRURGICO] filteredData PROCESSED`
5. ❌ I componenti non ricevono i dati → Controlla log `🟢 Energetico component - dati ricevuti`

#### Problema: I grafici sono vuoti ma "energeticData.length > 0"
**Possibili cause:**
1. ❌ I valori sono tutti `0` → Verifica nel database se i campi hanno valori reali
2. ❌ Il mapping dei campi è sbagliato → Verifica i nomi esatti dei campi
3. ❌ Recharts non renderizza → Controlla errori nella console

### 7. Checklist debug:

- [ ] Aperta la console del browser
- [ ] Navigato su Analytics Avanzate con filtri corretti
- [ ] Verificato log `🟢 Performance data aggregati caricati: X`
- [ ] Verificato che X > 0
- [ ] Verificato log `🔍 [ENERGETICO] Verifica campi primo record`
- [ ] Verificato che i campi NON sono `undefined` o `null`
- [ ] Verificato log `✅ Energetic data processed: X data points`
- [ ] Verificato che X > 0
- [ ] Eseguito test fetch manuale dalla console
- [ ] Verificato che la risposta contiene dati

### 8. Output atteso nella console (esempio):

```
🔄 fetchData - Caricamento dati Analytics Avanzate...
🔍 Query API performance: period=custom&startDate=2025-07-01&endDate=2025-09-30&aggregate=true&...
🟢 Performance data aggregati caricati: 45 date uniche
✅ Dati già aggregati dal backend: 45 giorni unici
🔍 Primo record aggregato: {
  session_date: "2025-07-15T10:00:00.000Z",
  avg_metabolic_power_wkg: 12.5,
  distance_over_20wkg_m: 450,
  distance_over_35wkg_m: 120,
  max_power_5s_wkg: 45.2,
  num_acc_over_3_ms2: 25,
  num_dec_over_minus3_ms2: 22,
  player_load: 320,
  playerId: 3
}
🔍 [ENERGETICO] Verifica campi primo record: {
  avg_metabolic_power_wkg: 12.5,    ← DEVE ESSERE > 0
  distance_over_20wkg_m: 450,        ← DEVE ESSERE > 0
  distance_over_35wkg_m: 120,        ← DEVE ESSERE > 0
  max_power_5s_wkg: 45.2,            ← DEVE ESSERE > 0
  session_date: "2025-07-15T10:00:00.000Z",
  duration_minutes: 90
}
🟢 Energetico component - dati ricevuti: 45 records
🟡 Processing energetic data - totale record: 45
✅ Energetic data processed: 45 data points
🔍 Range valori avgMetPower: 8.5 - 15.2    ← DEVE ESSERE > 0
🔍 Range valori distance20wkg: 200 - 600   ← DEVE ESSERE > 0
```

Se NON vedi questi valori > 0, allora il problema è nel database o nell'API.





