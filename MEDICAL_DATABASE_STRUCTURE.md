# 🏥 Struttura Database Medico - SoccerXpro

## 📋 Panoramica Generale

Il sistema medico di SoccerXpro è progettato per gestire in modo completo e conforme al GDPR tutte le informazioni sanitarie dei giocatori. Il database include due sistemi paralleli:

1. **Sistema Base** (`injuries`, `medical_visits`) - Per gestione semplice
2. **Sistema Avanzato GDPR** (`MedicalCase`, `MedicalDiagnosis`, etc.) - Per gestione completa e crittografata

---

## 🗂️ Tabelle Principali

### 1. **injuries** - Infortuni Base
**Scopo**: Gestione base degli infortuni dei giocatori

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Int | ID univoco |
| `injuryType` | InjuryType | Tipo di infortunio |
| `bodyPart` | BodyPart | Parte del corpo interessata |
| `severity` | InjurySeverity | Gravità dell'infortunio |
| `description` | String | Descrizione dettagliata |
| `injuryDate` | DateTime | Data dell'infortunio |
| `expectedReturn` | DateTime? | Data prevista di ritorno |
| `actualReturn` | DateTime? | Data effettiva di ritorno |
| `status` | InjuryStatus | Stato attuale |
| `diagnosis` | String? | Diagnosi medica |
| `treatment` | String? | Trattamento prescritto |
| `notes` | String? | Note aggiuntive |
| `playerId` | Int | Riferimento al giocatore |
| `createdById` | Int | Chi ha creato il record |
| `teamId` | String | Riferimento al team |

**Relazioni**:
- `players` → Player
- `user_profiles` → UserProfile (createdBy)
- `team` → Team
- `medical_visits[]` → medical_visits

### 2. **medical_visits** - Visite Mediche Base
**Scopo**: Registrazione delle visite mediche

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | Int | ID univoco |
| `visitDate` | DateTime | Data della visita |
| `visitType` | VisitType | Tipo di visita |
| `doctor` | String | Nome del medico |
| `diagnosis` | String? | Diagnosi |
| `treatment` | String? | Trattamento |
| `notes` | String? | Note |
| `followUp` | DateTime? | Prossima visita |
| `playerId` | Int | Riferimento al giocatore |
| `injuryId` | Int? | Riferimento all'infortunio |
| `teamId` | String | Riferimento al team |

**Relazioni**:
- `players` → Player
- `injuries` → injuries (opzionale)
- `team` → Team

---

## 🔐 Sistema Avanzato GDPR

### 3. **MedicalCase** - Casi Medici
**Scopo**: Gestione completa e crittografata dei casi medici

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `teamId` | String | Riferimento al team |
| `playerId` | Int | Riferimento al giocatore |
| `caseNumber` | String | Numero caso univoco |
| `type` | MedicalCaseType | Tipo di caso |
| `status` | String | Stato del caso (default: "OPEN") |
| `onsetDate` | DateTime | Data di insorgenza |
| `isAvailable` | Boolean | Disponibilità per il giocatore |
| `encryptedData` | String | Dati crittografati |
| `encryptionKeyId` | String | ID chiave di crittografia |
| `bodyAreaHash` | String? | Hash area del corpo |
| `severityCategory` | String? | Categoria di gravità |
| `estimatedWeeksOut` | Int? | Settimane fuori stimate |
| `createdById` | Int | Chi ha creato |
| `updatedById` | Int? | Chi ha aggiornato |
| `deletedAt` | DateTime? | Data cancellazione |
| `deletionReason` | String? | Motivo cancellazione |

**Relazioni**:
- `diagnoses[]` → MedicalDiagnosis
- `examinations[]` → MedicalExamination
- `treatments[]` → MedicalTreatment
- `documents[]` → MedicalDocument
- `accessLogs[]` → MedicalAccessLog

### 4. **MedicalDiagnosis** - Diagnosi
**Scopo**: Diagnosi mediche dettagliate

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `caseId` | String | Riferimento al caso |
| `encryptedDiagnosis` | String | Diagnosi crittografata |
| `diagnosisDate` | DateTime | Data diagnosi |
| `isPrimary` | Boolean | Diagnosi primaria |
| `createdById` | Int | Chi ha creato |

### 5. **MedicalExamination** - Esami
**Scopo**: Esami medici e risultati

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `caseId` | String | Riferimento al caso |
| `examType` | ExamType | Tipo di esame |
| `examDate` | DateTime | Data esame |
| `isNormal` | Boolean? | Risultato normale |
| `encryptedResults` | String | Risultati crittografati |
| `encryptedImages` | Json? | Immagini crittografate |
| `facilityName` | String? | Nome struttura |
| `performedById` | Int? | Chi ha eseguito |
| `createdById` | Int | Chi ha creato |

