-- ===============================================================
-- 🔍 SCRIPT CREAZIONE NUOVE TABELLE SCOUT_* 
-- ===============================================================
-- 
-- Questo script crea tutte le nuove tabelle scout_* nel database
-- Eseguire DOPO aver eseguito cleanup_scouting_tables.sql
-- 
-- ===============================================================

-- ===============================================================
-- 🏗️ CREAZIONE TABELLE SCOUT_*
-- ===============================================================

-- Tabella scout_prospects (Core)
CREATE TABLE IF NOT EXISTS soccerxpro.scout_prospects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    updated_by_id INTEGER,
    
    -- Identità & anagrafica
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT,
    birth_date TIMESTAMP,
    birth_place TEXT,
    nationality_primary TEXT,
    nationalities JSONB,
    eu_status TEXT,
    preferred_foot TEXT,
    
    -- Profilo calcistico
    height_cm INTEGER,
    weight_kg INTEGER,
    wingspan_cm INTEGER,
    main_position TEXT NOT NULL,
    secondary_positions JSONB,
    role_tags JSONB,
    
    -- Club & mercato
    current_club TEXT,
    current_league TEXT,
    country_club TEXT,
    contract_type TEXT,
    contract_until TIMESTAMP,
    market_value DOUBLE PRECISION,
    release_clause DOUBLE PRECISION,
    sell_on_clause_pct DOUBLE PRECISION,
    agent_id UUID REFERENCES soccerxpro.scout_agents(id),
    
    -- Valutazioni
    overall_score DOUBLE PRECISION,
    potential_score DOUBLE PRECISION,
    risk_index DOUBLE PRECISION,
    status TEXT DEFAULT 'DISCOVERY' NOT NULL,
    status_reason TEXT,
    
    -- Link cross-modulo
    player_id INTEGER REFERENCES soccerxpro.players(id),
    target_id INTEGER REFERENCES soccerxpro.market_targets(id),
    external_refs JSONB,
    
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabella scout_sessions
CREATE TABLE IF NOT EXISTS soccerxpro.scout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    observation_type TEXT DEFAULT 'LIVE',
    date_observed TIMESTAMP,
    location TEXT,
    opponent TEXT,
    competition TEXT,
    minutes_played INTEGER,
    role_played TEXT,
    rating DOUBLE PRECISION,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabella scout_formations
CREATE TABLE IF NOT EXISTS soccerxpro.scout_formations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES soccerxpro.scout_sessions(id) ON DELETE CASCADE,
    team_side TEXT NOT NULL DEFAULT 'HOME',
    formation TEXT NOT NULL,
    positions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(session_id, team_side)
);

-- Tabella scout_reports
CREATE TABLE IF NOT EXISTS soccerxpro.scout_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    session_id UUID REFERENCES soccerxpro.scout_sessions(id) ON DELETE SET NULL,
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    
    match_date TIMESTAMP,
    opponent TEXT,
    competition TEXT,
    role_played TEXT,
    minutes_played INTEGER,
    technique_score DOUBLE PRECISION,
    tactics_score DOUBLE PRECISION,
    physical_score DOUBLE PRECISION,
    mentality_score DOUBLE PRECISION,
    total_score DOUBLE PRECISION DEFAULT 0,
    summary TEXT,
    video_link TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabella scout_evaluations
CREATE TABLE IF NOT EXISTS soccerxpro.scout_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    director_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    average_score DOUBLE PRECISION,
    recommendation TEXT,
    notes TEXT,
    decision_date TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabella scout_followups
CREATE TABLE IF NOT EXISTS soccerxpro.scout_followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES soccerxpro.user_profiles(id),
    due_date TIMESTAMP,
    status TEXT DEFAULT 'OPEN',
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMP
);

-- Tabella scout_event_logs
CREATE TABLE IF NOT EXISTS soccerxpro.scout_event_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    action TEXT NOT NULL,
    description TEXT,
    from_status TEXT,
    to_status TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Tabella scout_watchlists
CREATE TABLE IF NOT EXISTS soccerxpro.scout_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id UUID NOT NULL REFERENCES soccerxpro.scout_prospects(id) ON DELETE CASCADE,
    scout_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'ACTIVE',
    rating DOUBLE PRECISION,
    last_seen_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(prospect_id, scout_id)
);

