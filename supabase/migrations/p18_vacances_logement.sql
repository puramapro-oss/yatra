-- YATRA — Migration P18 (VACANCES V2.0 §3 — Logement à 0€)
-- Suivi des économies réalisées (déclaratif utilisateur, alimente le compteur §10).
-- Idempotent.

SET search_path = yatra, public;

CREATE TABLE IF NOT EXISTS yatra.vacances_logement_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('house_sitting', 'echange_maison', 'volontariat')),
  destination TEXT,
  nuits INT NOT NULL CHECK (nuits > 0),
  cout_evite_min_eur NUMERIC(7, 2) NOT NULL,
  cout_evite_max_eur NUMERIC(7, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logement_usage_user ON yatra.vacances_logement_usage(user_id, created_at DESC);

ALTER TABLE yatra.vacances_logement_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_logement_usage' AND policyname='logement_usage_self_all') THEN
    CREATE POLICY logement_usage_self_all ON yatra.vacances_logement_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.vacances_logement_usage TO authenticated, service_role;
