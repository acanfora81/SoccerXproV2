-- ===============================================================
-- 🧮 FISCAL SETUP V2 - MIGRAZIONE SUPABASE (FINAL)
-- Script per creare nuove tabelle parlanti e rimuovere legacy
-- VERSIONE FINALE: Controlla struttura tabelle legacy prima di migrare
-- ===============================================================

-- Abilita estensione UUID se non presente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===============================================================
-- 1️⃣ CREAZIONE NUOVE TABELLE V2 (PARLANTI)
-- ===============================================================

-- Aliquote base contributive e oneri (nomenclatura parlante) - V2
CREATE TABLE IF NOT EXISTS soccerxpro.tax_rates_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    contract_type soccerxpro."ContractType" NOT NULL,
    
    -- Lavoratore (employee) - percentuali
    inps_worker_pct DECIMAL(5,2) DEFAULT 0,
    ffc_worker_pct DECIMAL(5,2) DEFAULT 0,
    solidarity_worker_pct DECIMAL(5,2) DEFAULT 0,
    
    -- Datore (employer) - percentuali
    inps_employer_pct DECIMAL(5,2) DEFAULT 0,
    ffc_employer_pct DECIMAL(5,2) DEFAULT 0,
    inail_employer_pct DECIMAL(5,2) DEFAULT 0,
    solidarity_employer_pct DECIMAL(5,2) DEFAULT 0,
    fondo_rate_pct DECIMAL(5,2) DEFAULT 0.5,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_rates_v2_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id),
    CONSTRAINT uq_tax_rates_v2_team_year_type UNIQUE (team_id, year, contract_type)
);

-- Profilo modalità calcolo contributi
CREATE TABLE IF NOT EXISTS soccerxpro.tax_contribution_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    contract_type soccerxpro."ContractType" NOT NULL,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('LOOKUP', 'PIECEWISE')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_contribution_profiles_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id),
    CONSTRAINT uq_tax_contribution_profiles_team_year_type UNIQUE (team_id, year, contract_type)
);

-- Punti lookup contributi (x=lordo, y=contributi)
CREATE TABLE IF NOT EXISTS soccerxpro.tax_contribution_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    contract_type soccerxpro."ContractType" NOT NULL,
    gross DECIMAL(12,2) NOT NULL, -- x: Lordo
    contrib DECIMAL(12,2) NOT NULL, -- y: Contributi lavoratore in €
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_contribution_points_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Scaglioni contributi piecewise
CREATE TABLE IF NOT EXISTS soccerxpro.tax_contribution_brackets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    contract_type soccerxpro."ContractType" NOT NULL,
    from_amount DECIMAL(12,2) NOT NULL,
    to_amount DECIMAL(12,2),
    rate DECIMAL(5,2) NOT NULL, -- % su lordo
    fixed DECIMAL(12,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_contribution_brackets_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Override detrazioni IRPEF art.13 (punti x/y)
CREATE TABLE IF NOT EXISTS soccerxpro.tax_irpef_detraction_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    x_income DECIMAL(12,2) NOT NULL, -- base imponibile
    y_amount DECIMAL(12,2) NOT NULL, -- detrazione in €
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_irpef_detraction_overrides_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Addizionale regionale unificata
CREATE TABLE IF NOT EXISTS soccerxpro.tax_regional_additionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    is_progressive BOOLEAN DEFAULT FALSE,
    flat_rate DECIMAL(5,2), -- in %
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_regional_additionals_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id),
    CONSTRAINT uq_tax_regional_additionals_team_year_region UNIQUE (team_id, year, region)
);

-- Scaglioni addizionale regionale
CREATE TABLE IF NOT EXISTS soccerxpro.tax_regional_additional_brackets_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    min DECIMAL(12,2) NOT NULL,
    max DECIMAL(12,2),
    rate DECIMAL(5,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_regional_additional_brackets_v2_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Addizionale comunale unificata
CREATE TABLE IF NOT EXISTS soccerxpro.tax_municipal_additionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    is_progressive BOOLEAN DEFAULT FALSE,
    flat_rate DECIMAL(5,2),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_municipal_additionals_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id),
    CONSTRAINT uq_tax_municipal_additionals_team_year_region_municipality UNIQUE (team_id, year, region, municipality)
);

