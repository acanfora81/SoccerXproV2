-- Aggiornamento aliquote fiscali 2025 per il calcio
-- Risolve il problema del netto troppo basso

-- Aggiorna aliquote PROFESSIONAL (contratti professionali)
UPDATE tax_rates 
SET 
  inps = 9.19,   -- Solo parte a carico lavoratore (era 29.58)
  inail = 0.5,   -- INAIL ridotto per calcio (era 7.9)
  ffc = 6.25,    -- FFC rimane invariato
  updated_at = NOW()
WHERE type = 'PROFESSIONAL';

-- Aggiorna aliquote APPRENTICESHIP (apprendistato)
UPDATE tax_rates 
SET 
  inps = 5.84,   -- Apprendistato ridotto (era 11.61)
  inail = 0,     -- Rimane 0
  ffc = 6.25,    -- FFC rimane invariato
  updated_at = NOW()
WHERE type = 'APPRENTICESHIP';

-- Aggiorna aliquote AMATEUR (dilettanti)
UPDATE tax_rates 
SET 
  inps = 0,      -- Dilettanti non pagano INPS
  inail = 0,     -- Dilettanti non pagano INAIL
  ffc = 6.25,    -- Solo FFC
  updated_at = NOW()
WHERE type = 'AMATEUR';

-- Verifica risultati
SELECT 
  type,
  inps,
  inail,
  ffc,
  (inps + COALESCE(inail, 0) + ffc) as totale_aliquote,
  updated_at
FROM tax_rates 
ORDER BY type, year DESC;

-- Esempio calcolo con nuove aliquote:
-- Lordo: 12.500€
-- PROFESSIONAL: INPS 9.19% + INAIL 0.5% + FFC 6.25% = 15.94% totale
-- Contributi: 12.500 × 15.94% = 1.992,50€
-- NETTO: 12.500 - 1.992,50 = 10.507,50€ ✅ MOLTO PIÙ RAGIONEVOLE!



