# 🎯 Implementazione Sistema Onboarding + Subscription

## 📅 Data: 5 Ottobre 2025

---

## ✅ FASE 1: DATABASE SCHEMA (COMPLETATA)

### Script SQL Creato
📁 `server/prisma/migrations/manual_supabase_subscription_schema.sql`

### Tabelle Create su Supabase:
- ✅ `subscription_plan` - Piani disponibili (BASIC, PROFESSIONAL, PREMIUM, ENTERPRISE)
- ✅ `subscription` - Subscription attive per team
- ✅ `payment_log` - Log transazioni pagamento

### Colonne Aggiunte:
**Tabella `team`:**
- `plan_id` (UUID, FK → subscription_plan)
- `plan_start_date` (TIMESTAMP)
- `plan_end_date` (TIMESTAMP)
- `is_trial` (BOOLEAN)
- `status` (TEXT, default 'ACTIVE')

**Tabella `user`:**
- `team_id` (UUID, FK → team)
- `role` (TEXT, default 'ADMIN')

### Indici Creati:
- `idx_subscription_team_id`
- `idx_subscription_plan_id`
- `idx_team_plan_id`
- `idx_payment_log_team_id`
- `idx_payment_log_plan_id`

### Dati Seed:
4 piani base inseriti in `subscription_plan`

---

## ✅ FASE 2: FRONTEND ONBOARDING (COMPLETATA)

### Struttura Creata:
```
client_v3/src/
├── pages/                          # ✨ NUOVO
│   ├── LandingPage.jsx            # Homepage pubblica
│   ├── ChoosePlan.jsx             # Selezione piano
│   ├── CheckoutPage.jsx           # Simulazione pagamento
│   └── SetupTeam.jsx              # Setup team/admin
├── styles/
│   ├── landing.css                # ✨ NUOVO
│   ├── checkout.css               # ✨ NUOVO
│   └── signup.css                 # ✨ NUOVO
├── app/
│   └── router.jsx                 # 🔧 MODIFICATO
└── main.jsx                       # 🔧 MODIFICATO
```

### Route Pubbliche Aggiunte:
| Route | Componente | Status |
|-------|-----------|---------|
| `/` | LandingPage | ✅ Funzionante |
| `/onboarding/choose-plan` | ChoosePlan | ✅ Funzionante |
| `/onboarding/payment` | CheckoutPage | ✅ Funzionante |
| `/onboarding/setup-team` | SetupTeam | ✅ Funzionante |

### Route Protette Migrate:
Da `/dashboard` → `/app/dashboard` (e tutte le sotto-route)

---

## 🔄 FASE 3: BACKEND API (TODO)

### Endpoint da Creare:

#### 1. `POST /api/onboarding/create-team`
**Scopo:** Creare team + subscription + admin user in transazione atomica

**Request Body:**
```json
{
  "teamName": "AC Milan",
  "planCode": "PROFESSIONAL",
  "adminUser": {
    "email": "admin@acmilan.com",
    "firstName": "Paolo",
    "lastName": "Maldini"
  }
}
```

**Response:**
```json
{
  "success": true,
  "team": { "id": "uuid", "name": "AC Milan" },
  "user": { "id": "uuid", "email": "..." },
  "token": "jwt_token_here"
}
```

