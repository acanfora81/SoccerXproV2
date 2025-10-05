# 🚀 Flusso di Onboarding - Soccer X Pro Suite

## 📋 Overview
Sistema completo di onboarding per nuovi team/società con integrazione subscription plan.

## 🗺️ Struttura Route

### Route Pubbliche (Onboarding)
| Route | Componente | Descrizione |
|-------|-----------|-------------|
| `/` | `LandingPage` | Homepage pubblica con CTA |
| `/onboarding/choose-plan` | `ChoosePlan` | Selezione piano subscription |
| `/onboarding/payment` | `CheckoutPage` | Simulazione pagamento |
| `/onboarding/setup-team` | `SetupTeam` | Creazione team e admin user |

### Route Protette (App)
Tutte le route dell'applicazione ora sono sotto `/app/*`:
- `/app/dashboard` - Dashboard principale
- `/app/dashboard/players` - Gestione giocatori
- `/app/dashboard/performance` - Performance tracking
- ecc.

## 🎨 Pagine Create

### 1️⃣ LandingPage (`src/pages/LandingPage.jsx`)
**Scopo:** Prima pagina che vede l'utente  
**Features:**
- Design gradient dark (blu/viola)
- CTA "Inizia Ora" → `/onboarding/choose-plan`
- Animazione fade-in
- Responsive mobile-first

### 2️⃣ ChoosePlan (`src/pages/ChoosePlan.jsx`)
**Scopo:** Selezione piano subscription  
**Features:**
- 4 piani: BASIC (gratis), PROFESSIONAL (29€), PREMIUM (59€), ENTERPRISE (custom)
- Cards interattive con hover effects
- Selezione visuale con bordo blu
- Lista features per piano
- Button → `/onboarding/payment?plan=SELECTED`

### 3️⃣ CheckoutPage (`src/pages/CheckoutPage.jsx`)
**Scopo:** Simulazione pagamento (nessun addebito reale)  
**Features:**
- Mostra piano selezionato da query param
- Icona CreditCard
- Simulazione con timeout 1s
- Button → `/onboarding/setup-team?plan=SELECTED`

### 4️⃣ SetupTeam (`src/pages/SetupTeam.jsx`)
**Scopo:** Creazione team e primo admin user  
**Features:**
- Form con validazione:
  - Nome Team (required)
  - Email admin (required, type=email)
  - Nome/Cognome admin
- Mostra piano selezionato
- Submit → alert + redirect `/dashboard`

## 🎨 Stili CSS

### `styles/landing.css`
- Animazione fadeIn per landing page
- Text-shadow per h1

### `styles/checkout.css`
- Animazione slideIn per checkout
- Scale effect

### `styles/signup.css`
- Animazione fadeInUp per form
- Focus effects su input

## 🔌 Integrazione con DB (TODO)

### Endpoint da creare (backend):

```javascript
// POST /api/onboarding/create-team
{
  teamName: string,
  planCode: string,  // BASIC, PROFESSIONAL, etc.
  adminUser: {
    email: string,
    firstName: string,
    lastName: string
  }
}
```

**Logica server:**
1. Crea record in `subscription_plan` (già esistente)
2. Crea team in `team` con `plan_id`
3. Crea subscription in `subscription` table
4. Crea user in `user` table con `role: ADMIN` e `team_id`
5. Crea payment_log (se piano a pagamento)
6. Ritorna JWT token per auto-login

### Modifiche da fare a SetupTeam.jsx:
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const response = await fetch('/api/onboarding/create-team', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamName,
      planCode: plan,
      adminUser: { email, firstName, lastName }
    })
  });
  
  const { token } = await response.json();
  localStorage.setItem('authToken', token);
  window.location.href = '/app/dashboard';
};
```

## ✅ Checklist Integrazione

- [x] Creare pagine onboarding (4 componenti)
- [x] Aggiungere route pubbliche al router
- [x] Creare stili CSS con animazioni
- [x] Aggiornare main.jsx con import CSS
- [x] Documentare flusso
- [ ] Creare endpoint backend `/api/onboarding/create-team`
- [ ] Integrare chiamata API in SetupTeam.jsx
- [ ] Aggiungere validazioni backend
- [ ] Test flow end-to-end
- [ ] Aggiungere gestione errori

## 🧪 Testing Manuale

1. Avvia dev server: `npm run dev`
2. Vai su `http://localhost:5173/`
3. Click "Inizia Ora"
4. Seleziona un piano → click "Procedi al pagamento"
5. Click "Procedi alla creazione del team"
6. Compila form → click "Crea Team"
7. Verifica alert e redirect

## 📝 Note Importanti

⚠️ **BREAKING CHANGE:** Le route protette sono ora sotto `/app/*` invece di root.  
Se hai link hardcoded o redirect a `/dashboard`, aggiornarli a `/app/dashboard`.

✅ **Compatibilità:** Il redirect automatico da `/app` a `/app/dashboard` è gestito dal router.

🎨 **Design System:** Le pagine usano Tailwind + utility classes custom per gradients.

🔒 **Sicurezza:** Le route di onboarding sono pubbliche, il resto è protetto da `<ProtectedRoute>`.