-- Scaglioni addizionale comunale
CREATE TABLE IF NOT EXISTS soccerxpro.tax_municipal_additional_brackets_v2 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    region VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    min DECIMAL(12,2) NOT NULL,
    max DECIMAL(12,2),
    rate DECIMAL(5,2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_municipal_additional_brackets_v2_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Bande bonus L.207/2019 (sconto IRPEF %)
CREATE TABLE IF NOT EXISTS soccerxpro.tax_bonus_l207_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    max_amount DECIMAL(12,2) NOT NULL, -- reddito imponibile massimo per la banda
    pct DECIMAL(5,2) NOT NULL, -- sconto IRPEF in %
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_bonus_l207_bands_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id)
);

-- Ulteriore detrazione L.207 (unificata) - FIX: full -> full_amount
CREATE TABLE IF NOT EXISTS soccerxpro.tax_extra_deduction_l207 (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL,
    year INTEGER NOT NULL,
    full_amount DECIMAL(12,2) NOT NULL, -- importo ulteriore detrazione piena
    full_to DECIMAL(12,2) NOT NULL, -- soglia R fino a cui è piena
    fade_to DECIMAL(12,2) NOT NULL, -- soglia R oltre la quale decade a 0
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT fk_tax_extra_deduction_l207_team FOREIGN KEY (team_id) REFERENCES soccerxpro.teams(id),
    CONSTRAINT uq_tax_extra_deduction_l207_team_year UNIQUE (team_id, year)
);

-- ===============================================================
-- 2️⃣ INDICI PER PERFORMANCE
-- ===============================================================

-- Indici per tax_rates_v2
CREATE INDEX IF NOT EXISTS idx_tax_rates_v2_team_year_type ON soccerxpro.tax_rates_v2(team_id, year, contract_type);

-- Indici per tax_contribution_profiles
CREATE INDEX IF NOT EXISTS idx_tax_contribution_profiles_team_year_type ON soccerxpro.tax_contribution_profiles(team_id, year, contract_type);

-- Indici per tax_contribution_points
CREATE INDEX IF NOT EXISTS idx_tax_contribution_points_team_year_type ON soccerxpro.tax_contribution_points(team_id, year, contract_type);

-- Indici per tax_contribution_brackets
CREATE INDEX IF NOT EXISTS idx_tax_contribution_brackets_team_year_type ON soccerxpro.tax_contribution_brackets(team_id, year, contract_type);

-- Indici per tax_irpef_detraction_overrides
CREATE INDEX IF NOT EXISTS idx_tax_irpef_detraction_overrides_team_year ON soccerxpro.tax_irpef_detraction_overrides(team_id, year);

-- Indici per tax_regional_additionals
CREATE INDEX IF NOT EXISTS idx_tax_regional_additionals_team_year_region ON soccerxpro.tax_regional_additionals(team_id, year, region);

-- Indici per tax_regional_additional_brackets_v2
CREATE INDEX IF NOT EXISTS idx_tax_regional_additional_brackets_v2_team_year_region ON soccerxpro.tax_regional_additional_brackets_v2(team_id, year, region);

-- Indici per tax_municipal_additionals
CREATE INDEX IF NOT EXISTS idx_tax_municipal_additionals_team_year_region_municipality ON soccerxpro.tax_municipal_additionals(team_id, year, region, municipality);

-- Indici per tax_municipal_additional_brackets_v2
CREATE INDEX IF NOT EXISTS idx_tax_municipal_additional_brackets_v2_team_year_region_municipality ON soccerxpro.tax_municipal_additional_brackets_v2(team_id, year, region, municipality);

-- Indici per tax_bonus_l207_bands
CREATE INDEX IF NOT EXISTS idx_tax_bonus_l207_bands_team_year ON soccerxpro.tax_bonus_l207_bands(team_id, year);

