-- Migrazione per rimuovere le tabelle del sistema fiscale parametrico
-- Data: 2025-01-27
-- Descrizione: Rimozione completa del sistema fiscale parametrico (Gestione Scaglioni)

-- Rimuovi le tabelle in ordine inverso di dipendenza per evitare errori di foreign key
DROP TABLE IF EXISTS soccerxpro.tax_extras CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_bracket_row CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_bracket_table CASCADE;
DROP TABLE IF EXISTS soccerxpro.l207_detrazione_cfg CASCADE;
DROP TABLE IF EXISTS soccerxpro.l207_bonus_band CASCADE;
DROP TABLE IF EXISTS soccerxpro.detrazione_override_points CASCADE;
DROP TABLE IF EXISTS soccerxpro.contribution_points CASCADE;
DROP TABLE IF EXISTS soccerxpro.tax_scenario CASCADE;

-- Rimuovi l'enum tax_bracket_kind
DROP TYPE IF EXISTS soccerxpro.tax_bracket_kind CASCADE;

-- Rimuovi gli indici se esistono ancora
DROP INDEX IF EXISTS idx_tax_bracket_table_scenario_kind;
DROP INDEX IF EXISTS idx_tax_bracket_row_table_order;
DROP INDEX IF EXISTS idx_contribution_points_scenario_gross;
DROP INDEX IF EXISTS idx_detrazione_override_scenario_imponibile;
DROP INDEX IF EXISTS idx_l207_bonus_scenario_max;
