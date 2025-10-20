-- Aggiungi campi per tracciare la prima offerta
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