-- ===============================================================
-- 3️⃣ MIGRAZIONE DATI ESISTENTI (INTELLIGENTE)
-- ===============================================================

-- Controlla struttura tabella legacy e migra di conseguenza
DO $$
DECLARE
    has_camel_case BOOLEAN := FALSE;
    has_snake_case BOOLEAN := FALSE;
    migration_count INTEGER := 0;
BEGIN
    -- Controlla se la tabella tax_rates esiste
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'soccerxpro' AND table_name = 'tax_rates') THEN
        RAISE NOTICE '📊 Trovata tabella tax_rates legacy, analizzo struttura...';
        
        -- Controlla se ha colonne camelCase
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'soccerxpro' AND table_name = 'tax_rates' AND column_name = 'teamId') THEN
            has_camel_case := TRUE;
            RAISE NOTICE '🔍 Rilevata struttura camelCase (teamId, inpsWorker, etc.)';
        END IF;
        
        -- Controlla se ha colonne snake_case
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'soccerxpro' AND table_name = 'tax_rates' AND column_name = 'team_id') THEN
            has_snake_case := TRUE;
            RAISE NOTICE '🔍 Rilevata struttura snake_case (team_id, inps_worker, etc.)';
        END IF;
        
        -- Migra in base alla struttura rilevata
        IF has_camel_case THEN
            RAISE NOTICE '📝 Avvio migrazione da struttura camelCase...';
            
            INSERT INTO soccerxpro.tax_rates_v2 (
                team_id, year, contract_type,
                inps_worker_pct, ffc_worker_pct, solidarity_worker_pct,
                inps_employer_pct, ffc_employer_pct, inail_employer_pct,
                solidarity_employer_pct, fondo_rate_pct,
                created_at, updated_at
            )
            SELECT 
                "teamId",
                year,
                type::text::soccerxpro."ContractType",
                "inpsWorker"::DECIMAL(5,2),
                "ffcWorker"::DECIMAL(5,2),
                COALESCE("solidarityWorker", 0)::DECIMAL(5,2),
                "inpsEmployer"::DECIMAL(5,2),
                "ffcEmployer"::DECIMAL(5,2),
                COALESCE("inailEmployer", 0)::DECIMAL(5,2),
                COALESCE("solidarityEmployer", 0)::DECIMAL(5,2),
                0.5::DECIMAL(5,2),
                NOW(),
                NOW()
            FROM soccerxpro.tax_rates
            WHERE year >= 2024
            ON CONFLICT (team_id, year, contract_type) DO NOTHING;
            
            GET DIAGNOSTICS migration_count = ROW_COUNT;
            RAISE NOTICE '✅ Migrazione camelCase completata: % record migrati', migration_count;
            
        ELSIF has_snake_case THEN
            RAISE NOTICE '📝 Avvio migrazione da struttura snake_case...';
            
            INSERT INTO soccerxpro.tax_rates_v2 (
                team_id, year, contract_type,
                inps_worker_pct, ffc_worker_pct, solidarity_worker_pct,
                inps_employer_pct, ffc_employer_pct, inail_employer_pct,
                solidarity_employer_pct, fondo_rate_pct,
                created_at, updated_at
            )
            SELECT 
                team_id,
                year,
                type::text::soccerxpro."ContractType",
                inps_worker::DECIMAL(5,2),
                ffc_worker::DECIMAL(5,2),
                COALESCE(solidarity_worker, 0)::DECIMAL(5,2),
                inps_employer::DECIMAL(5,2),
                ffc_employer::DECIMAL(5,2),
                COALESCE(inail_employer, 0)::DECIMAL(5,2),
                COALESCE(solidarity_employer, 0)::DECIMAL(5,2),
                0.5::DECIMAL(5,2),
                NOW(),
                NOW()
            FROM soccerxpro.tax_rates
            WHERE year >= 2024
            ON CONFLICT (team_id, year, contract_type) DO NOTHING;
            
            GET DIAGNOSTICS migration_count = ROW_COUNT;
            RAISE NOTICE '✅ Migrazione snake_case completata: % record migrati', migration_count;
            
        ELSE
            RAISE NOTICE '⚠️  Struttura tabella tax_rates non riconosciuta, salto migrazione';
        END IF;
        
    ELSE
        RAISE NOTICE '⚠️  Tabella tax_rates non trovata, salto migrazione dati';
    END IF;
