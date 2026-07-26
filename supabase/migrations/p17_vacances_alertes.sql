-- YATRA — Migration P17 (VACANCES V2.0 §1 — Alertes erreurs de tarif & bons plans)
-- Veille via Tavily (même pattern que p5_aides.sql / api/cron/aides-research) : recherche web
-- réelle de bons plans/erreurs de tarif publiés, jamais un prix de vol inventé.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. CONFIGS D'ALERTE UTILISATEUR
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_alert_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  aeroport_depart TEXT NOT NULL,
  destination_souhaitee TEXT NOT NULL,
  budget_max_eur NUMERIC(7, 2),
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_configs_actif ON yatra.vacances_alert_configs(actif) WHERE actif = true;

-- ============================================================================
-- 2. BONS PLANS / ERREURS DE TARIF DÉTECTÉS (veille Tavily, pool partagé)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_deals_found (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  extrait TEXT,
  prix_detecte_eur NUMERIC(7, 2),
  destination_matched TEXT,
  source_score NUMERIC(4, 3),
  published_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deals_found_created ON yatra.vacances_deals_found(created_at DESC);

-- ============================================================================
-- 3. NOTIFICATIONS UTILISATEUR (deal ↔ config qui matche)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  config_id UUID NOT NULL REFERENCES yatra.vacances_alert_configs(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES yatra.vacances_deals_found(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (config_id, deal_id)
);

CREATE INDEX IF NOT EXISTS idx_alert_notif_user ON yatra.vacances_alert_notifications(user_id, created_at DESC);

-- ============================================================================
-- 4. RLS
-- ============================================================================
ALTER TABLE yatra.vacances_alert_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_deals_found ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_alert_notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_alert_configs' AND policyname='alert_configs_self_all') THEN
    CREATE POLICY alert_configs_self_all ON yatra.vacances_alert_configs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_deals_found' AND policyname='deals_found_read_all') THEN
    CREATE POLICY deals_found_read_all ON yatra.vacances_deals_found FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_alert_notifications' AND policyname='alert_notif_self_all') THEN
    CREATE POLICY alert_notif_self_all ON yatra.vacances_alert_notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.vacances_alert_configs TO authenticated, service_role;
GRANT SELECT ON yatra.vacances_deals_found TO authenticated;
GRANT ALL ON yatra.vacances_deals_found TO service_role;
GRANT ALL ON yatra.vacances_alert_notifications TO authenticated, service_role;