-- Tabella scout_agents
CREATE TABLE IF NOT EXISTS soccerxpro.scout_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES soccerxpro.teams(id) ON DELETE CASCADE,
    created_by_id INTEGER NOT NULL REFERENCES soccerxpro.user_profiles(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    license_number TEXT,
    country TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ===============================================================
-- 📊 CREAZIONE INDICI PER PERFORMANCE
-- ===============================================================

-- Indici scout_prospects
CREATE INDEX IF NOT EXISTS idx_scout_prospects_team_status ON soccerxpro.scout_prospects(team_id, status);
CREATE INDEX IF NOT EXISTS idx_scout_prospects_name ON soccerxpro.scout_prospects(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_scout_prospects_player ON soccerxpro.scout_prospects(player_id);
CREATE INDEX IF NOT EXISTS idx_scout_prospects_target ON soccerxpro.scout_prospects(target_id);
CREATE INDEX IF NOT EXISTS idx_scout_prospects_agent ON soccerxpro.scout_prospects(agent_id);

-- Indici scout_sessions
CREATE INDEX IF NOT EXISTS idx_scout_sessions_prospect ON soccerxpro.scout_sessions(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_sessions_team_date ON soccerxpro.scout_sessions(team_id, date_observed);
CREATE INDEX IF NOT EXISTS idx_scout_sessions_created_by ON soccerxpro.scout_sessions(created_by_id);

-- Indici scout_formations
CREATE INDEX IF NOT EXISTS idx_scout_formations_session ON soccerxpro.scout_formations(session_id);
CREATE INDEX IF NOT EXISTS idx_scout_formations_team_side ON soccerxpro.scout_formations(team_side);

-- Indici scout_reports
CREATE INDEX IF NOT EXISTS idx_scout_reports_prospect ON soccerxpro.scout_reports(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_reports_session ON soccerxpro.scout_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_scout_reports_team_created ON soccerxpro.scout_reports(team_id, created_at);

-- Indici scout_evaluations
CREATE INDEX IF NOT EXISTS idx_scout_evaluations_prospect ON soccerxpro.scout_evaluations(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_evaluations_team_date ON soccerxpro.scout_evaluations(team_id, decision_date);

-- Indici scout_followups
CREATE INDEX IF NOT EXISTS idx_scout_followups_prospect ON soccerxpro.scout_followups(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_followups_team_status ON soccerxpro.scout_followups(team_id, status);
CREATE INDEX IF NOT EXISTS idx_scout_followups_assigned ON soccerxpro.scout_followups(assigned_to);

-- Indici scout_event_logs
CREATE INDEX IF NOT EXISTS idx_scout_event_logs_prospect ON soccerxpro.scout_event_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_event_logs_team_created ON soccerxpro.scout_event_logs(team_id, created_at);
CREATE INDEX IF NOT EXISTS idx_scout_event_logs_user ON soccerxpro.scout_event_logs(user_id);

-- Indici scout_watchlists
CREATE INDEX IF NOT EXISTS idx_scout_watchlists_prospect ON soccerxpro.scout_watchlists(prospect_id);
CREATE INDEX IF NOT EXISTS idx_scout_watchlists_scout ON soccerxpro.scout_watchlists(scout_id);
CREATE INDEX IF NOT EXISTS idx_scout_watchlists_team ON soccerxpro.scout_watchlists(team_id);

-- Indici scout_agents
CREATE INDEX IF NOT EXISTS idx_scout_agents_team ON soccerxpro.scout_agents(team_id);
CREATE INDEX IF NOT EXISTS idx_scout_agents_created_by ON soccerxpro.scout_agents(created_by_id);

-- ===============================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ===============================================================

-- Abilita RLS su tutte le tabelle scout_*
ALTER TABLE soccerxpro.scout_prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE soccerxpro.scout_agents ENABLE ROW LEVEL SECURITY;

-- Policy per scout_prospects (esempio - adattare alle tue esigenze)
CREATE POLICY scout_prospects_team_isolation ON soccerxpro.scout_prospects
    FOR ALL
    USING (team_id IN (SELECT id FROM soccerxpro.teams WHERE id = team_id));

-- ===============================================================
-- 🔄 TRIGGER PER UPDATED_AT
-- ===============================================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION soccerxpro.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per scout_prospects
CREATE TRIGGER update_scout_prospects_updated_at BEFORE UPDATE ON soccerxpro.scout_prospects
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();

-- Trigger per scout_sessions
CREATE TRIGGER update_scout_sessions_updated_at BEFORE UPDATE ON soccerxpro.scout_sessions
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();

-- Trigger per scout_formations
CREATE TRIGGER update_scout_formations_updated_at BEFORE UPDATE ON soccerxpro.scout_formations
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();
-- Trigger per scout_reports
CREATE TRIGGER update_scout_reports_updated_at BEFORE UPDATE ON soccerxpro.scout_reports
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();

-- Trigger per scout_watchlists
CREATE TRIGGER update_scout_watchlists_updated_at BEFORE UPDATE ON soccerxpro.scout_watchlists
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();

-- Trigger per scout_agents
CREATE TRIGGER update_scout_agents_updated_at BEFORE UPDATE ON soccerxpro.scout_agents
    FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();

-- ===============================================================
-- ✅ VERIFICA CREAZIONE TABELLE
-- ===============================================================

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'soccerxpro'
  AND tablename LIKE 'scout_%'
ORDER BY tablename;

-- ===============================================================
-- 📝 LOG DELLA CREAZIONE
-- ===============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Tabelle scout_* create con successo!';
    RAISE NOTICE '📊 Indici creati per performance ottimale';
    RAISE NOTICE '🔒 RLS abilitato su tutte le tabelle';
    RAISE NOTICE '🔄 Trigger updated_at configurati';
END $$;

-- ===============================================================
-- 🎯 PROSSIMI PASSI
-- ===============================================================
-- 
-- 1. ✅ Eseguito cleanup_scouting_tables.sql
-- 2. ✅ Eseguito questo script (create_scout_tables.sql)
-- 3. ⏭️ Aggiornare il codice backend per usare le nuove tabelle
-- 4. ⏭️ Aggiornare il codice frontend per usare le nuove tabelle
-- 5. ⏭️ Testare il flusso completo
-- 
-- ===============================================================
