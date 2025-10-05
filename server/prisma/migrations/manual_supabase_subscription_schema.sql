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
    team_id UUID REFERENCES soccerxpro.team(id) ON DELETE CASCADE,
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
    team_id UUID REFERENCES soccerxpro.team(id) ON DELETE CASCADE,
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

ALTER TABLE soccerxpro.team
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES soccerxpro.subscription_plan(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plan_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS plan_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';

-- ============================================
-- 🧩 STEP 5 — AGGIUNTA COLONNE IN user
-- ============================================

ALTER TABLE soccerxpro.user
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES soccerxpro.team(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ADMIN';

-- ============================================
-- 🧮 STEP 6 — INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_subscription_team_id ON soccerxpro.subscription(team_id);
CREATE INDEX IF NOT EXISTS idx_subscription_plan_id ON soccerxpro.subscription(plan_id);
CREATE INDEX IF NOT EXISTS idx_team_plan_id ON soccerxpro.team(plan_id);
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
