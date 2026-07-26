-- YATRA — Migration P20 (VACANCES V2.0 §7 — Sur place)
-- Journal des calculs de rentabilité pass touristique confirmés par l'utilisateur.
-- Idempotent.

SET search_path = yatra, public;

CREATE TABLE IF NOT EXISTS yatra.vacances_pass_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  ville TEXT,
  prix_pass_eur NUMERIC(7, 2) NOT NULL,
  total_individuel_eur NUMERIC(7, 2) NOT NULL,
  economie_eur NUMERIC(7, 2) NOT NULL,
  rentable BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pass_calc_user ON yatra.vacances_pass_calculations(user_id, created_at DESC);

ALTER TABLE yatra.vacances_pass_calculations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_pass_calculations' AND policyname='pass_calc_self_all') THEN
    CREATE POLICY pass_calc_self_all ON yatra.vacances_pass_calculations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.vacances_pass_calculations TO authenticated, service_role;
