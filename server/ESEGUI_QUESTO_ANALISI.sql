-- ===============================================================
-- 🔍 ANALISI STRUTTURA tax_rates - VERSIONE CORRETTA SNAKE_CASE
-- ===============================================================

-- STEP 1: Analizza la struttura della tabella tax_rates esistente
SELECT 
    'ANALISI STRUTTURA tax_rates' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'soccerxpro' 
AND table_name = 'tax_rates'
ORDER BY ordinal_position;

-- STEP 2: Mostra alcuni record di esempio
SELECT 
    'ESEMPI RECORD tax_rates' as info,
    *
FROM soccerxpro.tax_rates 
LIMIT 3;

-- STEP 3: Conta record esistenti (CORRETTO: usa team_id)
SELECT 
    'CONTO RECORD tax_rates' as info,
    COUNT(*) as total_records,
    COUNT(DISTINCT year) as anni_diversi,
    COUNT(DISTINCT team_id) as team_diversi
FROM soccerxpro.tax_rates;


