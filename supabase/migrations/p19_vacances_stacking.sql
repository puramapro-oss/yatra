-- YATRA — Migration P19 (VACANCES V2.0 §5 — Stacking automatique)
-- Journal des montants récupérés déclarés par l'utilisateur (cashback + code promo).
-- V1 guidé, pas de calcul automatique (pas de partenariat cashback voyage réel en place).
-- Idempotent.

SET search_path = yatra, public;

CREATE TABLE IF NOT EXISTS yatra.vacances_stacking_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  merchant TEXT NOT NULL,
  type_reservation TEXT NOT NULL CHECK (type_reservation IN ('vol', 'hotel', 'activite', 'location_voiture')),
  montant_reservation_eur NUMERIC(8, 2) NOT NULL,
  cashback_recupere_eur NUMERIC(7, 2) NOT NULL DEFAULT 0,
  code_promo_recupere_eur NUMERIC(7, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stacking_usage_user ON yatra.vacances_stacking_usage(user_id, created_at DESC);

ALTER TABLE yatra.vacances_stacking_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_stacking_usage' AND policyname='stacking_usage_self_all') THEN
    CREATE POLICY stacking_usage_self_all ON yatra.vacances_stacking_usage FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.vacances_stacking_usage TO authenticated, service_role;