### 6. **MedicalTreatment** - Trattamenti
**Scopo**: Trattamenti medici

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `caseId` | String | Riferimento al caso |
| `treatmentType` | TreatmentType | Tipo trattamento |
| `startDate` | DateTime | Data inizio |
| `endDate` | DateTime? | Data fine |
| `isCompleted` | Boolean | Completato |
| `encryptedDetails` | String | Dettagli crittografati |
| `prescribedById` | Int? | Chi ha prescritto |
| `administeredById` | Int? | Chi ha somministrato |

### 7. **MedicalDocument** - Documenti
**Scopo**: Gestione documenti medici

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `teamId` | String | Riferimento al team |
| `playerId` | Int | Riferimento al giocatore |
| `caseId` | String? | Riferimento al caso |
| `documentType` | String | Tipo documento |
| `title` | String? | Titolo |
| `mimeType` | String | Tipo MIME |
| `sizeBytes` | Int | Dimensione in bytes |
| `encryptedPath` | String | Percorso crittografato |
| `encryptionKeyId` | String | ID chiave crittografia |
| `checksumSHA256` | String | Checksum SHA256 |
| `classification` | DataClassification | Classificazione dati |
| `visibility` | VisibilityLevel | Livello visibilità |
| `retentionUntil` | DateTime | Conservazione fino a |
| `retentionReason` | DataRetentionReason | Motivo conservazione |
| `uploadedById` | Int | Chi ha caricato |
| `accessCount` | Int | Numero accessi |
| `deletedAt` | DateTime? | Data cancellazione |

### 8. **MedicalAccessLog** - Log Accessi
**Scopo**: Tracciamento accessi per GDPR

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `teamId` | String | Riferimento al team |
| `userId` | Int | Utente che accede |
| `resourceType` | String | Tipo risorsa |
| `resourceId` | String | ID risorsa |
| `caseId` | String? | Riferimento al caso |
| `playerId` | Int? | Riferimento al giocatore |
| `action` | AuditAction | Azione eseguita |
| `accessReason` | String? | Motivo accesso |
| `lawfulBasis` | LawfulBasis | Base legale |
| `ipAddressHash` | String? | Hash IP |
| `userAgent` | String? | User agent |
| `sessionId` | String? | ID sessione |
| `isEmergency` | Boolean | Accesso di emergenza |
| `emergencyReason` | String? | Motivo emergenza |
| `wasSuccessful` | Boolean | Accesso riuscito |
| `errorMessage` | String? | Messaggio errore |

### 9. **MedicalConsent** - Consensi GDPR
**Scopo**: Gestione consensi per trattamento dati

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `id` | String | UUID univoco |
| `teamId` | String | Riferimento al team |
| `playerId` | Int | Riferimento al giocatore |
| `consentType` | String | Tipo consenso |
| `purpose` | String | Scopo trattamento |
| `lawfulBasis` | LawfulBasis | Base legale |
| `dataCategories` | Json | Categorie dati |
| `status` | ConsentStatus | Stato consenso |
| `grantedAt` | DateTime? | Data concessione |
| `withdrawnAt` | DateTime? | Data revoca |
| `expiresAt` | DateTime? | Data scadenza |
| `version` | Int | Versione consenso |
| `consentFormText` | String | Testo modulo consenso |
| `signedDocumentPath` | String? | Percorso documento firmato |
| `ipAddress` | String? | IP di firma |
| `userAgent` | String? | User agent |

---

## 📊 Enumerazioni (Enums)

### Infortuni e Corpo Umano
```typescript
enum BodyPart {
  HEAD, NECK, SHOULDER, ARM, ELBOW, WRIST, HAND,
  CHEST, BACK, ABDOMEN, HIP, THIGH, KNEE, SHIN, CALF, ANKLE, FOOT
}

enum InjuryType {
  MUSCLE_STRAIN, LIGAMENT_TEAR, BONE_FRACTURE, CONCUSSION,
  BRUISE, CUT, SPRAIN, OVERUSE, OTHER
}

enum InjurySeverity {
  MINOR, MODERATE, MAJOR, SEVERE
}

enum InjuryStatus {
  ACTIVE, RECOVERING, HEALED, CHRONIC
}

enum MedicalInjurySeverity {
  MINIMAL, MILD, MODERATE, SEVERE, CAREER_ENDING, UNKNOWN
}
```

### Visite e Esami
```typescript
enum VisitType {
  ROUTINE_CHECKUP, INJURY_ASSESSMENT, REHABILITATION,
  FITNESS_TEST, SPECIALIST_CONSULTATION, EMERGENCY
}

enum ExamType {
  MRI, XRAY, ULTRASOUND, CT, PET, BONE_SCAN,
  BLOOD_TEST, URINE_TEST, GENETIC_TEST, ECG, ECHO,
  STRESS_TEST, SPIROMETRY, ORTHO_VISIT, CARDIO_VISIT,
  NEURO_VISIT, PHYSIO_EVAL, DENTAL, VISION, OTHER
}
```

