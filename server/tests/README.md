# 🧪 Test Files - SoccerXpro V2

Questa cartella contiene tutti i file di test e debug creati durante lo sviluppo.

## 📁 Struttura

```
tests/
├── README.md                    # Questo file
├── database/                    # Test connessione database
│   ├── test-db-connection.js
│   ├── test-direct-url.js
│   └── test-database-team.js
├── auth/                        # Test autenticazione
│   ├── test-supabase.js
│   ├── test-register-simple.js
│   └── debug-register.js
├── endpoints/                   # Test endpoint API
│   └── test-endpoint.js
├── calculations/                # Test calcoli fiscali
│   ├── test_12500_calculation.js
│   ├── test_calculation_35k.js
│   └── test_multiple_calculations.js
└── utils/                       # Test utility
    └── prisma-test.js
```

## 🚀 Come usare

1. **Test Database:** `node tests/database/test-db-connection.js`
2. **Test Auth:** `node tests/auth/test-supabase.js`
3. **Test Endpoint:** `node tests/endpoints/test-endpoint.js`

## ⚠️ Note

- Questi file sono per **sviluppo e debug**
- **NON** includere in produzione
- Alcuni file potrebbero contenere credenziali di test


