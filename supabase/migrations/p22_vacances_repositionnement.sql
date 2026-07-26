-- YATRA — Migration P22 (VACANCES V2.0 §9 — Repositionnement & dernière minute)
-- Suivi des économies réalisées (déclaratif utilisateur, alimente le compteur §10).
-- Idempotent.

SET search_path = yatra, public;

CREATE TABLE IF NOT EXISTS yatra.vacances_repositionnement_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('convoyage_vehicule', 'location_aller_simple', 'vol_repositionnement', 'croisiere_derniere_minute')),
  description TEXT,
  prix_normal_estime_eur NUMERIC(8, 2) NOT NULL CHECK (prix_normal_estime_eur >= 0),
  prix_paye_eur NUMERIC(8, 2) NOT NULL CHECK (prix_paye_eur >= 0),
  economie_eur NUMERIC(8, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repositionnement_usage_user ON yatra.vacances_repositionnement_usage(user_id, created_at DESC);

ALTER TABLE yatra.vacances_repositionnement_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_repositionnement_usage' AND policyname='repositionnement_usage_self_all') THEN
    CREATE POLICY repositionnement_usage_self_all ON yatra.vacances_repositionnement_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.vacances_repositionnement_usage TO authenticated, service_role;
