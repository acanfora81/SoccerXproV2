# ⚡ Quick Start - Sistema Onboarding SoccerXpro

## 🎯 Cosa Abbiamo Fatto

### ✅ Database (Supabase)
- Creato script SQL in `server/prisma/migrations/manual_supabase_subscription_schema.sql`
- Da eseguire manualmente su Supabase SQL Editor

### ✅ Frontend (client_v3)
- **4 pagine onboarding** create in `src/pages/`:
  - `LandingPage.jsx` - Homepage pubblica
  - `ChoosePlan.jsx` - Selezione piano
  - `CheckoutPage.jsx` - Checkout simulato
  - `SetupTeam.jsx` - Setup team/admin

- **Stili CSS** creati in `src/styles/`:
  - `landing.css`
  - `checkout.css`
  - `signup.css`

- **Router aggiornato** in `src/app/router.jsx`:
  - Route pubbliche: `/`, `/onboarding/*`
  - Route protette migrate: `/dashboard` → `/app/dashboard`

---

## 🚀 STEP SUCCESSIVI (in ordine)

### 1️⃣ ESEGUI SCRIPT SQL (URGENTE)

```bash
# 1. Vai su Supabase Dashboard
#    https://supabase.com → Tuo progetto → SQL Editor

# 2. Apri il file:
server/prisma/migrations/manual_supabase_subscription_schema.sql

# 3. Copia TUTTO il contenuto

# 4. Incolla nel SQL Editor di Supabase

# 5. Premi RUN ▶️

# 6. Verifica output:
#    - 3 tabelle create
#    - Colonne aggiunte a team e user
#    - 4 piani inseriti
```

### 2️⃣ SINCRONIZZA PRISMA

```bash
cd server

# Pull schema da Supabase
npx prisma db pull

# Rigenera Prisma Client
npx prisma generate

# Verifica schema.prisma contiene le nuove tabelle
```

### 3️⃣ TESTA FRONTEND

```bash
cd client_v3

# Installa dipendenze (se non fatto)
npm install

# Avvia dev server
npm run dev

# Apri browser: http://localhost:5173/
```

**Segui la guida:** `client_v3/TEST_ONBOARDING.md`

### 4️⃣ CREA ENDPOINT BACKEND

```bash
cd server/src/routes

# Crea file onboarding.js
# Vedi esempio completo in: docs/ONBOARDING_SYSTEM_IMPLEMENTATION.md
```

**Endpoint da implementare:**
- `POST /api/onboarding/create-team`
- `GET /api/subscription-plans`

### 5️⃣ INTEGRA FRONTEND → BACKEND

Modifica `client_v3/src/pages/SetupTeam.jsx`:
```javascript
// Sostituire alert con chiamata API
// Vedi esempio in: docs/ONBOARDING_SYSTEM_IMPLEMENTATION.md
```

---

## 📁 File Creati/Modificati

```
SoccerXpro_V2/
├── server/
│   └── prisma/
│       └── migrations/
│           └── manual_supabase_subscription_schema.sql  ✨ NUOVO
├── client_v3/
│   ├── src/
│   │   ├── pages/                                       ✨ NUOVO DIR
│   │   │   ├── LandingPage.jsx                         ✨ NUOVO
│   │   │   ├── ChoosePlan.jsx                          ✨ NUOVO
│   │   │   ├── CheckoutPage.jsx                        ✨ NUOVO
│   │   │   └── SetupTeam.jsx                           ✨ NUOVO
│   │   ├── styles/
│   │   │   ├── landing.css                             ✨ NUOVO
│   │   │   ├── checkout.css                            ✨ NUOVO
│   │   │   └── signup.css                              ✨ NUOVO
│   │   ├── app/
│   │   │   └── router.jsx                              🔧 MODIFICATO
│   │   └── main.jsx                                    🔧 MODIFICATO
│   ├── ONBOARDING_FLOW.md                              ✨ NUOVO
│   └── TEST_ONBOARDING.md                              ✨ NUOVO
├── docs/
│   └── ONBOARDING_SYSTEM_IMPLEMENTATION.md             ✨ NUOVO
└── QUICK_START_ONBOARDING.md                           ✨ NUOVO (questo file)
```

