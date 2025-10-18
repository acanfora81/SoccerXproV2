-- ===============================================================
-- 🧹 CLEANUP OBSOLETE TAX TABLES - Supabase Migration
-- ===============================================================
-- 
-- Questo script rimuove le tabelle fiscali obsolete che sono state
-- sostituite dalle nuove tabelle multitenant:
-- 
-- RIMOSSE:
-- - tax_municipal_additional → sostituita da tax_municipal_additional_rule
-- - tax_regional_additional → sostituita da tax_regional_additional_scheme
--
-- AUTORE: Alessandro Canfora
-- DATA: 2025-01-27
-- VERSIONE: 1.0
-- ===============================================================

-- Verifica che le tabelle esistano prima di rimuoverle
DO $$
BEGIN
    -- Rimuovi tax_municipal_additional se esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'soccerxpro' 
               AND table_name = 'tax_municipal_additional') THEN
        
        RAISE NOTICE '🗑️ Rimuovendo tabella tax_municipal_additional...';
        
        -- Rimuovi eventuali foreign key constraints
        ALTER TABLE soccerxpro.tax_municipal_additional 
        DROP CONSTRAINT IF EXISTS fk_tax_municipal_additional_team;
        
        -- Rimuovi eventuali indici
        DROP INDEX IF EXISTS soccerxpro.idx_tax_municipal_additional_team_year;
        DROP INDEX IF EXISTS soccerxpro.idx_tax_municipal_additional_lookup;
        
        -- Rimuovi eventuali constraint unique
        ALTER TABLE soccerxpro.tax_municipal_additional 
        DROP CONSTRAINT IF EXISTS uq_tax_municipal_additional_team_year_region_municipality;
        
        -- Rimuovi la tabella
        DROP TABLE soccerxpro.tax_municipal_additional;
        
        RAISE NOTICE '✅ Tabella tax_municipal_additional rimossa con successo';
    ELSE
        RAISE NOTICE 'ℹ️ Tabella tax_municipal_additional non esiste, saltando...';
    END IF;

    -- Rimuovi tax_regional_additional se esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'soccerxpro' 
               AND table_name = 'tax_regional_additional') THEN
        
        RAISE NOTICE '🗑️ Rimuovendo tabella tax_regional_additional...';
        
        -- Rimuovi eventuali foreign key constraints
        ALTER TABLE soccerxpro.tax_regional_additional 
        DROP CONSTRAINT IF EXISTS fk_tax_regional_additional_team;
        
        -- Rimuovi eventuali indici
        DROP INDEX IF EXISTS soccerxpro.idx_tax_regional_additional_team_year;
        DROP INDEX IF EXISTS soccerxpro.idx_tax_regional_additional_lookup;
        
        -- Rimuovi eventuali constraint unique
        ALTER TABLE soccerxpro.tax_regional_additional 
        DROP CONSTRAINT IF EXISTS uq_tax_regional_additional_team_year_region;
        
        -- Rimuovi la tabella
        DROP TABLE soccerxpro.tax_regional_additional;
        
        RAISE NOTICE '✅ Tabella tax_regional_additional rimossa con successo';
    ELSE
        RAISE NOTICE 'ℹ️ Tabella tax_regional_additional non esiste, saltando...';
    END IF;

    RAISE NOTICE '🎉 Cleanup tabelle obsolete completato!';
    RAISE NOTICE '📋 Tabelle fiscali attive:';
    RAISE NOTICE '   ✅ tax_config (multitenant)';
    RAISE NOTICE '   ✅ tax_irpef_bracket (multitenant)';
    RAISE NOTICE '   ✅ tax_municipal_additional_rule (multitenant)';
    RAISE NOTICE '   ✅ tax_municipal_additional_bracket (multitenant)';
    RAISE NOTICE '   ✅ tax_regional_additional_scheme (multitenant)';
    RAISE NOTICE '   ✅ tax_regional_additional_bracket (multitenant)';
    RAISE NOTICE '   ✅ tax_extra_deduction_rule (multitenant)';
    RAISE NOTICE '   ✅ tax_bonus_l207_rule (multitenant)';
    RAISE NOTICE '   ✅ tax_rates (multitenant)';
    RAISE NOTICE '   ✅ bonus_tax_rates (multitenant)';

END $$;

-- ===============================================================
-- VERIFICA FINALE
-- ===============================================================

-- Mostra le tabelle fiscali rimanenti
SELECT 
    table_name as "Tabella Fiscale",
    CASE 
        WHEN table_name LIKE '%tax_%' OR table_name LIKE '%bonus_%' 
        THEN '✅ Attiva'
        ELSE '❓ Altro'
    END as "Stato"
FROM information_schema.tables 
WHERE table_schema = 'soccerxpro' 
AND (table_name LIKE '%tax_%' OR table_name LIKE '%bonus_%')
ORDER BY table_name;

-- ===============================================================
-- NOTE POST-MIGRAZIONE
-- ===============================================================
-- 
-- 1. ✅ Le tabelle obsolete sono state rimosse
-- 2. ✅ Tutte le tabelle fiscali attive sono multitenant (teamId)
-- 3. ✅ Il codice è stato aggiornato per usare le nuove tabelle
-- 4. ✅ Gli upload CSV ora usano le tabelle corrette
-- 5. ✅ I calcoli fiscali sono tenant-scoped
-- 
-- PROSSIMI PASSI:
-- - Testare l'inserimento di scaglioni IRPEF per un team
-- - Verificare che i calcoli fiscali usino i dati del team corretto
-- - Eventualmente estendere il multitenancy ad altre sezioni
-- ===============================================================











