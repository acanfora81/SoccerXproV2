-- =============================================================
-- ⚽ SOCCER X PRO — ACCOUNT-CENTRIC MIGRATION (Supabase SQL)
-- Eseguire nel SQL Editor di Supabase (schema: soccerxpro)
-- Sicuro in ambienti con dati esistenti; usa colonne nullable per transizione
-- =============================================================

-- 1) ENUMS ----------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'ModuleKey' AND n.nspname = 'soccerxpro') THEN
    CREATE TYPE soccerxpro."ModuleKey" AS ENUM ('PLAYERS','PERFORMANCE','CONTRACTS','MEDICAL','SCOUTING','MARKET','BUDGETS','GDPR');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'LicenseStatus' AND n.nspname = 'soccerxpro') THEN
    CREATE TYPE soccerxpro."LicenseStatus" AS ENUM ('TRIAL','ACTIVE','SUSPENDED','CANCELLED','EXPIRED');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE t.typname = 'AccountType' AND n.nspname = 'soccerxpro') THEN
    CREATE TYPE soccerxpro."AccountType" AS ENUM ('CLUB','INDIVIDUAL','AGENCY');
  END IF;
END $$;

-- 2) TABELLE ACCOUNT -----------------------------------------
CREATE TABLE IF NOT EXISTS soccerxpro.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  type soccerxpro."AccountType" NOT NULL DEFAULT 'CLUB',
  plan text DEFAULT 'basic',
  status text DEFAULT 'active',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soccerxpro.account_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" uuid NOT NULL REFERENCES soccerxpro.accounts(id) ON DELETE CASCADE,
  "userId" integer NOT NULL REFERENCES soccerxpro.user_profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  "invitedAt" timestamptz NULL,
  "joinedAt" timestamptz NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("accountId","userId")
);

CREATE TABLE IF NOT EXISTS soccerxpro.account_module_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "accountId" uuid NOT NULL REFERENCES soccerxpro.accounts(id) ON DELETE CASCADE,
  module soccerxpro."ModuleKey" NOT NULL,
  plan text NOT NULL DEFAULT 'BASIC',
  status soccerxpro."LicenseStatus" NOT NULL DEFAULT 'ACTIVE',
  seats integer NOT NULL DEFAULT 1,
  features jsonb NULL,
  "startDate" timestamptz NOT NULL DEFAULT now(),
  "endDate" timestamptz NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE ("accountId", module)
);

-- 3) TEAM: aggiunta colonne accountId/isPersonal --------------
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='soccerxpro' AND table_name='teams' AND column_name='accountId'
  ) THEN
    ALTER TABLE soccerxpro.teams ADD COLUMN "accountId" uuid NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='soccerxpro' AND table_name='teams' AND column_name='isPersonal'
  ) THEN
    ALTER TABLE soccerxpro.teams ADD COLUMN "isPersonal" boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- FK (deferita finché non completiamo il backfill)
ALTER TABLE soccerxpro.teams
  DROP CONSTRAINT IF EXISTS teams_accountid_fkey;
ALTER TABLE soccerxpro.teams
  ADD CONSTRAINT teams_accountid_fkey FOREIGN KEY ("accountId") REFERENCES soccerxpro.accounts(id) ON DELETE SET NULL;

-- 4) BACKFILL: crea un account per ogni team esistente --------
-- Usa slug derivato dal team.slug, evita collisioni con suffix numerico
WITH existing_teams AS (
  SELECT id, slug, name FROM soccerxpro.teams
),
created_accounts AS (
  INSERT INTO soccerxpro.accounts (name, slug, type)
  SELECT et.name, et.slug, 'CLUB'::soccerxpro."AccountType" FROM existing_teams et
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
UPDATE soccerxpro.teams t
SET "accountId" = a.id
FROM soccerxpro.accounts a
WHERE a.slug = t.slug AND t."accountId" IS NULL;

-- 5) BACKFILL: account_users dalla relazione utente->team ------
INSERT INTO soccerxpro.account_users ("accountId","userId","role")
SELECT DISTINCT t."accountId", u.id, 'member'
FROM soccerxpro.user_profiles u
JOIN soccerxpro.teams t ON t.id = u.team_id
LEFT JOIN soccerxpro.account_users au ON au."accountId" = t."accountId" AND au."userId" = u.id
WHERE au.id IS NULL AND t."accountId" IS NOT NULL;

-- 6) BACKFILL: subscription → account_module_licenses ---------
-- Interpreta features.modules come elenco di chiavi modulo
INSERT INTO soccerxpro.account_module_licenses ("accountId", module, plan, status, features, "startDate")
SELECT DISTINCT t."accountId",
  m.module_key::soccerxpro."ModuleKey",
  COALESCE(s.plan::text,'BASIC'),
  COALESCE(s.status::text,'ACTIVE')::soccerxpro."LicenseStatus",
  s.features,
  COALESCE(s.start_date, now())
