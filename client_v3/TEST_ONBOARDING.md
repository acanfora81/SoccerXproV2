# 🧪 Test Onboarding Flow - Guida Rapida

## 🚀 Avvio Rapido

### 1. Avvia il server di sviluppo
```bash
cd client_v3
npm run dev
```

Dovresti vedere:
```
VITE v7.1.7  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## 📝 Test Flow Completo

### Step 1: Landing Page
1. Apri browser su `http://localhost:5173/`
2. **Verifica:**
   - ✅ Background gradient dark (blu/viola)
   - ✅ Titolo "Soccer X Pro Suite" con gradient animato
   - ✅ Button "Inizia Ora" con freccia

3. **Click** su "Inizia Ora"

---

### Step 2: Choose Plan
**URL:** `http://localhost:5173/onboarding/choose-plan`

**Verifica:**
- ✅ 4 cards visibili (BASIC, PROFESSIONAL, PREMIUM, ENTERPRISE)
- ✅ Prezzi corretti:
  - BASIC: Gratis
  - PROFESSIONAL: 29€/mese
  - PREMIUM: 59€/mese
  - ENTERPRISE: Custom
- ✅ Features list per ogni piano
- ✅ Click su card → bordo blu + scale effect
- ✅ Button "Procedi al pagamento" abilitato

**Azioni:**
1. Clicca su piano "PROFESSIONAL"
2. Verifica che il bordo diventi blu
3. Click su "Procedi al pagamento"

---

### Step 3: Checkout (Simulazione)
**URL:** `http://localhost:5173/onboarding/payment?plan=PROFESSIONAL`

**Verifica:**
- ✅ URL contiene `?plan=PROFESSIONAL`
- ✅ Titolo mostra "Pagamento piano PROFESSIONAL"
- ✅ Icona carta di credito visibile
- ✅ Testo "Simulazione pagamento - nessun addebito reale"

**Azioni:**
1. Click su "Procedi alla creazione del team"
2. Attendi 1 secondo (simulazione processing)

---

### Step 4: Setup Team
**URL:** `http://localhost:5173/onboarding/setup-team?plan=PROFESSIONAL`

**Verifica:**
- ✅ Form con 4 campi:
  - Nome del Team (required)
  - Email amministratore (required, type=email)
  - Nome
  - Cognome
- ✅ Titolo mostra "Crea la tua Squadra (PROFESSIONAL)"
- ✅ Form styling glassmorphism (bg-white/10 backdrop-blur)

**Azioni:**
1. Compila tutti i campi:
   ```
   Nome Team: AC Milan
   Email: admin@acmilan.com
   Nome: Paolo
   Cognome: Maldini
   ```
2. Click "Crea Team"
3. **Verifica alert:** "Team AC Milan creato con piano PROFESSIONAL!"
4. **Verifica redirect:** dovrebbe tentare di andare a `/dashboard`

---

## 🎯 Test Specifici

### Test Validazione Form
1. Vai su `/onboarding/setup-team`
2. Prova a submit senza compilare → browser dovrebbe bloccare (HTML5 validation)
3. Inserisci email non valida → browser dovrebbe bloccare

### Test Navigation
- Da Landing → Choose Plan: ✅
- Da Choose Plan → Checkout: ✅ (con param plan)
- Da Checkout → Setup: ✅ (con param plan)
- Da Setup → Dashboard: ⚠️ (alert + redirect, dashboard non ancora integrato)

### Test Responsive
Apri DevTools (F12) e testa:
- Mobile (375px)
- Tablet (768px)
- Desktop (1920px)

**Verifica:**
- Landing page responsive
- Cards plan si wrappano su mobile
- Form si adatta a schermi piccoli

### Test Dark Mode
- Tutte le pagine onboarding usano dark theme by default
- Background gradient dovrebbe essere consistente
- Testo bianco leggibile

---

## 🐛 Troubleshooting

### Problema: Pagina bianca
**Soluzione:**
1. Apri console (F12)
2. Verifica errori import
3. Controlla che `npm run dev` sia attivo

### Problema: Styling non applicato
**Verifica:**
1. File CSS esistono in `src/styles/`
2. Import in `main.jsx` sono corretti
3. Tailwind è configurato correttamente

### Problema: Route non funziona
**Verifica:**
1. URL esatto (case-sensitive)
2. Router in `app/router.jsx` include route
3. Componente importato correttamente

---

## ✅ Checklist Test Completo

- [ ] Landing page si carica correttamente
- [ ] Gradient background visibile
- [ ] Button "Inizia Ora" funziona
- [ ] Choose Plan mostra 4 cards
- [ ] Selezione plan cambia bordo
- [ ] Checkout riceve param plan
- [ ] Setup Team mostra plan selezionato
- [ ] Form validation funziona
- [ ] Submit mostra alert
- [ ] Redirect viene tentato
- [ ] Responsive funziona su mobile
- [ ] Nessun errore console

---

## 📸 Screenshot Attesi

### Landing Page
```
┌─────────────────────────────────────┐
│  Dark gradient background           │
│                                     │
│   Soccer X Pro Suite                │
│   (animated gradient text)          │
│                                     │
│   La piattaforma completa per la    │
│   gestione professionale...         │
│                                     │
│   [  Inizia Ora  →  ]              │
└─────────────────────────────────────┘
```

### Choose Plan
```
┌──────┬──────┬──────┬──────┐
│BASIC │ PRO  │PREMIUM│ENTER│
│Gratis│29€/m │59€/m │Custom│
│  ✓   │  ✓   │  ✓   │  ✓  │
│  ✓   │  ✓   │  ✓   │  ✓  │
└──────┴──────┴──────┴──────┘
       [Procedi al pagamento]
```

### Checkout
```
┌─────────────────────────────┐
│         💳                  │
│  Pagamento piano PRO        │
│  Simulazione pagamento      │
│                             │
│  [Procedi alla creazione]   │
└─────────────────────────────┘
```

### Setup Team
```
┌─────────────────────────────┐
│ 🏢 Crea la tua Squadra (PRO)│
│                             │
│ [Nome del Team]             │
│ [Email amministratore]      │
│ [Nome]    [Cognome]         │
│                             │
│ [💾 Crea Team]              │
└─────────────────────────────┘
```

---

## 🎬 Prossimi Passi

Dopo aver verificato che tutto funziona:
1. **Integra API backend** (vedi `docs/ONBOARDING_SYSTEM_IMPLEMENTATION.md`)
2. **Rimuovi alert e aggiungi loading states**
3. **Implementa gestione errori**
4. **Test E2E con Playwright**
