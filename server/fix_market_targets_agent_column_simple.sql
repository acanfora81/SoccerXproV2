-- =============================================
-- 🔧 FIX SEMPLICE: Aggiungi colonna agentId a market_targets
-- =============================================
-- Versione semplificata senza controlli complessi

-- 1. Aggiungi la colonna agentId
ALTER TABLE soccerxpro.market_targets 
ADD COLUMN "agentId" INTEGER;

-- 2. Aggiungi la foreign key constraint
ALTER TABLE soccerxpro.market_targets 
ADD CONSTRAINT "market_targets_agentId_fkey" 
FOREIGN KEY ("agentId") REFERENCES soccerxpro.market_agents(id);

-- 3. Aggiungi un indice per migliorare le performance
CREATE INDEX "market_targets_agentId_idx" 
ON soccerxpro.market_targets("agentId");

-- 4. Verifica che la colonna sia stata aggiunta
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'soccerxpro' 
  AND table_name = 'market_targets' 
  AND column_name = 'agentId';