FROM soccerxpro.subscriptions s
JOIN soccerxpro.teams t ON t.id = s.team_id
CROSS JOIN LATERAL (
  SELECT jsonb_array_elements_text(COALESCE(s.features->'modules', '[]'::jsonb)) AS module_key
) m
LEFT JOIN soccerxpro.account_module_licenses aml
  ON aml."accountId" = t."accountId" AND aml.module = m.module_key::soccerxpro."ModuleKey"
WHERE t."accountId" IS NOT NULL AND aml.id IS NULL;

-- 7) INDICI UTILI ----------------------------------------------
CREATE INDEX IF NOT EXISTS idx_teams_account ON soccerxpro.teams("accountId");
CREATE INDEX IF NOT EXISTS idx_account_users_account ON soccerxpro.account_users("accountId");
CREATE INDEX IF NOT EXISTS idx_account_licenses_account ON soccerxpro.account_module_licenses("accountId");

-- 8) NOTE
-- - Le colonne nuove su teams sono nullable per compat. Potrai renderle NOT NULL dopo aver migrato tutti i percorsi di creazione team.
-- - La conversione delle subscription è additiva: non rimuove la tabella esistente.

-- ============================================
-- 🧠 SCRIPT CHIRURGICO PER SUPABASE SQL EDITOR
-- ============================================
-- Schema: soccerxpro
-- Obiettivo: Aggiungere sistema subscription + payment senza toccare dati esistenti
-- Esecuzione: Solo tramite Supabase SQL Editor
-- ============================================

-- ============================================
-- 🧱 STEP 1 — CREAZIONE TABELLA subscription_plan
-- ============================================

CREATE TABLE IF NOT EXISTS soccerxpro.subscription_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,  -- es. BASIC, PROFESSIONAL, PREMIUM, ENTERPRISE
    name TEXT NOT NULL,
    price_monthly NUMERIC,
    price_yearly NUMERIC,
    max_users INT NOT NULL DEFAULT 0,
    max_players INT NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 🧱 STEP 2 — CREAZIONE TABELLA subscription
-- ============================================

CREATE TABLE IF NOT EXISTS soccerxpro.subscription (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES soccerxpro.subscription_plan(id) ON DELETE SET NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'ACTIVE',
    payment_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 🧱 STEP 3 — CREAZIONE TABELLA payment_log
-- ============================================

CREATE TABLE IF NOT EXISTS soccerxpro.payment_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES soccerxpro.subscription_plan(id) ON DELETE SET NULL,
    amount NUMERIC,
    provider TEXT,  -- es. 'Stripe', 'Brevo', 'Simulated'
    status TEXT,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 🧩 STEP 4 — AGGIUNTA COLONNE IN team
-- ============================================

ALTER TABLE soccerxpro.teams
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES soccerxpro.subscription_plan(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- ============================================
-- 🧩 STEP 5 — AGGIUNTA COLONNE IN user
-- ============================================

ALTER TABLE soccerxpro.user_profiles
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES soccerxpro.teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN';

-- ============================================
-- 🧮 STEP 6 — INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscription_team_id ON soccerxpro.subscription(team_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_id ON soccerxpro.subscription(plan_id);
CREATE INDEX IF NOT EXISTS idx_team_plan_id ON soccerxpro.teams(plan_id);
CREATE INDEX IF NOT EXISTS idx_payment_log_team_id ON soccerxpro.payment_log(team_id);
CREATE INDEX IF NOT EXISTS idx_payment_log_plan_id ON soccerxpro.payment_log(plan_id);

-- ============================================
-- 🧾 STEP 7 — INSERIMENTO PIANI STANDARD
-- ============================================

INSERT INTO soccerxpro.subscription_plan (code, name, price_monthly, max_users, max_players, features)
VALUES
('BASIC', 'Basic', 0, 5, 25, '["Dashboard base", "Gestione giocatori", "Contratti base", "Statistiche essenziali", "Supporto community"]'::jsonb),
('PROFESSIONAL', 'Professional', 29, 15, 50, '["Analytics avanzate", "Report personalizzati", "Performance tracking", "Supporto prioritario", "Integrazione GPS"]'::jsonb),
('PREMIUM', 'Premium', 59, 30, 100, '["Analytics predittive", "Report avanzati", "API accesso", "Training AI insights"]'::jsonb),
('ENTERPRISE', 'Enterprise', NULL, 100, 250, '["API completa", "Supporto dedicato", "White-label option", "SLA garantito"]'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ✅ STEP 8 — VALIDAZIONE RAPIDA
-- ============================================

-- Controlla che le tabelle siano create
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'soccerxpro' 
AND table_name IN ('subscription_plan', 'subscription', 'payment_log');

-- Controlla le nuove colonne in team e user
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'soccerxpro' 
  AND table_name IN ('team', 'user') 
  AND column_name IN ('plan_id', 'plan_start_date', 'plan_end_date', 'is_trial', 'status', 'role', 'team_id');

-- Controlla che i piani base siano presenti
SELECT code, name, price_monthly, max_users, max_players FROM soccerxpro.subscription_plan;
