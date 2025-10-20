-- =============================================
-- 🔧 FIX: Aggiungi colonna agentId a market_targets
-- =============================================
-- Questo script aggiunge la colonna agentId mancante
-- nella tabella market_targets per sincronizzare
-- lo schema del database con quello Prisma

-- Aggiungi la colonna agentId
ALTER TABLE soccerxpro.market_targets 
ADD COLUMN IF NOT EXISTS "agentId" INTEGER;

-- Aggiungi la foreign key constraint (solo se non esiste già)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'market_targets_agentId_fkey' 
        AND table_schema = 'soccerxpro' 
        AND table_name = 'market_targets'
    ) THEN
        ALTER TABLE soccerxpro.market_targets 
        ADD CONSTRAINT "market_targets_agentId_fkey" 
        FOREIGN KEY ("agentId") REFERENCES soccerxpro.market_agents(id);
    END IF;
END $$;

-- Aggiungi un indice per migliorare le performance
CREATE INDEX IF NOT EXISTS "market_targets_agentId_idx" 
ON soccerxpro.market_targets("agentId");

-- Verifica che la colonna sia stata aggiunta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'soccerxpro' 
  AND table_name = 'market_targets' 
  AND column_name = 'agentId';