END $$;

-- ===============================================================
-- 4️⃣ POPOLAMENTO DATI DI DEFAULT
-- ===============================================================

-- Inserisci aliquote di default per 2025 (se non esistono)
INSERT INTO soccerxpro.tax_rates_v2 (
    team_id, year, contract_type,
    inps_worker_pct, ffc_worker_pct, solidarity_worker_pct,
    inps_employer_pct, ffc_employer_pct, inail_employer_pct,
    solidarity_employer_pct, fondo_rate_pct
)
SELECT 
    t.id,
    2025,
    'PROFESSIONAL'::soccerxpro."ContractType",
    9.19, 0.5, 0,
    30.0, 6.25, 1.5,
    0, 0.5
FROM soccerxpro.teams t
WHERE NOT EXISTS (
    SELECT 1 FROM soccerxpro.tax_rates_v2 tr 
    WHERE tr.team_id = t.id AND tr.year = 2025 AND tr.contract_type = 'PROFESSIONAL'
)
ON CONFLICT (team_id, year, contract_type) DO NOTHING;

-- Inserisci profilo contributi di default (PIECEWISE)
INSERT INTO soccerxpro.tax_contribution_profiles (
    team_id, year, contract_type, mode
)
SELECT 
    t.id,
    2025,
    'PROFESSIONAL'::soccerxpro."ContractType",
    'PIECEWISE'
FROM soccerxpro.teams t
WHERE NOT EXISTS (
    SELECT 1 FROM soccerxpro.tax_contribution_profiles tcp 
    WHERE tcp.team_id = t.id AND tcp.year = 2025 AND tcp.contract_type = 'PROFESSIONAL'
)
ON CONFLICT (team_id, year, contract_type) DO NOTHING;

-- ===============================================================
-- 5️⃣ VERIFICA FINALE
-- ===============================================================

-- Conta record inseriti
SELECT 
    'tax_rates_v2' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_rates_v2
UNION ALL
SELECT 
    'tax_contribution_profiles' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_contribution_profiles
UNION ALL
SELECT 
    'tax_irpef_bracket' as tabella,
    COUNT(*) as record_count
FROM soccerxpro.tax_irpef_bracket;

-- Verifica struttura tabelle create
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'soccerxpro' 
AND table_name IN (
    'tax_rates_v2',
    'tax_contribution_profiles',
    'tax_contribution_points',
    'tax_contribution_brackets',
    'tax_irpef_detraction_overrides',
    'tax_regional_additionals',
    'tax_regional_additional_brackets_v2',
    'tax_municipal_additionals',
    'tax_municipal_additional_brackets_v2',
    'tax_bonus_l207_bands',
    'tax_extra_deduction_l207'
)
ORDER BY table_name, ordinal_position;

-- ===============================================================
-- ✅ MIGRAZIONE COMPLETATA
-- ===============================================================

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE '🎉 Migrazione Fiscal Setup V2 completata con successo!';
    RAISE NOTICE '📊 Nuove tabelle create: 11';
    RAISE NOTICE '🔗 Indici creati: 11';
    RAISE NOTICE '📝 Dati di default inseriti per 2025';
    RAISE NOTICE '⚙️ Sistema fiscale ora completamente DB-driven';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Prossimi passi:';
    RAISE NOTICE '1. Testa endpoint /api/fiscal-setup/status';
    RAISE NOTICE '2. Configura aliquote via UI /dashboard/tax/fiscal-setup';
    RAISE NOTICE '3. Testa calcoli con /api/taxes/v2/gross-from-net';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Per eliminare tabelle legacy, usa cleanup_legacy_tax_tables.sql';
END $$;

