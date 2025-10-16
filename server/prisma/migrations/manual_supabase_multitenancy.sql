-- Multitenancy fiscal tables migration for Supabase (PostgreSQL)
-- Schema: soccerxpro

-- 1) tax_config
ALTER TABLE soccerxpro.tax_config
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tax_config_team_fk') THEN
    ALTER TABLE soccerxpro.tax_config
      ADD CONSTRAINT tax_config_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS soccerxpro.uq_tax_config_year;
CREATE UNIQUE INDEX IF NOT EXISTS uq_tax_config_team_year
  ON soccerxpro.tax_config(team_id, year);

-- 2) tax_irpef_bracket
ALTER TABLE soccerxpro.tax_irpef_bracket
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tax_irpef_bracket_team_fk') THEN
    ALTER TABLE soccerxpro.tax_irpef_bracket
      ADD CONSTRAINT tax_irpef_bracket_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS soccerxpro.uq_irpef_team_year_min;
CREATE UNIQUE INDEX IF NOT EXISTS uq_irpef_team_year_min
  ON soccerxpro.tax_irpef_bracket(team_id, year, min);

-- 3) tax_regional_additional_scheme
ALTER TABLE soccerxpro.tax_regional_additional_scheme
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='trgs_team_fk') THEN
    ALTER TABLE soccerxpro.tax_regional_additional_scheme
      ADD CONSTRAINT trgs_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS soccerxpro.uq_regional_scheme;
CREATE UNIQUE INDEX IF NOT EXISTS uq_regional_scheme_team
  ON soccerxpro.tax_regional_additional_scheme(team_id, year, region, is_default);

-- 4) tax_municipal_additional_rule
ALTER TABLE soccerxpro.tax_municipal_additional_rule
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tmar_team_fk') THEN
    ALTER TABLE soccerxpro.tax_municipal_additional_rule
      ADD CONSTRAINT tmar_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS soccerxpro.uq_municipal_rule;
CREATE UNIQUE INDEX IF NOT EXISTS uq_municipal_rule_team
  ON soccerxpro.tax_municipal_additional_rule(team_id, year, region, municipality, is_default);

-- 5) tax_extra_deduction_rule
ALTER TABLE soccerxpro.tax_extra_deduction_rule
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tedr_team_fk') THEN
    ALTER TABLE soccerxpro.tax_extra_deduction_rule
      ADD CONSTRAINT tedr_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

DROP INDEX IF EXISTS soccerxpro.idx_extra_deduction_year_min;
CREATE UNIQUE INDEX IF NOT EXISTS uq_extra_deduction_team_year_min
  ON soccerxpro.tax_extra_deduction_rule(team_id, year, min);
CREATE INDEX IF NOT EXISTS idx_extra_deduction_team_year
  ON soccerxpro.tax_extra_deduction_rule(team_id, year);

-- 6) tax_bonus_l207_rule (migrate to percentage model)
ALTER TABLE soccerxpro.tax_bonus_l207_rule
  ADD COLUMN IF NOT EXISTS team_id uuid NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tbl207_team_fk') THEN
    ALTER TABLE soccerxpro.tax_bonus_l207_rule
      ADD CONSTRAINT tbl207_team_fk
      FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id) ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

-- new columns
ALTER TABLE soccerxpro.tax_bonus_l207_rule
  ADD COLUMN IF NOT EXISTS min_income DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS max_income DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS bonus_percentage DOUBLE PRECISION DEFAULT 0,
  ADD COLUMN IF NOT EXISTS applicable_to TEXT,
  ADD COLUMN IF NOT EXISTS note TEXT;

-- Ensure enum type exists with the exact quoted name expected by Prisma
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaxBonusL207Type') THEN
    EXECUTE 'CREATE TYPE soccerxpro."TaxBonusL207Type" AS ENUM (''TAX_DISCOUNT'',''EXEMPTION'')';
  END IF;
END $$;

-- Ensure column exists and uses the correct enum type
DO $$ BEGIN
  -- Add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='soccerxpro' AND table_name='tax_bonus_l207_rule' AND column_name='bonus_type'
  ) THEN
    EXECUTE 'ALTER TABLE soccerxpro.tax_bonus_l207_rule ADD COLUMN bonus_type soccerxpro."TaxBonusL207Type" DEFAULT ''TAX_DISCOUNT'' ';
  ELSE
    -- If column exists with a different enum type (e.g., taxbonusl207type), cast to the correct one
    IF EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_schema='soccerxpro' AND table_name='tax_bonus_l207_rule' AND column_name='bonus_type' AND udt_name <> 'TaxBonusL207Type'
    ) THEN
      EXECUTE 'ALTER TABLE soccerxpro.tax_bonus_l207_rule ALTER COLUMN bonus_type TYPE soccerxpro."TaxBonusL207Type" USING bonus_type::text::soccerxpro."TaxBonusL207Type" ';
    END IF;
  END IF;
END $$;

-- backfill from legacy columns if present (only if columns exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'soccerxpro' AND table_name = 'tax_bonus_l207_rule' AND column_name = 'min') THEN
    UPDATE soccerxpro.tax_bonus_l207_rule SET min_income = min WHERE min_income IS NULL AND min IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'soccerxpro' AND table_name = 'tax_bonus_l207_rule' AND column_name = 'max') THEN
    UPDATE soccerxpro.tax_bonus_l207_rule SET max_income = max WHERE max_income IS NULL AND max IS NOT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'soccerxpro' AND table_name = 'tax_bonus_l207_rule' AND column_name = 'amount') THEN
    UPDATE soccerxpro.tax_bonus_l207_rule 
      SET bonus_percentage = CASE WHEN amount IN (0,50,100) THEN amount ELSE COALESCE(bonus_percentage,0) END
      WHERE amount IS NOT NULL;
  END IF;
END $$;

-- drop old unique and create new
DROP INDEX IF EXISTS soccerxpro.uq_bonus_l207_year_min;
DROP INDEX IF EXISTS soccerxpro.idx_bonus_l207_year_min;
DROP INDEX IF EXISTS soccerxpro.uq_bonus207_team_year_min;
CREATE UNIQUE INDEX IF NOT EXISTS uq_bonus207_team_year_min_income
  ON soccerxpro.tax_bonus_l207_rule(team_id, year, min_income);
CREATE INDEX IF NOT EXISTS idx_bonus207_team_year
  ON soccerxpro.tax_bonus_l207_rule(team_id, year);

-- drop legacy columns if exist
ALTER TABLE soccerxpro.tax_bonus_l207_rule DROP COLUMN IF EXISTS amount;
ALTER TABLE soccerxpro.tax_bonus_l207_rule DROP COLUMN IF EXISTS slope;
ALTER TABLE soccerxpro.tax_bonus_l207_rule DROP COLUMN IF EXISTS min;
ALTER TABLE soccerxpro.tax_bonus_l207_rule DROP COLUMN IF EXISTS max;

-- Suggested RLS (enable if using PostgREST/Supabase auth directly)
-- ALTER TABLE soccerxpro.tax_config ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tax_config_isolation ON soccerxpro.tax_config USING (team_id = current_setting('request.jwt.claims', true)::jsonb->>'teamId');


