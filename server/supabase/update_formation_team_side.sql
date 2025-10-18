-- ===============================================================
-- 🏗️ AGGIORNAMENTO team_side IN scout_formations
-- ===============================================================

-- Aggiorna i valori esistenti da HOME/AWAY a PROSPECT/OPPONENT
-- Assumiamo che HOME = PROSPECT e AWAY = OPPONENT per i dati esistenti
UPDATE soccerxpro.scout_formations 
SET team_side = 'PROSPECT' 
WHERE team_side = 'HOME';

UPDATE soccerxpro.scout_formations 
SET team_side = 'OPPONENT' 
WHERE team_side = 'AWAY';

-- Aggiorna il valore di default della colonna
ALTER TABLE soccerxpro.scout_formations 
ALTER COLUMN team_side SET DEFAULT 'PROSPECT';

-- Aggiungi un commento per documentare i nuovi valori
COMMENT ON COLUMN soccerxpro.scout_formations.team_side IS 'Indica se la formazione è del prospect osservato (PROSPECT) o della squadra avversaria (OPPONENT)';

-- ===============================================================
-- 📝 LOG DELLA MODIFICA
-- ===============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Valori team_side aggiornati con successo!';
    RAISE NOTICE '📊 HOME → PROSPECT';
    RAISE NOTICE '📊 AWAY → OPPONENT';
    RAISE NOTICE '🔒 Valore di default aggiornato a PROSPECT';
    RAISE NOTICE '📝 Commento aggiunto per documentazione';
END $$;

