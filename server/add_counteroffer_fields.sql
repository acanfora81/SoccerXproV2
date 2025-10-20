-- Aggiungi colonne per tracciare l'ultima controfferta
DO $$
BEGIN
  -- last_counteroffer_fee
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'soccerxpro'
      AND table_name   = 'market_negotiations'
      AND column_name  = 'last_counteroffer_fee'
  ) THEN
    ALTER TABLE soccerxpro.market_negotiations
      ADD COLUMN last_counteroffer_fee DECIMAL(12,2);
    COMMENT ON COLUMN soccerxpro.market_negotiations.last_counteroffer_fee
      IS 'Ultima controfferta di trasferimento';
  END IF;

  -- last_counteroffer_salary_net
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'soccerxpro'
      AND table_name   = 'market_negotiations'
      AND column_name  = 'last_counteroffer_salary_net'
  ) THEN
    ALTER TABLE soccerxpro.market_negotiations
      ADD COLUMN last_counteroffer_salary_net DECIMAL(12,2);
    COMMENT ON COLUMN soccerxpro.market_negotiations.last_counteroffer_salary_net
      IS 'Ultima controfferta stipendio netto';
  END IF;

  -- last_counteroffer_salary_gross
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'soccerxpro'
      AND table_name   = 'market_negotiations'
      AND column_name  = 'last_counteroffer_salary_gross'
  ) THEN
    ALTER TABLE soccerxpro.market_negotiations
      ADD COLUMN last_counteroffer_salary_gross DECIMAL(12,2);
    COMMENT ON COLUMN soccerxpro.market_negotiations.last_counteroffer_salary_gross
      IS 'Ultima controfferta stipendio lordo';
  END IF;

  -- last_counteroffer_salary_company
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'soccerxpro'
      AND table_name   = 'market_negotiations'
      AND column_name  = 'last_counteroffer_salary_company'
  ) THEN
    ALTER TABLE soccerxpro.market_negotiations
      ADD COLUMN last_counteroffer_salary_company DECIMAL(12,2);
    COMMENT ON COLUMN soccerxpro.market_negotiations.last_counteroffer_salary_company
      IS 'Ultima controfferta costo aziendale';
  END IF;
END
$$ LANGUAGE plpgsql;

-- Verifica risultato
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'soccerxpro'
  AND table_name   = 'market_negotiations'
  AND column_name IN (
    'first_offer_fee',
    'first_offer_salary_net',
    'first_offer_salary_gross',
    'first_offer_salary_company',
    'last_counteroffer_fee',
    'last_counteroffer_salary_net',
    'last_counteroffer_salary_gross',
    'last_counteroffer_salary_company'
  )
ORDER BY column_name;