### Trattamenti e Riabilitazione
```typescript
enum TreatmentType {
  PHYSIO, MEDICATION, INJECTION, SURGERY, REST,
  MANUAL_THERAPY, ELECTROTHERAPY, CRYOTHERAPY,
  HYPERBARIC, LASER, PRP, STEM_CELL, TAPING,
  BRACING, CUSTOM_ORTHOTICS, OTHER
}

enum RehabStage {
  ACUTE_PHASE, PROTECTED_MOBILITY, PROGRESSIVE_LOADING,
  SPORT_SPECIFIC, RETURN_TO_PLAY, MAINTENANCE
}
```

### Casi Medici
```typescript
enum MedicalCaseType {
  INJURY, ILLNESS, SURGERY, SCREENING, PREVENTIVE, OTHER
}

enum InjuryMechanism {
  CONTACT, NON_CONTACT, OVERUSE, RECURRENCE, OTHER
}
```

### GDPR e Privacy
```typescript
enum DataClassification {
  PUBLIC, SENSITIVE, HIGHLY_SENSITIVE, SPECIAL_CATEGORY
}

enum VisibilityLevel {
  MEDICAL_ONLY, COACHING_STAFF, PLAYER_ACCESS, TEAM_WIDE
}

enum ConsentStatus {
  NOT_REQUESTED, PENDING, GRANTED, REFUSED, WITHDRAWN, EXPIRED
}

enum LawfulBasis {
  CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS,
  LEGITIMATE_INTEREST, MEDICAL_PURPOSE
}

enum AuditAction {
  CREATE, READ, UPDATE, DELETE, ENCRYPT, DECRYPT,
  ANONYMIZE, EXPORT, CONSENT_GRANT, CONSENT_WITHDRAW,
  ACCESS_REQUEST, ERASURE_REQUEST, EMERGENCY_ACCESS, PRINT, SHARE
}

enum DataRetentionReason {
  ACTIVE_CONTRACT, LEGAL_REQUIREMENT, INSURANCE_CLAIM,
  LITIGATION_HOLD, HISTORICAL_STATISTICS
}
```

---

## 🔗 Relazioni e Integrazioni

### Relazioni con Tabelle Esistenti
- **Player**: Tutti i record medici sono collegati ai giocatori
- **Team**: Isolamento dati per team
- **UserProfile**: Tracciamento di chi crea/modifica i record
- **UserRole**: Controllo accessi basato su ruoli (MEDICAL_STAFF, etc.)

### Flusso di Dati
1. **Infortunio Base** → `injuries` + `medical_visits`
2. **Caso Complesso** → `MedicalCase` + `MedicalDiagnosis` + `MedicalExamination` + `MedicalTreatment`
3. **Documenti** → `MedicalDocument` (collegati ai casi)
4. **Consensi** → `MedicalConsent` (GDPR compliance)
5. **Audit** → `MedicalAccessLog` (tracciamento accessi)

---

## 🛡️ Sicurezza e GDPR

### Crittografia
- **Dati Sensibili**: Crittografati con `encryptedData`
- **Documenti**: Percorsi crittografati con `encryptedPath`
- **Chiavi**: Gestite tramite `encryptionKeyId`

### Controllo Accessi
- **Livelli di Visibilità**: Da solo personale medico a team completo
- **Classificazione Dati**: Da pubblici a categoria speciale
- **Log Accessi**: Tracciamento completo di chi accede a cosa

### Consensi
- **Gestione Consensi**: Versioning e scadenze
- **Base Legale**: Diversi tipi di consenso per diversi scopi
- **Revoca**: Possibilità di revocare consensi

---

## 📈 Possibili Estensioni Future

### Tabelle Aggiuntive
- **MedicalVault**: Vault centralizzato per dati crittografati
- **MedicalVaultAccess**: Accessi al vault
- **AnonymizedMedicalData**: Dati anonimizzati per statistiche

### Funzionalità
- **Dashboard Medica**: Overview infortuni e casi
- **Reportistica**: Statistiche e trend
- **Integrazione Wearables**: Dati da dispositivi
- **AI/ML**: Predizione infortuni e analisi pattern

---

## 🎯 Prossimi Passi per l'Implementazione

1. **Analisi Requisiti**: Definire funzionalità prioritarie
2. **UI/UX Design**: Progettare interfacce per personale medico
3. **API Development**: Creare endpoint per gestione dati medici
4. **Sicurezza**: Implementare crittografia e controllo accessi
5. **Testing**: Test completi per compliance GDPR
6. **Training**: Formazione personale medico sull'uso del sistema

---

*Documento creato il: $(date)*
*Versione Database: v1.0*
*Schema: soccerxpro*
