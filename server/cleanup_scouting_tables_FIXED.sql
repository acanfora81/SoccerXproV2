-- ===============================================================
-- 🗑️ SCRIPT DI PULIZIA TABELLE SCOUTING ESISTENTI (CORRETTO)
-- ===============================================================
-- 
-- Questo script rimuove tutte le tabelle scouting esistenti
-- per permettere la ricostruzione con il nuovo schema scout_*
-- 
-- ATTENZIONE: Questo script elimina TUTTI i dati scouting esistenti!
-- Eseguire solo se si è sicuri di voler ricominciare da zero.
-- ===============================================================

-- Disabilita temporaneamente i trigger per evitare errori di foreign key
SET session_replication_role = replica;

-- ===============================================================
-- 🗑️ RIMOZIONE TABELLE SCOUTING ESISTENTI (in ordine di dipendenze)
-- ===============================================================

-- Tabelle del modulo scouting esistente (se presenti)
DROP TABLE IF EXISTS scouting_shortlist_items CASCADE;
DROP TABLE IF EXISTS scouting_shortlists CASCADE;
DROP TABLE IF EXISTS scouting_event_logs CASCADE;
DROP TABLE IF EXISTS scouting_reports CASCADE;
DROP TABLE IF EXISTS scouting_prospects CASCADE;

-- Tabelle scouting legacy (schema v1) - NOMI CORRETTI
DROP TABLE IF EXISTS scouting_tag_links CASCADE;
DROP TABLE IF EXISTS scouting_tags CASCADE;
DROP TABLE IF EXISTS scouting_scout_regions CASCADE;
DROP TABLE IF EXISTS scouting_regions CASCADE;
DROP TABLE IF EXISTS scouting_reviews CASCADE;
DROP TABLE IF EXISTS scouting_media CASCADE;
DROP TABLE IF EXISTS scouting_followups CASCADE;
DROP TABLE IF EXISTS scouting_assignments CASCADE;
DROP TABLE IF EXISTS scouting_report_scores CASCADE;
DROP TABLE IF EXISTS scouting_reports CASCADE;
DROP TABLE IF EXISTS scouting_sessions CASCADE;
DROP TABLE IF EXISTS scouting_matches CASCADE;
DROP TABLE IF EXISTS scouting_rubric_criteria CASCADE;
DROP TABLE IF EXISTS scouting_rubrics CASCADE;
DROP TABLE IF EXISTS scouting_scouts CASCADE;

-- ===============================================================
-- 🧹 PULIZIA ENUM E TIPI PERSONALIZZATI (se esistono)
-- ===============================================================

-- Rimuovi enum scouting se esistono (PostgreSQL)
DROP TYPE IF EXISTS scouting_status CASCADE;
DROP TYPE IF EXISTS observation_type CASCADE;
DROP TYPE IF EXISTS contract_type CASCADE;
DROP TYPE IF EXISTS preferred_foot CASCADE;
DROP TYPE IF EXISTS recommendation CASCADE;
DROP TYPE IF EXISTS watchlist_status CASCADE;

-- ===============================================================
-- 🔄 RIABILITA I TRIGGER
-- ===============================================================

SET session_replication_role = DEFAULT;

-- ===============================================================
-- ✅ VERIFICA PULIZIA COMPLETATA
-- ===============================================================

-- Mostra le tabelle rimanenti che contengono 'scout' nel nome
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename LIKE '%scout%' 
   OR tablename LIKE '%scouting%'
ORDER BY tablename;

-- Mostra i tipi rimanenti che contengono 'scout' nel nome
SELECT 
    typname,
    typtype
FROM pg_type 
WHERE typname LIKE '%scout%' 
   OR typname LIKE '%scouting%'
ORDER BY typname;

-- ===============================================================
-- 📝 LOG DELLA PULIZIA
-- ===============================================================

-- Crea una tabella temporanea per loggare la pulizia
CREATE TEMP TABLE cleanup_log (
    action TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

INSERT INTO cleanup_log (action) VALUES 
('Scouting tables cleanup completed'),
('Ready for new scout_* schema implementation');

SELECT * FROM cleanup_log;

-- ===============================================================
-- 🎯 PROSSIMI PASSI
-- ===============================================================
-- 
-- 1. Eseguire questo script in Supabase SQL Editor
-- 2. Aggiornare schema.prisma con le nuove tabelle scout_*
-- 3. Eseguire: npx prisma generate
-- 4. Eseguire: npx prisma db push
-- 5. Aggiornare il codice backend e frontend
-- 
-- ===============================================================


