# 📋 MODULO PLAYERS - API ROUTES

**Data**: 09/10/2025  
**Progetto**: Soccer X Pro Suite  
**Modulo**: Players Management

---

## 🎯 OVERVIEW

Il modulo **Players** gestisce tutte le operazioni relative ai giocatori, incluse:
- Anagrafica e dati base
- Caricamento dati (upload)
- Note e osservazioni
- Media e documenti

---

## 📁 STRUTTURA ROUTES

```
routes/players/
├── index.js          # Router principale (aggrega tutte le sotto-rotte)
├── players.js        # CRUD base giocatori
├── playersUpload.js  # Upload dati giocatori (CSV, Excel, etc.)
├── notes.js          # Gestione note e osservazioni
└── media.js          # Gestione media e documenti
```

---

## 🔗 ENDPOINTS

### Base Players (`/api/players`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| GET | `/` | Lista giocatori | ✅ |
| GET | `/:id` | Dettagli giocatore | ✅ |
| POST | `/` | Crea giocatore | ✅ |
| PUT | `/:id` | Aggiorna giocatore | ✅ |
| DELETE | `/:id` | Elimina giocatore | ✅ |

### Upload (`/api/players/upload`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/csv` | Upload CSV | ✅ |
| POST | `/excel` | Upload Excel | ✅ |

### Notes (`/api/players/notes`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/:playerId` | Crea nota per giocatore | ✅ |
| GET | `/:playerId` | Ottieni tutte le note | ✅ |

### Media (`/api/players/media`)

| Metodo | Endpoint | Descrizione | Auth |
|--------|----------|-------------|------|
| POST | `/:playerId` | Carica media per giocatore | ✅ |
| GET | `/:playerId` | Ottieni tutti i media | ✅ |

---

## 📦 CONTROLLERS

```
controllers/
├── playersController.js       # Controller CRUD base
├── playersNotesController.js  # Controller note
└── playersMediaController.js  # Controller media
```

---

## 🔧 SERVICES

```
services/
├── playersService.js          # Business logic giocatori
├── playersNotesService.js     # Business logic note
└── playersMediaService.js     # Business logic media
```

---

## ✅ VALIDATORS

```
validation/
├── playersValidator.js        # Validazione dati giocatori
├── playersNotesValidator.js   # Validazione note
└── playersMediaValidator.js   # Validazione media
```

---

## 📝 ESEMPI

### Creare una nota per un giocatore

```javascript
POST /api/players/notes/123

{
  "content": "Giocatore con ottime capacità tecniche",
  "type": "TECHNICAL",
  "visibility": "TEAM"
}
```

### Caricare un media per un giocatore

```javascript
POST /api/players/media/123

{
  "type": "VIDEO",
  "url": "https://example.com/video.mp4",
  "title": "Highlights stagione 2024/25",
  "description": "Compilation gol e assist"
}
```

---

## 🔒 PERMESSI

Tutti gli endpoint richiedono autenticazione tramite middleware `authenticate`.

I permessi specifici dipendono dal ruolo dell'utente:
- **ADMIN**: Accesso completo
- **DIRECTOR_SPORT**: Gestione completa giocatori
- **SCOUT**: Visualizzazione e note
- **SECRETARY**: Visualizzazione limitata

---

## 🚀 TODO

- [ ] Implementare modelli Prisma per `player_notes` e `player_media`
- [ ] Aggiungere paginazione alle liste
- [ ] Implementare filtri avanzati
- [ ] Aggiungere export dati (PDF, Excel)
- [ ] Implementare caricamento file real (S3/Cloudinary)
- [ ] Aggiungere notifiche per nuove note
- [ ] Implementare log attività

---

**📅 Creato**: 09/10/2025  
**✍️ Autore**: Alessandro Canfora  
**🎯 Status**: ✅ **STRUTTURA COMPLETATA**

