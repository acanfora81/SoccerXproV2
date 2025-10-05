# 📊 ANALISI MIGRAZIONE SEZIONE PERFORMANCE

## 🎯 Obiettivo
Migrare la sezione Performance da `client` a `client_v3` mantenendo tutte le logiche e API esistenti, applicando solo il rebranding grafico con il design system `client_v3`.

---

## 📁 STRUTTURA FILE ESISTENTI

### **Pagine (`client/src/pages/performance/`)**
1. **PlayersList.jsx** (18 righe)
   - Wrapper per `PerformancePlayersList`
   - Lista giocatori con performance

2. **ComparePage.jsx** (537 righe) ⚠️ COMPLESSO
   - Confronto multi-giocatore
   - 7 tab (Panoramica, Carico, Intensità, Cardio, Accelerazioni, Velocità, Rischio)
   - Grafici con `recharts`
   - Tabelle comparative
   - Modalità espansa/compressa
   - API: `/api/performance/compare`

3. **DossierPage.jsx** (434+ righe) ⚠️ COMPLESSO
   - Dossier dettagliato singolo giocatore
   - Tab multiple con metriche
   - Filtri avanzati
   - API: `/api/performance/player/:id/dossier`

4. **PlayersDossier.jsx**
   - Versione alternativa del dossier

5. **PerformanceExample.jsx**
   - Pagina di esempio (probabilmente da ignorare)

### **Componenti (`client/src/components/analytics/`)**
1. **PerformancePlayersList.jsx** ⭐ PRINCIPALE
   - Lista principale giocatori
   - Gestione selezione per confronto
   - Filtri e ordinamento

2. **CompareDrawer.jsx** ⭐⭐ DRAWER CONFRONTO (365+ righe)
   - Drawer laterale per confronto giocatori
   - Utilizza tutte le 8 sezioni analytics (CaricoVolumi, Intensita, etc.)
   - Tab navigation per sezioni
   - Filtri integrati con FiltersBar
   - Loading e error states
   - API: `/api/performance/compare?players=1,2,3`
   - **IMPORTANTE**: Componente riutilizzabile per confronto rapido

3. **CompareOverlay.jsx** ⭐ OVERLAY CONFRONTO
   - Overlay fullscreen per confronto
   - Simile a CompareDrawer ma con layout diverso
   - Può essere alternativa o complementare

4. **DossierDrawer.jsx** ⭐⭐ DRAWER DOSSIER (454+ righe)
   - Drawer laterale per dossier singolo giocatore
   - Tab navigation (panoramica, dettagli, etc.)
   - Filtri integrati con FiltersBar
   - Loading skeleton ottimizzato
   - Error handling per dati mancanti (NO_DATA)
   - API: `/api/performance/player/:id/dossier`
   - **IMPORTANTE**: Componente riutilizzabile per vista rapida giocatore

5. **PlayerDossier.jsx**
   - Componente dossier riutilizzabile

6. **TeamDashboard.jsx** ⭐ DASHBOARD
   - Dashboard squadra
   - KPI e statistiche team
   - API: `/api/performance/dashboard`

7. **Analytics.jsx** ⭐ ANALYTICS
   - Analytics base

8. **AnalyticsAdvanced.jsx** ⭐ ANALYTICS AVANZATE
   - Analytics avanzate
   - Grafici complessi

9. **Reports.jsx**
   - Gestione report

10. **ReportPreview.jsx**
    - Anteprima report

11. **CompareBar.jsx**
    - Barra per confronto

12. **ComparePanel.jsx**
    - Pannello confronto

13. **PlayerList.jsx**
    - Lista giocatori base

### **Sezioni Analytics (`client/src/components/analytics/sections/`)**
1. **CaricoVolumi.jsx** - Sezione carico e volumi
2. **Intensita.jsx** - Sezione intensità
3. **AltaVelocita.jsx** - Sezione alta velocità
4. **Accelerazioni.jsx** - Sezione accelerazioni
5. **Energetico.jsx** - Sezione energetico/metabolico
6. **RischioRecupero.jsx** - Sezione rischio e recupero
7. **Comparazioni.jsx** - Sezione comparazioni
8. **ReportCoach.jsx** - Report per coach

### **Componenti Performance (`client/src/components/performance/`)**
1. **PerformanceImport.jsx** ⭐ IMPORT
   - Componente principale import
2. **ImportWizard.jsx**
   - Wizard step-by-step per import
3. **ColumnMappingStep.jsx**
   - Step mapping colonne CSV
4. **DataPreviewStep.jsx**
   - Step preview dati

