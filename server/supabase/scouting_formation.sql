-- ===============================================================
-- ⚽ Soccer X Pro Suite — Scouting Formation (Supabase SQL)
-- Schema: soccerxpro
-- Table: scout_formations
-- ===============================================================

-- Cleanup (idempotent)
DROP TABLE IF EXISTS soccerxpro.scout_formations CASCADE;

-- Create table
CREATE TABLE soccerxpro.scout_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES soccerxpro.scout_sessions(id) ON DELETE CASCADE,
  team_side text NOT NULL DEFAULT 'HOME',
  formation text NOT NULL,
  positions jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(session_id, team_side)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scout_formations_session ON soccerxpro.scout_formations(session_id);
CREATE INDEX IF NOT EXISTS idx_scout_formations_team_side ON soccerxpro.scout_formations(team_side);

-- RLS
ALTER TABLE soccerxpro.scout_formations ENABLE ROW LEVEL SECURITY;

-- Basic policies (align to sessions; adapt to your RLS strategy)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'soccerxpro' AND tablename = 'scout_formations' AND policyname = 'scout_formations_select_all'
  ) THEN
    CREATE POLICY scout_formations_select_all ON soccerxpro.scout_formations
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'soccerxpro' AND tablename = 'scout_formations' AND policyname = 'scout_formations_insert_all'
  ) THEN
    CREATE POLICY scout_formations_insert_all ON soccerxpro.scout_formations
      FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'soccerxpro' AND tablename = 'scout_formations' AND policyname = 'scout_formations_update_all'
  ) THEN
    CREATE POLICY scout_formations_update_all ON soccerxpro.scout_formations
      FOR UPDATE USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'soccerxpro' AND tablename = 'scout_formations' AND policyname = 'scout_formations_delete_all'
  ) THEN
    CREATE POLICY scout_formations_delete_all ON soccerxpro.scout_formations
      FOR DELETE USING (true);
  END IF;
END $$;

-- updated_at trigger
CREATE TRIGGER update_scout_formations_updated_at
  BEFORE UPDATE ON soccerxpro.scout_formations
  FOR EACH ROW EXECUTE FUNCTION soccerxpro.update_updated_at_column();


