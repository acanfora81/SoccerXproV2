# 🔐 Configurazione Ambiente - Scouting Module

## Feature Flag

Per abilitare il modulo Scouting, aggiungi questa variabile d'ambiente al file `.env` del server:

```bash
FEATURE_SCOUTING_MODULE=true
```

---

## Configurazione Completa `.env`

Esempio di configurazione completa per il backend SoccerXPro con Scouting Module:

```bash
# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://user:password@host:5432/database?schema=soccerxpro"
DIRECT_URL="postgresql://user:password@host:5432/database?schema=soccerxpro"

# ============================================
# SUPABASE
# ============================================
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ============================================
# JWT
# ============================================
JWT_SECRET="your-jwt-secret-key"

# ============================================
# REDIS (optional, per token blacklist)
# ============================================
REDIS_URL="redis://localhost:6379"

# ============================================
# FEATURE FLAGS
# ============================================
# Modulo Mercato (Targets, Negotiations, Offers, Budgets)
FEATURE_MARKET_MODULE=true

# Modulo Scouting (Prospects, Reports, Shortlists) - ENTERPRISE
FEATURE_SCOUTING_MODULE=true

# ============================================
# CORS
# ============================================
FRONTEND_URL="http://localhost:5173"

# ============================================
# ENCRYPTION (Medical Area - GDPR)
# ============================================
MEDICAL_ENCRYPTION_KEY="your-32-byte-encryption-key"
```

---

## Verifica Feature Flag

Per verificare se il modulo è abilitato, controlla il log del server all'avvio:

```
🟢 [INFO] Scouting Module mounted at /api/scouting
```

Se il modulo è **disabilitato**, vedrai:

```
🟡 [WARN] Scouting routes not mounted: Scouting module disabled
```

---

## Health Check

Puoi anche verificare lo stato del server e dei moduli con:

```bash
GET http://localhost:3001/health
```

---

## Endpoint API Scouting

Una volta abilitato il modulo, saranno disponibili questi endpoint:

### Prospects
- `GET /api/scouting/prospects` - Lista prospects
- `POST /api/scouting/prospects` - Crea prospect
- `GET /api/scouting/prospects/:id` - Dettaglio prospect
- `PUT /api/scouting/prospects/:id` - Aggiorna prospect
- `DELETE /api/scouting/prospects/:id` - Elimina prospect
- `POST /api/scouting/prospects/:id/promote` - Promuovi a target
- `GET /api/scouting/prospects/:id/events` - Cronologia eventi

### Reports
- `GET /api/scouting/reports` - Lista reports
- `POST /api/scouting/reports` - Crea report
- `GET /api/scouting/reports/:id` - Dettaglio report
- `PUT /api/scouting/reports/:id` - Aggiorna report
- `DELETE /api/scouting/reports/:id` - Elimina report

### Shortlists
- `GET /api/scouting/shortlists` - Lista shortlists
- `POST /api/scouting/shortlists` - Crea shortlist
- `GET /api/scouting/shortlists/:id` - Dettaglio shortlist
- `PUT /api/scouting/shortlists/:id` - Aggiorna shortlist
- `DELETE /api/scouting/shortlists/:id` - Elimina shortlist
- `POST /api/scouting/shortlists/:id/items` - Aggiungi prospect
- `DELETE /api/scouting/shortlists/items/:itemId` - Rimuovi prospect

---

## Role-Based Access Control

Il modulo Scouting richiede uno dei seguenti ruoli:

- `SCOUT` - Può creare/modificare solo i propri dati
- `DIRECTOR_SPORT` - Accesso completo, può promuovere prospects
- `ADMIN` - Accesso completo

### Esempio Header Autenticazione

```
Authorization: Bearer <your-jwt-token>
```

O cookie HttpOnly:

```
Cookie: access_token=<your-jwt-token>
```

---

## Multi-Tenancy

Tutti gli endpoint Scouting sono multi-tenant safe:

- I dati vengono automaticamente filtrati per `teamId`
- Ogni team vede solo i propri prospects, reports e shortlists
- La sicurezza è garantita dal middleware `tenantContext`

---

## Note di Sicurezza

⚠️ **IMPORTANTE**:

1. Non condividere mai `SUPABASE_SERVICE_ROLE_KEY` pubblicamente
2. Cambia `JWT_SECRET` in produzione con un valore sicuro (min 32 caratteri)
3. Usa connessioni SSL/TLS per il database in produzione
4. Abilita CORS solo per domini fidati in produzione

---

**STATUS**: 🟢 Configurazione Completa

