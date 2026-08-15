-- YATRA — Migration P15 : Mobilité V3 — Wake lock + Accéléro + Plafonds paliers ×1/×5/×10 + Pool reconciliation.
-- Barème VIDA_CREDITS_PER_KM migré en table éditable, plafonds journalier/mensuel par plan, ledger pool quotidien.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. mobility_rate_config — tarifs Vida Credits + CO₂ par mode (ex en dur wow.ts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.mobility_rate_config (
  mode TEXT PRIMARY KEY CHECK (mode IN ('marche', 'velo', 'trottinette', 'transport_public', 'covoiturage', 'train')),
  credits_per_km NUMERIC(5,2) NOT NULL CHECK (credits_per_km >= 0),
  co2_avoided_per_km NUMERIC(5,3) NOT NULL CHECK (co2_avoided_per_km >= 0),
  daily_cap_base_eur NUMERIC(6,2) NOT NULL DEFAULT 2.00 CHECK (daily_cap_base_eur >= 0),
  monthly_cap_base_eur NUMERIC(7,2) NOT NULL DEFAULT 50.00 CHECK (monthly_cap_base_eur >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed valeurs actuelles VIDA_CREDITS_PER_KM + CO2_AVOIDED_PER_KM (lib/wow.ts L9-28)
INSERT INTO yatra.mobility_rate_config (mode, credits_per_km, co2_avoided_per_km, daily_cap_base_eur, monthly_cap_base_eur)
VALUES
  ('marche', 0.10, 0.193, 2.00, 50.00),
  ('velo', 0.15, 0.193, 2.00, 50.00),
  ('trottinette', 0.10, 0.180, 2.00, 50.00),
  ('transport_public', 0.05, 0.150, 2.00, 50.00),
  ('covoiturage', 0.20, 0.130, 2.00, 50.00),
  ('train', 0.05, 0.180, 2.00, 50.00)
ON CONFLICT (mode) DO UPDATE SET
  credits_per_km = EXCLUDED.credits_per_km,
  co2_avoided_per_km = EXCLUDED.co2_avoided_per_km,
  daily_cap_base_eur = EXCLUDED.daily_cap_base_eur,
  monthly_cap_base_eur = EXCLUDED.monthly_cap_base_eur,
  updated_at = NOW();

COMMENT ON TABLE yatra.mobility_rate_config IS 'Tarifs Vida Credits + CO₂ évité par mode de mobilité propre. Éditable admin sans redéploiement.';

-- ============================================================================
-- 2. mobility_pool_ledger — ledger quotidien réconciliation pool
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.mobility_pool_ledger (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  total_distributed_eur NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (total_distributed_eur >= 0),
  budget_pool_eur NUMERIC(10,2) NOT NULL DEFAULT 5000.00 CHECK (budget_pool_eur >= 0),
  status TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'alerte')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE yatra.mobility_pool_ledger IS 'Réconciliation quotidienne pool mobilité. CRON /api/cron/mobilite-reconciliation.';

-- ============================================================================
-- RLS — authenticated read config, service_role write ledger
-- ============================================================================
ALTER TABLE yatra.mobility_rate_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.mobility_pool_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mobility_rate_config_authenticated_read ON yatra.mobility_rate_config;
CREATE POLICY mobility_rate_config_authenticated_read ON yatra.mobility_rate_config
  FOR SELECT TO authenticated USING (true);

-- service_role only write pool_ledger (via CRON)
DROP POLICY IF EXISTS mobility_pool_ledger_service_read ON yatra.mobility_pool_ledger;
CREATE POLICY mobility_pool_ledger_service_read ON yatra.mobility_pool_ledger
  FOR SELECT TO service_role USING (true);

DROP POLICY IF EXISTS mobility_pool_ledger_service_write ON yatra.mobility_pool_ledger;
CREATE POLICY mobility_pool_ledger_service_write ON yatra.mobility_pool_ledger
  FOR INSERT TO service_role WITH CHECK (true);

-- ============================================================================
-- GRANT
-- ============================================================================
GRANT SELECT ON yatra.mobility_rate_config TO authenticated;
GRANT SELECT ON yatra.mobility_pool_ledger TO service_role;
GRANT INSERT ON yatra.mobility_pool_ledger TO service_role;

-- Index performance queries daily/monthly caps
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_trip_clean_date ON yatra.wallet_transactions(user_id, created_at DESC)
  WHERE source = 'trip_clean';
