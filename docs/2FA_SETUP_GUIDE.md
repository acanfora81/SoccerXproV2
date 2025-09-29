# Guida Configurazione Autenticazione a Due Fattori (2FA/TOTP)

## Panoramica

L'autenticazione a due fattori (2FA) aggiunge un livello di sicurezza extra al tuo account Soccer X Pro. Utilizza il protocollo TOTP (Time-based One-Time Password) per generare codici temporanei che cambiano ogni 30 secondi.

## Prerequisiti

- **App Authenticator** installata sul tuo smartphone:
  - Google Authenticator (Android/iOS)
  - Microsoft Authenticator (Android/iOS)
  - Authy (Android/iOS)
  - 1Password (a pagamento)
  - Altri app compatibili TOTP

## Configurazione Iniziale

### 1. Accesso alla Pagina 2FA

1. Accedi a Soccer X Pro con le tue credenziali
2. Nel menu laterale, clicca su **"Sicurezza 2FA"**
3. Vedrai lo stato attuale: "Autenticazione a Due Fattori Non Configurata"

### 2. Avvio Configurazione

1. Clicca sul pulsante **"Configura 2FA"**
2. Si aprirà la modale di configurazione

### 3. Scansione QR Code

1. **Apri la tua app authenticator** sul telefono
2. **Aggiungi un nuovo account** (solitamente "+" o "Aggiungi")
3. **Scansiona il QR code** mostrato nella modale
4. L'app genererà automaticamente il nome account "Soccer X Pro"

#### Setup Manuale (se non riesci a scansionare)

Se hai problemi con la fotocamera:

1. Nella tua app authenticator, scegli **"Inserimento manuale"**
2. **Nome account**: Soccer X Pro
3. **Chiave segreta**: copia il codice alfanumerico mostrato sotto il QR
4. **Tipo**: Time-based (TOTP)
5. **Cifre**: 6
6. **Periodo**: 30 secondi

### 4. Verifica Configurazione

1. Clicca **"Ho configurato l'app →"**
2. Inserisci il **codice a 6 cifre** mostrato dalla tua app
3. Clicca **"Verifica Codice"**

### 5. Salvataggio Codici di Backup

⚠️ **IMPORTANTE**: Salva i codici di backup in un posto sicuro!

1. Copia tutti i codici mostrati (8-10 codici)
2. Salvali in un gestore password o file sicuro
3. **Non condividerli** e **non perderli**
4. Clicca **"Completa"**

## Utilizzo Quotidiano

### Accesso Normale
Il 2FA **non influisce** sull'accesso quotidiano a Soccer X Pro.

### Operazioni Sensibili
Per alcune operazioni critiche (es. creazione infortuni), il sistema richiederà il codice 2FA:

1. Comparirà automaticamente una **mini-modale**
2. Inserisci il **codice a 6 cifre** dalla tua app
3. L'operazione verrà completata dopo la verifica

## Gestione 2FA

### Visualizzazione Stato
- Vai su **"Sicurezza 2FA"** per vedere lo stato attuale
- Indica se il 2FA è attivo o meno

### Generazione Nuovi Codici Backup
1. Nella pagina Sicurezza 2FA, clicca **"Genera Nuovi Codici Backup"**
2. Inserisci il codice dalla tua app per conferma
3. Salva i nuovi codici (quelli vecchi non funzioneranno più)

### Disabilitazione 2FA
⚠️ **Attenzione**: Riduce la sicurezza del tuo account

1. Nella pagina Sicurezza 2FA, clicca **"Disabilita 2FA"**
2. Inserisci il codice dalla tua app per conferma
3. Il 2FA verrà disattivato

## Risoluzione Problemi

### Ho perso il telefono
1. Usa uno dei **codici di backup** salvati
2. Accedi alla pagina Sicurezza 2FA
3. **Disabilita** il 2FA e **riconfiguralo** sul nuovo dispositivo

### App non funziona
1. Verifica che l'**orario** del telefono sia corretto
2. Prova a **resincronizzare** l'app authenticator
3. Usa un **codice di backup** se necessario

### Codici non accettati
- Assicurati di inserire il codice **entro 30 secondi** dalla generazione
- Verifica che l'**orario** del dispositivo sia sincronizzato
- Prova con il **codice successivo** (aspetta che cambi)

### Codici di backup finiti
Se hai esaurito i codici di backup:

1. **Contatta l'amministratore** del sistema
2. **Non tentare** di disabilitare manualmente il 2FA
3. Fornisci **username** e **dettagli** del problema

## Sicurezza e Best Practices

### ✅ Raccomandazioni
- **Salva i codici backup** in un luogo sicuro e offline
- **Non condividere** mai i codici con altri
- **Sincronizza** regolarmente l'orario del dispositivo
- **Usa un'app** dedicata (non SMS o email)

### ❌ Evita
- Fare screenshot dei QR code
- Condividere la chiave segreta
- Usare la stessa app per più account critici senza backup
- Ignorare i codici di backup

### 🔄 Manutenzione
- **Testa periodicamente** un codice di backup
- **Rigenera i codici** ogni 6-12 mesi
- **Aggiorna** l'app authenticator regolarmente

## Supporto Tecnico

Per problemi tecnici:

1. **Verifica** che il browser supporti la funzionalità
2. **Controlla** la connessione internet
3. **Contatta** l'amministratore con:
   - Username
   - Descrizione del problema
   - Screenshot (se possibile, **senza codici sensibili**)

---

*Ultima modifica: [Data corrente]*
*Versione: 1.0*
