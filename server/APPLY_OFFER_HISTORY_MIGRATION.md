# Migrazione Cronologia Offerte

## 🎯 **Obiettivo**
Aggiungere campi per tracciare la prima offerta nelle trattative, permettendo di vedere l'evoluzione delle negoziazioni.

## 📋 **Passi da Seguire**

### 1. **Eseguire la Migrazione del Database**
```sql
-- Eseguire questo script in Supabase SQL Editor
-- File: server/add_offer_history_fields.sql

ALTER TABLE soccerxpro.market_negotiations 
ADD COLUMN first_offer_fee DECIMAL(12,2),
ADD COLUMN first_offer_salary_net DECIMAL(12,2),
ADD COLUMN first_offer_salary_gross DECIMAL(12,2),
ADD COLUMN first_offer_salary_company DECIMAL(12,2);

-- Aggiungi commenti per chiarezza
COMMENT ON COLUMN soccerxpro.market_negotiations.first_offer_fee IS 'Prima offerta di trasferimento';
COMMENT ON COLUMN soccerxpro.market_negotiations.first_offer_salary_net IS 'Prima offerta stipendio netto';
COMMENT ON COLUMN soccerxpro.market_negotiations.first_offer_salary_gross IS 'Prima offerta stipendio lordo';
COMMENT ON COLUMN soccerxpro.market_negotiations.first_offer_salary_company IS 'Prima offerta costo aziendale';
```

### 2. **Verificare l'Applicazione**
Dopo aver eseguito la migrazione:

1. **Riavviare il server** per assicurarsi che Prisma riconosca i nuovi campi
2. **Testare la creazione** di una nuova trattativa in fase "Offerta Inviata"
3. **Testare l'aggiornamento** di una trattativa da "Contatto" a "Offerta Inviata"
4. **Verificare nel Kanban** che le informazioni della prima offerta vengano mostrate correttamente

## 🎮 **Comportamento Atteso**

### **Fase "Offerta Inviata"**
- ✅ Mostra "Prima offerta - Trasferimento: X €"
- ✅ Mostra "Prima offerta - Stipendio: Y €/anno"

### **Fase "Controfferta"**
- ✅ Mostra "Prima offerta - Trasferimento: X €" (sbiadito)
- ✅ Mostra "Controfferta - Trasferimento: Z €" (evidenziato)
- ✅ Mostra "Prima offerta - Stipendio: Y €/anno" (sbiadito)
- ✅ Mostra "Controfferta - Stipendio: W €/anno" (evidenziato)

### **Fase "Accordo"**
- ✅ Mostra "Prima offerta - Trasferimento: X €" (sbiadito)
- ✅ Mostra "Accordo finale - Trasferimento: V €" (evidenziato)
- ✅ Mostra "Prima offerta - Stipendio: Y €/anno" (sbiadito)
- ✅ Mostra "Accordo finale - Stipendio: U €/anno" (evidenziato)

## 🔧 **Modifiche Implementate**

### **Frontend (NegotiationsKanbanPage.jsx)**
- ✅ Aggiunta logica per mostrare prima offerta vs offerta corrente
- ✅ Stili distintivi per prima offerta (sbiadito) vs offerta corrente (evidenziato)
- ✅ Fallback ai campi esistenti se i nuovi campi non sono ancora popolati

### **Backend (negotiationsService.js)**
- ✅ **Funzione `create`**: Salva automaticamente la prima offerta quando `stage === 'OFFER_SENT'`
- ✅ **Funzione `update`**: Salva la prima offerta quando si passa a `OFFER_SENT` e non esiste già

## ⚠️ **Note Importanti**

1. **Retrocompatibilità**: Il sistema funziona anche con trattative esistenti che non hanno i nuovi campi
2. **Fallback**: Se `first_offer_*` è null, usa `requested_*` come fallback
3. **Una sola volta**: La prima offerta viene salvata solo una volta, quando si passa a `OFFER_SENT`
4. **Non sovrascrive**: I campi `first_offer_*` non vengono mai sovrascritti dopo la prima volta

## 🧪 **Test Consigliati**

1. **Creare nuova trattativa** direttamente in "Offerta Inviata"
2. **Aggiornare trattativa** da "Contatto" a "Offerta Inviata"
3. **Verificare cronologia** nelle fasi successive
4. **Controllare retrocompatibilità** con trattative esistenti