### **CSS Files**
1. **performance-players-list.css** - Stili lista giocatori
2. **performance-analytics.css** - Stili analytics
3. **performance-pages.css** - Stili pagine
4. **compare-drawer.css** ⭐ - Stili drawer confronto e dossier

---

## 🗺️ STRUTTURA MENU SIDEBAR

```
Performance
├── Dashboard Squadra (/dashboard/performance/team)
├── Vista Giocatori (/dashboard/performance/players)
├── Analytics Avanzate (/dashboard/performance/analytics)
├── Import Dati (/dashboard/performance/import)
└── Reports (/dashboard/performance/reports)
```

### **Route Aggiuntive**
- `/dashboard/performance/dossier/:playerId` - Dossier giocatore
- `/dashboard/performance/compare?players=1,2,3` - Confronto giocatori

---

## 🔌 API ENDPOINTS UTILIZZATE

### **Performance**
- `GET /api/performance/dashboard` - Dashboard squadra
- `GET /api/performance/players` - Lista giocatori con performance
- `GET /api/performance/player/:id/dossier` - Dossier singolo giocatore
- `GET /api/performance/compare?players=1,2,3` - Confronto multi-giocatore
- `POST /api/performance/import` - Import dati performance

### **Filtri**
- Utilizza modulo `modules/filters/index.js`
- `buildPerformanceQuery(filters)` per costruire query string
- Filtri: sessionType, sessionName, dateRange, normalize, sortBy

---

## 📊 LIBRERIE UTILIZZATE

### **Grafici**
- `recharts` - Per tutti i grafici (BarChart, LineChart, etc.)

### **Icone**
- `lucide-react` - Già utilizzato in client_v3 ✅

### **UI Components**
- `Segmented` - Componente per tab segmentate
- Custom components per filtri

---

## 🎯 PIANO DI MIGRAZIONE

### **FASE 1: Struttura Base** ✅
- [x] Creare cartelle in `client_v3/src/features/performance/`
  - `pages/`
  - `components/`
  - `components/sections/`

### **FASE 2: Componenti Core** (Priorità ALTA)
1. **TeamDashboard** - Dashboard squadra
2. **PerformancePlayersList** - Lista giocatori
3. **DossierDrawer** ⭐⭐ - Drawer dossier giocatore (454+ righe)
4. **CompareDrawer** ⭐⭐ - Drawer confronto giocatori (365+ righe)
5. **PlayerDossier** - Componente dossier riutilizzabile
6. **CompareOverlay** - Overlay confronto (alternativo)

### **FASE 3: Pagine** (Priorità ALTA)
1. **PlayersList** - Vista giocatori
2. **DossierPage** - Pagina dossier
3. **ComparePage** - Pagina confronto

### **FASE 4: Analytics** (Priorità MEDIA)
1. **Analytics** - Analytics base
2. **AnalyticsAdvanced** - Analytics avanzate
3. **Sezioni** (CaricoVolumi, Intensita, etc.)

### **FASE 5: Import & Reports** (Priorità MEDIA)
1. **PerformanceImport** - Import dati
2. **ImportWizard** - Wizard import
3. **Reports** - Gestione report

### **FASE 6: Componenti Accessori** (Priorità BASSA)
1. **CompareBar** - Barra confronto
2. **ComparePanel** - Pannello confronto
3. **ReportPreview** - Anteprima report

---

## 🎨 REBRANDING GRAFICO

### **Design System client_v3**
- `PageHeader` con icone appropriate
- `Card`, `CardHeader`, `CardContent` per sezioni
- `Button` component per controlli
- `EmptyState` per stati vuoti
- `KPICard` per metriche
- Dark mode support
- Responsive design

### **Icone Mapping**
- BarChart3 → Performance
- Users → Giocatori
- TrendingUp → Analytics
- Upload → Import
- FileText → Reports
- GitCompare → Confronto
- User → Dossier

### **Colori Tematici**
- Blu: Metriche generali
- Verde: Valori positivi
- Rosso: Valori negativi/rischio
- Giallo: Attenzione
- Viola: Analytics avanzate

---

## ⚠️ PUNTI DI ATTENZIONE

### **Complessità Alta**
1. **ComparePage** - 537 righe, 7 tab, grafici complessi
2. **DossierPage** - 434+ righe, tab multiple, filtri avanzati
3. **DossierDrawer** ⭐⭐ - 454+ righe, drawer laterale con tab
4. **CompareDrawer** ⭐⭐ - 365+ righe, drawer laterale con 8 sezioni
5. **TeamDashboard** - Dashboard con KPI e grafici
6. **AnalyticsAdvanced** - Analytics complesse

