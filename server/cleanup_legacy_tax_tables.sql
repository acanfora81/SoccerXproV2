-- ===============================================================
-- 🧹 CLEANUP TABELLE FISCALI LEGACY
-- Elimina le vecchie tabelle che non servono più
-- ===============================================================

-- Verifica quali tabelle esistono prima di eliminarle
SELECT 
    'TABELLE LEGACY TROVATE' as info,
    table_name,
    'DA ELIMINARE' as azione
FROM information_schema.tables 
WHERE table_schema = 'soccerxpro' 
AND table_name IN (
    'tax_rates',                    -- Vecchia tabella aliquote
    'tax_regional_additional_scheme', -- Vecchia addizionale regionale
    'tax_regional_additional_bracket', -- Vecchi scaglioni regionali
    'tax_municipal_additional_rule',   -- Vecchia regola comunale
    'tax_municipal_additional_bracket', -- Vecchi scaglioni comunali
    'tax_bonus_l207_rule',          -- Vecchia regola L207
    'tax_extra_deduction_rule'      -- Vecchia detrazione extra
)
ORDER BY table_name;

-- ===============================================================
-- 🗑️ ELIMINAZIONE TABELLE LEGACY
-- ===============================================================

-- Elimina le tabelle legacy (in ordine per evitare conflitti di foreign key)
DROP TABLE IF EXISTS soccerxpro.tax_extra_deduction_rule CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_bonus_l207_rule CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_municipal_additional_bracket CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_municipal_additional_rule CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_regional_additional_bracket CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_regional_additional_scheme CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_rates CASCADE;

-- ===============================================================
-- ✅ VERIFICA FINALE
-- ===============================================================

-- Mostra le tabelle fiscali rimaste (solo V2)
SELECT 
    'TABELLE FISCALI V2 RIMASTE' as info,
    table_name,
    'ATTIVA' as stato
FROM information_schema.tables 
WHERE table_schema = 'soccerxpro' 
AND table_name LIKE 'tax_%'
ORDER BY table_name;

-- Conta record nelle tabelle V2
SELECT 
    'tax_rates_v2' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_rates_v2
UNION ALL
SELECT 
    'tax_contribution_profiles' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_contribution_profiles
UNION ALL
SELECT 
    'tax_irpef_bracket' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_irpef_bracket
UNION ALL
SELECT 
    'tax_config' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_config;

-- ===============================================================
-- 🎉 CLEANUP COMPLETATO
-- ===============================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Cleanup tabelle legacy completato!';
    RAISE NOTICE '🗑️ Tabelle eliminate: 7';
    RAISE NOTICE '✅ Solo tabelle V2 rimaste';
    RAISE NOTICE '📊 Sistema fiscale ora pulito e organizzato';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ora puoi procedere con i test V2!';
END $$;