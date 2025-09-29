# 📚 Documentazione SoccerXpro V2

Questa cartella contiene tutta la documentazione tecnica del progetto SoccerXpro V2, organizzata per aree tematiche.

## 📁 Struttura

```
docs/
├── 📁 architecture/          # Architettura e design del sistema
│   └── STRUTTURA_PROGETTO.md # Architettura generale e componenti
├── 📁 setup/                 # Guide di setup e configurazione
│   ├── project-structure-2025-08-30.md  # Struttura file aggiornata
│   └── Recap_Progetto.md     # Riepilogo lavoro svolto
├── 📁 api/                   # Documentazione API e moduli
│   └── gpsDeriver.md         # Modulo derivazione dati GPS
├── 📄 Documentazione Tecnica # File di documentazione spostati dalla root
│   ├── CSV_REORGANIZATION.md
│   ├── FIX_ERROR_FRONTEND.md
│   ├── GESTIONE_ALIQUOTE_IRPEF_COMPLETATA.md
│   ├── INTEGRAZIONE_COMPLETATA.md
│   ├── INTEGRAZIONE_FRONTEND_API.md
│   ├── ISTRUZIONI_TEST_CALCOLO.md
│   ├── MEDICAL_DATABASE_STRUCTURE.md
│   ├── MODIFICHE_CHIRURGICHE_APPLICATE.md
│   ├── PROBLEMA_TAXCALCULATOR_RISOLTO.md
│   ├── NUOVO_SISTEMA_CALCOLO_CORRETTO.md
│   ├── CALCOLO_COSTO_SOCIETA.md
│   ├── TAX_RATES_UPDATE_2025.md
│   ├── REMOVAL_TAX_SCENARIOS.md
│   ├── SERVER_REORGANIZATION.md
│   ├── SOLUZIONE-FILTRO-SESSIONTYPE-DASHBOARD.md
│   └── project-structure.txt
└── 📁 metrics/               # Metriche e dashboard
    └── README_Dashboard_Metriche.md  # Metriche dashboard performance
```

## 🎯 Aree Tematiche

### 🏗️ **Architecture**
Documentazione dell'architettura del sistema, design patterns e decisioni tecniche.

### ⚙️ **Setup**
Guide per l'installazione, configurazione e setup dell'ambiente di sviluppo.

### 🔌 **API**
Documentazione delle API, moduli e servizi del backend.

### 📊 **Metrics**
Documentazione delle metriche, dashboard e logiche di calcolo performance.

### 📦 **Documentazione Tecnica**
Tutti i file di documentazione tecnica che erano sparsi nella root del progetto sono stati qui centralizzati per una migliore organizzazione:

- [Riorganizzazione CSV di esempio](./CSV_REORGANIZATION.md)
- [Soluzione filtro SessionType Dashboard](./SOLUZIONE-FILTRO-SESSIONTYPE-DASHBOARD.md)
- [Rimozione Sistema Fiscale Parametrico](./REMOVAL_TAX_SCENARIOS.md)
- [Riorganizzazione Struttura Server](./SERVER_REORGANIZATION.md)
- [Gestione Aliquote IRPEF](./GESTIONE_ALIQUOTE_IRPEF_COMPLETATA.md)
- [Integrazione Frontend-API](./INTEGRAZIONE_FRONTEND_API.md)
- [Struttura Database Medico](./MEDICAL_DATABASE_STRUCTURE.md)
- [Sistema Calcolo Fiscale](./NUOVO_SISTEMA_CALCOLO_CORRETTO.md)

## 📝 Convenzioni

- **File Markdown**: Tutti i file sono in formato `.md`
- **Naming**: Nomi descrittivi con underscore per spazi
- **Date**: Inclusione di date nei nomi file per versioning
- **Emoji**: Uso di emoji per categorizzazione visiva

## 🔄 Manutenzione

La documentazione viene aggiornata in parallelo allo sviluppo:
- Nuove funzionalità → Aggiornamento documentazione correlata
- Modifiche architetturali → Aggiornamento `architecture/`
- Nuove API → Aggiornamento `api/`
- Nuove metriche → Aggiornamento `metrics/`

## 📖 Come Contribuire

1. **Leggi** la documentazione esistente
2. **Aggiorna** i file correlati alle tue modifiche
3. **Mantieni** la struttura e le convenzioni
4. **Testa** che i link funzionino correttamente

---

*Ultimo aggiornamento: 29 Settembre 2025 - Riorganizzazione file di documentazione*
