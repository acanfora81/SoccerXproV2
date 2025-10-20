-- ===============================================================
-- 🏗️ AGGIUNTA COLONNA prospect_team_side A scout_sessions
-- ===============================================================

-- Aggiungi la colonna prospect_team_side alla tabella scout_sessions
ALTER TABLE soccerxpro.scout_sessions 
ADD COLUMN IF NOT EXISTS prospect_team_side TEXT DEFAULT 'HOME';

-- Aggiungi un commento per documentare la colonna
COMMENT ON COLUMN soccerxpro.scout_sessions.prospect_team_side IS 'Indica se il prospect gioca per la squadra di casa (HOME) o in trasferta (AWAY)';

-- ===============================================================
-- 📝 LOG DELLA MODIFICA
-- ===============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Colonna prospect_team_side aggiunta con successo alla tabella scout_sessions!';
    RAISE NOTICE '📊 Valore di default: HOME';
    RAISE NOTICE '🔒 Commento aggiunto per documentazione';
END $$;


