-- Script per migrare i dati esistenti dalle colonne vecchie a quelle nuove
-- PRIMA di eseguire la migrazione Prisma

-- Step 1: Aggiungi le nuove colonne temporaneamente
ALTER TABLE tax_rates 
ADD COLUMN inps_worker_temp DECIMAL(5,2),
ADD COLUMN inps_employer_temp DECIMAL(5,2),
ADD COLUMN inail_employer_temp DECIMAL(5,2),
ADD COLUMN ffc_worker_temp DECIMAL(5,2),
ADD COLUMN ffc_employer_temp DECIMAL(5,2),
ADD COLUMN solidarity_worker_temp DECIMAL(5,2),
ADD COLUMN solidarity_employer_temp DECIMAL(5,2);

-- Step 2: Migra i dati esistenti
UPDATE tax_rates 
SET 
  -- I valori attuali 'inps' diventano quota lavoratore
  inps_worker_temp = inps,
  -- Aggiunge quota datore standard per tipo contratto
  inps_employer_temp = CASE 
    WHEN type = 'PROFESSIONAL' THEN 30.0
    WHEN type = 'APPRENTICESHIP' THEN 15.0
    ELSE 10.0
  END,
  -- INAIL solo a carico datore
  inail_employer_temp = CASE 
    WHEN type = 'PROFESSIONAL' THEN 1.5
    WHEN type = 'APPRENTICESHIP' THEN 0.8
    ELSE 1.0
  END,
  -- FFC attuale diventa quota lavoratore
  ffc_worker_temp = ffc,
  ffc_employer_temp = 0,
  -- Solidarietà solo società
  solidarity_worker_temp = 0,
  solidarity_employer_temp = 0.5;

-- Step 3: Verifica i dati migrati
SELECT 
  id,
  year,
  type,
  inps as old_inps,
  inps_worker_temp as new_inps_worker,
  inps_employer_temp as new_inps_employer,
  inail as old_inail,
  inail_employer_temp as new_inail_employer,
  ffc as old_ffc,
  ffc_worker_temp as new_ffc_worker,
  ffc_employer_temp as new_ffc_employer
FROM tax_rates;

-- Step 4: Rinomina le colonne temporanee (dopo aver verificato)
-- ALTER TABLE tax_rates RENAME COLUMN inps_worker_temp TO "inpsWorker";
-- ALTER TABLE tax_rates RENAME COLUMN inps_employer_temp TO "inpsEmployer";
-- ALTER TABLE tax_rates RENAME COLUMN inail_employer_temp TO "inailEmployer";
-- ALTER TABLE tax_rates RENAME COLUMN ffc_worker_temp TO "ffcWorker";
-- ALTER TABLE tax_rates RENAME COLUMN ffc_employer_temp TO "ffcEmployer";
-- ALTER TABLE tax_rates RENAME COLUMN solidarity_worker_temp TO "solidarityWorker";
-- ALTER TABLE tax_rates RENAME COLUMN solidarity_employer_temp TO "solidarityEmployer";

-- Step 5: Rimuovi le colonne vecchie (dopo aver verificato)
-- ALTER TABLE tax_rates DROP COLUMN inps;
-- ALTER TABLE tax_rates DROP COLUMN inail;
-- ALTER TABLE tax_rates DROP COLUMN ffc;



