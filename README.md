# ⚽ Soccer X Pro Suite

> Sistema di gestione completo per società calcistiche professionali

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.2.0-blue)](https://reactjs.org/)

## 📍 Percorso Progetto
```
C:\Progetti\SoccerXpro_V2
```

## 🎯 Panoramica

SoccerXpro V2 è un gestionale completo per società calcistiche che include:

- 👥 **Gestione Giocatori** - Anagrafica, documenti, statistiche
- 📄 **Contratti** - Creazione, rinnovi, clausole, scadenze  
- 🏥 **Area Medica** - Infortuni, visite, recuperi, storico
- 💰 **Amministrazione** - Budget, preventivi, consuntivi, reportistica
- 🔄 **Mercato** - Trattative, scouting, valutazioni

## 🏗️ Stack Tecnologico

### Frontend
- **React 18** + TypeScript
- **Redux Toolkit** + RTK Query
- **React Router** per routing
- **Lucide React** per icone
- **Recharts** per grafici
- **CSS Modules** per styling

### Backend  
- **Node.js** + Express
- **Prisma ORM** + PostgreSQL
- **JWT** per autenticazione
- **Event-driven** architecture

### Testing & Quality
- **Jest** + Testing Library (unit tests)
- **Playwright** (E2E tests)
- **Storybook** (UI components)
- **ESLint** + Prettier

### DevOps
- **GitHub Actions** (CI/CD)
- **Docker** + Docker Compose
- **Redis** (caching)

## 🚀 Quick Start

### Prerequisiti
- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL
- Git

### 1. Clona e Setup
```bash
git clone <repository-url>
cd SoccerXpro_V2
npm run setup
```

### 2. Configurazione Environment
```bash
cp .env.example .env
# Configura le variabili in .env
```

### 3. Database Setup
```bash
npm run prisma:migrate
npm run prisma:seed
```

### 4. Avvia l'applicazione
```bash
# Frontend (porta 3000)
npm run dev

# Backend (porta 3001)  
npm run server

# Storybook (porta 6006)
npm run storybook
```

## 📁 Struttura Progetto

```
SoccerXpro_V2/
├── 📁 src/                    # Frontend React
│   ├── 📁 components/         # Componenti UI
│   ├── 📁 pages/             # Pagine applicazione
│   ├── 📁 store/             # Redux store
│   ├── 📁 services/          # API services
│   ├── 📁 hooks/             # Custom hooks
│   ├── 📁 styles/            # CSS/Themes
│   └── 📁 i18n/              # Internazionalizzazione
├── 📁 server/                # Backend Node.js
│   ├── 📁 src/               # Codice sorgente
│   ├── 📁 prisma/            # Database schema
│   └── 📁 tests/             # Test backend
├── 📁 e2e/                   # Test end-to-end
├── 📁 .storybook/            # Configurazione Storybook
├── 📁 docs/                  # Documentazione
└── 📁 infrastructure/        # Docker, CI/CD
```

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Esegui tutti i test
npm run test:watch         # Modalità watch
```

### E2E Tests
```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # UI mode
```

### Storybook
```bash
npm run storybook          # Sviluppo componenti
npm run build-storybook    # Build per produzione
```

## 🎨 Temi

L'applicazione supporta due temi:

- **🌕 Light Theme**: Sfondo bianco con testo blu
- **🌙 Dark Theme**: Sfondo nero con testo viola

## 📊 Legenda Log

Durante lo sviluppo usiamo log colorati:

```javascript
// 🟢 LOG VERDE = Info/Success (rimuovere in produzione)
console.log('🟢 Operazione completata');

// 🟡 LOG GIALLO = Warning/Debug (rimuovere in produzione)  
console.warn('🟡 Attenzione: dato mancante');

// 🔴 LOG ROSSO = Error/Critical (mantenere essenziali)
console.error('🔴 ERRORE CRITICO');

// 🔵 LOG BLU = Info Development (rimuovere in produzione)
console.info('🔵 DEV: rendering componente');

// 🟠 LOG ARANCIONE = Performance (valutare caso per caso)
console.log('🟠 PERF: query in 245ms');

// 🟣 LOG VIOLA = Business Logic (mantenere per audit)
console.log('🟣 AUDIT: contratto creato ID: 123');
```

## 🚀 Deploy

### Development
```bash
npm run dev                # Frontend + hot reload
npm run server            # Backend + nodemon
```

### Production
```bash
npm run build             # Build frontend
npm run server:prod       # Server produzione
```

### Docker
```bash
docker-compose up -d      # Avvia tutti i servizi
```

## 📖 Documentazione

- [📋 API Documentation](./docs/api/)
- [🏗️ Architecture](./docs/architecture/)  
- [⚙️ Setup Guide](./docs/setup/)
- [🤝 Contributing](./CONTRIBUTING.md)

## 📖 Documentazione tecnica

- [Architettura](docs/architecture/STRUTTURA_PROGETTO.md)
- [Struttura progetto aggiornata](docs/setup/project-structure-2025-08-30.md)
- [Recap progetto](docs/setup/Recap_Progetto.md)
- [Modulo GPS Deriver](docs/api/gpsDeriver.md)
- [Metriche Dashboard](docs/metrics/README_Dashboard_Metriche.md)

## 👥 Team

- **Alessandro Canfora** - Lead Developer

## 📄 License

Questo progetto è sotto licenza MIT - vedi il file [LICENSE](LICENSE) per dettagli.

## 🆘 Support

Per problemi o domande:
1. Controlla la [documentazione](./docs/)
2. Cerca negli [issues](../../issues) esistenti
3. Crea un nuovo [issue](../../issues/new)

---

**Made with ⚽ for football management**