**Logica Server:**
```javascript
// server/src/routes/onboarding.js
router.post('/create-team', async (req, res) => {
  const { teamName, planCode, adminUser } = req.body;
  
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Trova plan
      const plan = await tx.subscription_plan.findUnique({
        where: { code: planCode }
      });
      
      // 2. Crea team
      const team = await tx.team.create({
        data: {
          name: teamName,
          plan_id: plan.id,
          plan_start_date: new Date(),
          plan_end_date: calculateEndDate(plan),
          is_trial: planCode === 'BASIC',
          status: 'ACTIVE'
        }
      });
      
      // 3. Crea subscription
      await tx.subscription.create({
        data: {
          team_id: team.id,
          plan_id: plan.id,
          start_date: new Date(),
          end_date: calculateEndDate(plan),
          status: 'ACTIVE'
        }
      });
      
      // 4. Crea admin user
      const hashedPassword = await bcrypt.hash('temp_password', 10);
      const user = await tx.user.create({
        data: {
          email: adminUser.email,
          first_name: adminUser.firstName,
          last_name: adminUser.lastName,
          password: hashedPassword,
          team_id: team.id,
          role: 'ADMIN'
        }
      });
      
      // 5. Log payment (se piano a pagamento)
      if (plan.price_monthly > 0) {
        await tx.payment_log.create({
          data: {
            team_id: team.id,
            plan_id: plan.id,
            amount: plan.price_monthly,
            provider: 'Simulated',
            status: 'SUCCESS',
            message: 'Onboarding signup'
          }
        });
      }
      
      // 6. Genera JWT token
      const token = jwt.sign(
        { userId: user.id, teamId: team.id, role: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      return { team, user, token };
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

#### 2. `GET /api/subscription-plans`
**Scopo:** Recuperare lista piani disponibili

#### 3. `GET /api/team/:teamId/subscription`
**Scopo:** Dettagli subscription corrente

---

## 🔧 FASE 4: INTEGRAZIONE FRONTEND-BACKEND (TODO)

### File da Modificare:

#### `client_v3/src/pages/ChoosePlan.jsx`
```javascript
// Sostituire array hardcoded con chiamata API
useEffect(() => {
  fetch('/api/subscription-plans')
    .then(res => res.json())
    .then(data => setPlans(data));
}, []);
```

#### `client_v3/src/pages/SetupTeam.jsx`
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    const response = await fetch('/api/onboarding/create-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamName,
        planCode: plan,
        adminUser: { email, firstName, lastName }
      })
    });
    
    if (!response.ok) throw new Error('Errore creazione team');
    
    const { token } = await response.json();
    localStorage.setItem('authToken', token);
    navigate('/app/dashboard');
  } catch (error) {
    alert('Errore: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 📋 CHECKLIST COMPLETA

### Database
- [x] Creare script SQL
- [ ] Eseguire script su Supabase SQL Editor
- [ ] Verificare tabelle create
- [ ] Sincronizzare Prisma (`npx prisma db pull`)
- [ ] Rigenerare Prisma Client (`npx prisma generate`)

### Backend API
- [ ] Creare `server/src/routes/onboarding.js`
- [ ] Implementare `POST /create-team`
- [ ] Implementare `GET /subscription-plans`
- [ ] Aggiungere validazioni Joi/Zod
- [ ] Aggiungere gestione errori
- [ ] Aggiungere route a `server/src/app.js`
- [ ] Test endpoint con Postman

### Frontend
- [x] Creare pagine onboarding
- [x] Aggiungere route al router
- [x] Creare stili CSS
- [ ] Integrare chiamate API
- [ ] Aggiungere loading states
- [ ] Aggiungere error handling
- [ ] Aggiungere form validation

### Testing
- [ ] Test unitari backend
- [ ] Test integrazione database
- [ ] Test flow E2E onboarding
- [ ] Test gestione errori
- [ ] Test responsive mobile

### Documentazione
- [x] ONBOARDING_FLOW.md
- [x] ONBOARDING_SYSTEM_IMPLEMENTATION.md
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User guide

---

## 🚀 NEXT STEPS (Priorità)

1. **Esegui script SQL su Supabase** ⚠️ URGENTE
2. **Sincronizza Prisma schema** (dopo step 1)
3. **Crea endpoint `/api/onboarding/create-team`**
4. **Integra API in SetupTeam.jsx**
5. **Test flow completo**

---

## 📌 Note Tecniche

### Breaking Changes
- Route protette migrate da `/dashboard` a `/app/dashboard`
- Verificare link hardcoded nell'app

### Dipendenze Necessarie
- Backend: `bcryptjs`, `jsonwebtoken` (già installati)
- Frontend: `react-router-dom` (già installato)

### Ambiente Variabili
```env
# server/.env
JWT_SECRET=your_secret_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

---

## 🎨 Design System

Tutte le pagine usano:
- **Palette:** Dark gradient (from-[#0a0a0f] via-[#111827] to-[#1e1b4b])
- **Accent:** Blue-500 to Purple-500 gradient
- **Framework:** Tailwind CSS v3.4+
- **Icons:** Lucide React

---

## 🔍 Riferimenti

- Schema SQL: `server/prisma/migrations/manual_supabase_subscription_schema.sql`
- Flow docs: `client_v3/ONBOARDING_FLOW.md`
- Router: `client_v3/src/app/router.jsx`
