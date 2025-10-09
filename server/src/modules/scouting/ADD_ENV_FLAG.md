# ⚙️ CONFIGURAZIONE FEATURE FLAG - SCOUTING MODULE

## 🔧 ISTRUZIONI PER ABILITARE IL MODULO

### **Metodo 1: Manuale (Consigliato)**

1. Apri il file `.env` nella cartella `server/`:
   ```
   C:\Progetti\SoccerXpro_V2\server\.env
   ```

2. Aggiungi questa riga alla sezione "FEATURE FLAGS" (se non esiste, creala):
   ```bash
   # ============================================
   # FEATURE FLAGS
   # ============================================
   FEATURE_MARKET_MODULE=true
   FEATURE_SCOUTING_MODULE=true
   ```

3. Salva il file

4. Riavvia il server Node.js

---

### **Metodo 2: PowerShell (Automatico)**

Esegui questo comando dalla cartella `server/`:

```powershell
# Aggiungi la feature flag se non esiste
$envFile = ".env"
$flag = "FEATURE_SCOUTING_MODULE=true"

if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "FEATURE_SCOUTING_MODULE") {
        Add-Content $envFile "`n# Scouting Module (Enterprise)`n$flag"
        Write-Host "✅ Feature flag aggiunta a .env" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Feature flag già presente in .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ File .env non trovato" -ForegroundColor Red
}
```

---

### **Metodo 3: Copia da .env.backup**

Se il file `.env` non esiste:

```powershell
Copy-Item .env.backup .env
Add-Content .env "`nFEATURE_SCOUTING_MODULE=true"
```

---

## ✅ VERIFICA CONFIGURAZIONE

Dopo aver aggiunto la feature flag, verifica che il server si avvii correttamente:

```bash
cd C:\Progetti\SoccerXpro_V2\server
npm start
```

**Nel log dovresti vedere**:

```
🟢 [INFO] Scouting Module mounted at /api/scouting
```

Se invece vedi:

```
🟡 [WARN] Scouting routes not mounted: Scouting module disabled
```

Significa che la feature flag non è impostata correttamente.

---

## 🧪 TEST ENDPOINT

Una volta abilitato, testa l'endpoint:

```bash
# Health check
curl http://localhost:3001/health

# Test autenticato (richiede token)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/scouting/prospects
```

---

## 📝 NOTA

Il file `.env` contiene informazioni sensibili (chiavi API, segreti) e **NON** deve essere committato su Git.

È già incluso nel `.gitignore` per sicurezza.

---

**STATUS**: 📋 Istruzioni Pronte