---

## 📚 Documentazione

| File | Scopo |
|------|-------|
| `QUICK_START_ONBOARDING.md` | Quick reference (questo file) |
| `client_v3/ONBOARDING_FLOW.md` | Flow utente e struttura pagine |
| `client_v3/TEST_ONBOARDING.md` | Guida test manuale |
| `docs/ONBOARDING_SYSTEM_IMPLEMENTATION.md` | Implementazione completa con codice |

---

## 🧪 Test Veloce (5 minuti)

```bash
# Terminal 1: Avvia frontend
cd client_v3 && npm run dev

# Browser: http://localhost:5173/
# 1. Click "Inizia Ora"
# 2. Seleziona piano "PROFESSIONAL"
# 3. Click "Procedi al pagamento"
# 4. Click "Procedi alla creazione"
# 5. Compila form e submit
# ✅ Dovresti vedere alert "Team [...] creato"
```

---

## ⚠️ Breaking Changes

**Route protette cambiate:**
- ❌ Vecchio: `/dashboard`
- ✅ Nuovo: `/app/dashboard`

**Se hai link hardcoded:**
```javascript
// Vecchio
<Link to="/dashboard">Dashboard</Link>

// Nuovo
<Link to="/app/dashboard">Dashboard</Link>
```

**Redirect automatico gestito dal router:**
- `/app` → `/app/dashboard` (OK)
- `/login` → rimane `/login` (OK)
- Route sconosciute → `/` (Landing)

---

## 🐛 Troubleshooting Comune

### Errore: "Cannot find module @/pages/LandingPage"
```bash
# Verifica che la directory pages esista
ls client_v3/src/pages/

# Se manca, esegui:
mkdir client_v3/src/pages
```

### Errore: Tailwind classes non applicate
```bash
# Verifica tailwind.config.js include src/pages
# Verifica postcss.config.js corretto
```

### Errore: Route non funziona
```bash
# Verifica import in router.jsx
# Verifica sintassi route (case-sensitive)
```

---

## 🎯 Checklist Completamento

### Fase 1: Database
- [ ] Script SQL eseguito su Supabase
- [ ] Tabelle verificate visivamente
- [ ] Prisma schema sincronizzato (`db pull`)
- [ ] Prisma Client rigenerato (`generate`)

### Fase 2: Frontend Test
- [ ] Dev server avviato
- [ ] Landing page visibile
- [ ] Flow completo testato
- [ ] Nessun errore console

### Fase 3: Backend API
- [ ] File `onboarding.js` creato
- [ ] Endpoint `/create-team` implementato
- [ ] Endpoint testato con Postman
- [ ] Validazioni aggiunte

### Fase 4: Integrazione
- [ ] Frontend chiama API backend
- [ ] Token JWT salvato in localStorage
- [ ] Redirect a `/app/dashboard` funziona
- [ ] Gestione errori implementata

### Fase 5: Production Ready
- [ ] Test E2E scritti
- [ ] Error handling completo
- [ ] Loading states implementati
- [ ] Documentazione API (Swagger)

---

## 📞 Support

Se hai problemi:
1. Controlla console browser (F12)
2. Verifica server dev è attivo
3. Leggi error message completo
4. Consulta documentazione in `docs/`

---

## 🎉 Risultato Finale Atteso

**Utente nuovo può:**
1. Arrivare su landing page
2. Scegliere piano (BASIC gratis o pagamento)
3. Simulare pagamento
4. Creare team + admin user
5. Venire auto-loggato
6. Accedere alla dashboard

**Database contiene:**
- Team creato
- Subscription attiva
- User admin collegato al team
- Payment log (se piano a pagamento)

---

## 🚀 Go Live!

Quando tutto è pronto:
```bash
# Build frontend
cd client_v3 && npm run build

# Deploy su Vercel/Netlify/altro
# Configura ENV variables
# Test in produzione
```

**Good luck! 🍀**