### **Drawer Pattern**
I **Drawer** sono componenti laterali slide-in che si aprono dalla lista giocatori:
- **DossierDrawer**: Vista rapida singolo giocatore
- **CompareDrawer**: Confronto rapido multi-giocatore
- Utilizzano le stesse sezioni analytics delle pagine complete
- Hanno loading skeleton ottimizzato
- Gestiscono filtri in tempo reale
- **IMPORTANTE**: Sono componenti chiave per UX fluida

### **Dipendenze Esterne**
1. **modules/filters** - Sistema filtri condiviso
2. **recharts** - Libreria grafici (già installata?)
3. **Segmented** - Componente UI custom

### **API Complesse**
1. **Compare** - Query con multiple player IDs
2. **Dossier** - Query con filtri complessi
3. **Dashboard** - Aggregazioni team

---

## 📝 CHECKLIST MIGRAZIONE

### **Per Ogni Componente**
- [ ] Copiare file da `client` a `client_v3`
- [ ] Aggiornare import paths (`@/` alias)
- [ ] Sostituire componenti UI con design system
- [ ] Applicare classi Tailwind
- [ ] Mantenere logica API identica
- [ ] Testare funzionalità
- [ ] Verificare dark mode
- [ ] Verificare responsive

### **Ordine di Lavorazione Ottimale**
1. **Sezioni Analytics** (8 sezioni) - Base per drawer e pagine
2. **TeamDashboard** (Dashboard Squadra)
3. **PerformancePlayersList** (Vista Giocatori)
4. **DossierDrawer** ⭐⭐ (Drawer dossier - 454 righe)
5. **CompareDrawer** ⭐⭐ (Drawer confronto - 365 righe)
6. **DossierPage** (Pagina dossier completa)
7. **ComparePage** (Pagina confronto completa)
8. **PlayerDossier** (Componente riutilizzabile)
9. **Analytics + AnalyticsAdvanced**
10. **PerformanceImport** (Import)
11. **Reports**
12. **Componenti accessori**

**Nota**: I Drawer sono prioritari perché utilizzati dalla lista giocatori

---

## 🚀 STIMA COMPLESSITÀ

### **Tempo Stimato per Componente**
- **Sezioni Analytics**: 1 ora ciascuna (8 sezioni = 8 ore)
- **TeamDashboard**: 2-3 ore (dashboard complessa)
- **PerformancePlayersList**: 2-3 ore (lista con filtri)
- **DossierDrawer** ⭐⭐: 3-4 ore (454 righe, drawer complesso)
- **CompareDrawer** ⭐⭐: 3-4 ore (365 righe, drawer complesso)
- **DossierPage**: 3-4 ore (pagina completa)
- **ComparePage**: 3-4 ore (pagina completa)
- **PlayerDossier**: 1-2 ore
- **Analytics**: 2-3 ore
- **AnalyticsAdvanced**: 3-4 ore
- **PerformanceImport**: 2-3 ore
- **Reports**: 1-2 ore
- **Componenti accessori**: 30 min ciascuno

**TOTALE STIMATO: 30-40 ore di lavoro**

**Nota**: I Drawer aggiungono complessità significativa ma sono essenziali per UX

---

## 📌 NOTE IMPORTANTI

1. **NON INVENTARE NULLA** - Solo migrazione + rebranding
2. **MANTENERE API** - Tutte le chiamate API devono rimanere identiche
3. **MANTENERE LOGICA** - Tutta la logica business deve rimanere identica
4. **SOLO GRAFICA** - Cambiare solo componenti UI e stili
5. **TESTARE SEMPRE** - Ogni componente deve essere testato dopo la migrazione

---

## 🎯 PROSSIMI PASSI

1. ✅ **Analisi completata**
2. ⏳ **Creare struttura cartelle**
3. ⏳ **Migrare TeamDashboard**
4. ⏳ **Migrare PerformancePlayersList**
5. ⏳ **Migrare DossierPage**
6. ⏳ **Migrare ComparePage**
7. ⏳ **Migrare Analytics**
8. ⏳ **Migrare Import**
9. ⏳ **Migrare Reports**
10. ⏳ **Migrare Sezioni**
11. ⏳ **Test finale**
12. ⏳ **Commit**

---

**Data Analisi**: 2025-01-04
**Analista**: AI Assistant
**Status**: ✅ ANALISI COMPLETATA - PRONTO PER MIGRAZIONE
