-- YATRA — Migration P12 : Programme Ambassadeur + Jeux Concours + Pub interne + Pool Balances.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. ambassadeur_profiles — programme ambassadeur (creator/influenceur)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.ambassadeur_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,30}$'),
  bio TEXT CHECK (length(bio) <= 500),
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb, -- {instagram, tiktok, youtube, twitter, linkedin}
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'banned')),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'argent', 'or', 'platine', 'diamant', 'legende', 'titan', 'eternel')),
  total_clicks INT NOT NULL DEFAULT 0,
  total_signups INT NOT NULL DEFAULT 0,
  total_conversions INT NOT NULL DEFAULT 0,
  total_earnings_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
  free_plan_granted BOOLEAN NOT NULL DEFAULT false,
  kit_downloaded BOOLEAN NOT NULL DEFAULT false,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambassadeur_user ON yatra.ambassadeur_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassadeur_slug ON yatra.ambassadeur_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_ambassadeur_tier ON yatra.ambassadeur_profiles(tier, total_earnings_eur DESC);

-- ============================================================================
-- 2. ambassadeur_clicks — tracking impression
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.ambassadeur_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  ambassadeur_id UUID REFERENCES yatra.ambassadeur_profiles(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,           -- SHA-256
  ua_truncated TEXT,
  referer TEXT,
  utm JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambassadeur_clicks_slug ON yatra.ambassadeur_clicks(slug, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ambassadeur_clicks_ambassador ON yatra.ambassadeur_clicks(ambassadeur_id, created_at DESC);

-- ============================================================================
-- 3. ambassadeur_conversions — signup conversion + paid event
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.ambassadeur_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassadeur_id UUID NOT NULL REFERENCES yatra.ambassadeur_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'first_payment', 'recurring')),
  amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_pct NUMERIC(5, 2),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ambassadeur_id, user_id, event_type) -- 1 conversion par event_type par couple
);

CREATE INDEX IF NOT EXISTS idx_ambassadeur_conv_ambassador ON yatra.ambassadeur_conversions(ambassadeur_id, created_at DESC);

-- ============================================================================
-- 4. contests_results — résultats classement/tirage/spécial
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.contests_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('weekly_performance', 'monthly_lottery', 'quarterly_special')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_pool_eur NUMERIC(10, 2) NOT NULL,
  winners JSONB NOT NULL,       -- [{user_id, rank, amount_eur, score}]
  total_distributed_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('upcoming', 'live', 'completed')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_contests_results_type ON yatra.contests_results(type, period_end DESC);

-- ============================================================================
-- 5. contests_entries — entrées user dans le concours en cours
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.contests_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contest_type TEXT NOT NULL CHECK (contest_type IN ('weekly_performance', 'monthly_lottery', 'quarterly_special')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  score NUMERIC(12, 2) NOT NULL DEFAULT 0, -- pour weekly
  tickets INT NOT NULL DEFAULT 0,           -- pour monthly_lottery
  eligible BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, contest_type, period_start)
);

CREATE INDEX IF NOT EXISTS idx_contests_entries_lookup ON yatra.contests_entries(contest_type, period_start, score DESC);

-- ============================================================================
-- 6. pool_balances — réserves (reward, asso, partner)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.pool_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_type TEXT NOT NULL UNIQUE CHECK (pool_type IN ('reward', 'asso', 'partner', 'jackpot_lottery', 'jackpot_special')),
  balance_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_in_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total_out_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
  last_in_at TIMESTAMPTZ,
  last_out_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. pool_transactions — ledger append-only des mouvements pool
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.pool_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id UUID NOT NULL REFERENCES yatra.pool_balances(id) ON DELETE CASCADE,
  amount_eur NUMERIC(12, 2) NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  reason TEXT NOT NULL CHECK (reason IN (
    'ca_revenue_share',
    'aide_deposit',
    'partner_deposit',
    'contest_payout_weekly',
    'contest_payout_monthly',
    'contest_payout_special',
    'asso_transfer',
    'admin_adjust'
  )),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pool_tx_pool ON yatra.pool_transactions(pool_id, created_at DESC);

-- ============================================================================
-- 8. cross_promos — bannières cross-app entre apps Purama
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.cross_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app TEXT NOT NULL DEFAULT 'yatra',
  target_app TEXT NOT NULL,
  headline TEXT NOT NULL CHECK (length(headline) BETWEEN 4 AND 80),
  body TEXT NOT NULL CHECK (length(body) BETWEEN 10 AND 200),
  emoji TEXT,
  cta_label TEXT NOT NULL,
  deeplink TEXT NOT NULL,           -- https://kaia.purama.dev?ref=yatra-cross
  category TEXT NOT NULL,           -- mobilite, sante, finance, juridique, ecologie
  active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 50, -- 0-100, plus haut = plus prioritaire
  views INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_promos_active ON yatra.cross_promos(active, priority DESC) WHERE active = true;

-- ============================================================================
-- 9. RLS + GRANTS
-- ============================================================================
ALTER TABLE yatra.ambassadeur_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.contests_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.contests_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.pool_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.pool_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.cross_promos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ambassadeur_profiles_self ON yatra.ambassadeur_profiles;
CREATE POLICY ambassadeur_profiles_self ON yatra.ambassadeur_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS ambassadeur_profiles_self_insert ON yatra.ambassadeur_profiles;
CREATE POLICY ambassadeur_profiles_self_insert ON yatra.ambassadeur_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ambassadeur_profiles_self_update ON yatra.ambassadeur_profiles;
CREATE POLICY ambassadeur_profiles_self_update ON yatra.ambassadeur_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS ambassadeur_conv_self ON yatra.ambassadeur_conversions;
CREATE POLICY ambassadeur_conv_self ON yatra.ambassadeur_conversions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles a WHERE a.id = ambassadeur_id AND a.user_id = auth.uid())
  );

DROP POLICY IF EXISTS contests_results_authenticated ON yatra.contests_results;
CREATE POLICY contests_results_authenticated ON yatra.contests_results
  FOR SELECT TO authenticated USING (status = 'completed');

DROP POLICY IF EXISTS contests_entries_self ON yatra.contests_entries;
CREATE POLICY contests_entries_self ON yatra.contests_entries
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS cross_promos_authenticated ON yatra.cross_promos;
CREATE POLICY cross_promos_authenticated ON yatra.cross_promos
  FOR SELECT TO authenticated USING (active = true);

-- ============================================================================
-- 10. Triggers updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS ambassadeur_profiles_updated_at ON yatra.ambassadeur_profiles;
CREATE TRIGGER ambassadeur_profiles_updated_at BEFORE UPDATE ON yatra.ambassadeur_profiles
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

DROP TRIGGER IF EXISTS contests_entries_updated_at ON yatra.contests_entries;
CREATE TRIGGER contests_entries_updated_at BEFORE UPDATE ON yatra.contests_entries
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

DROP TRIGGER IF EXISTS pool_balances_updated_at ON yatra.pool_balances;
CREATE TRIGGER pool_balances_updated_at BEFORE UPDATE ON yatra.pool_balances
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

-- ============================================================================
-- 11. Seed pool_balances (5 pools)
-- ============================================================================
INSERT INTO yatra.pool_balances (pool_type, balance_eur)
VALUES
  ('reward', 0),
  ('asso', 0),
  ('partner', 0),
  ('jackpot_lottery', 0),
  ('jackpot_special', 0)
ON CONFLICT (pool_type) DO NOTHING;

-- ============================================================================
-- 12. Seed cross_promos — 6 cross-promos vers autres apps Purama
-- ============================================================================
INSERT INTO yatra.cross_promos (target_app, headline, body, emoji, cta_label, deeplink, category, priority)
VALUES
  ('kaia', 'Pris·e à la gorge ?', 'KAIA, ton médecin de poche IA. 7j/7. Réponse en 30s. Gratuit pour démarrer.', '🩺', 'Découvrir KAIA', 'https://kaia.purama.dev?ref=yatra-cross', 'sante', 80),
  ('kash', 'Tu gagnes 2058€/m perso ?', 'KASH automatise CCA + IK Tesla + holding fiscale. 0€ URSSAF. Optim live.', '💰', 'Découvrir KASH', 'https://kash.purama.dev?ref=yatra-cross', 'finance', 70),
  ('jurispurama', 'Souci juridique ?', 'JurisPurama, avocat 30 ans IA. Contrats, conflits, droits. Réponse 2 min.', '⚖️', 'Découvrir JurisPurama', 'https://jurispurama.purama.dev?ref=yatra-cross', 'juridique', 75),
  ('vida_aide', 'Tu paies des aides ?', 'VIDA Aide trouve toutes tes aides FR + EU. 200+ programmes. 0€.', '🏛️', 'Découvrir VIDA Aide', 'https://vida-aide.purama.dev?ref=yatra-cross', 'social', 65),
  ('prana', 'Stress ou fatigue ?', 'PRANA, coach respiration + cohérence cardiaque. 5 min/jour suffit.', '🌬️', 'Découvrir PRANA', 'https://prana.purama.dev?ref=yatra-cross', 'sante', 60),
  ('exodus', 'Trop de temps écran ?', 'EXODUS te déconnecte. Missions anti-écran avec récompenses. iOS+Android.', '📵', 'Découvrir EXODUS', 'https://exodus.purama.dev?ref=yatra-cross', 'sante', 55)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 13. RPC apply_ambassadeur_v1 — création profil avec slug check + retry
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.apply_ambassadeur_v1(
  p_user_id UUID,
  p_slug TEXT,
  p_bio TEXT,
  p_social_links JSONB
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_id UUID;
BEGIN
  IF p_slug IS NULL OR length(p_slug) < 3 THEN
    RAISE EXCEPTION 'invalid_slug';
  END IF;

  IF EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'already_ambassador';
  END IF;
  IF EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles WHERE slug = lower(p_slug)) THEN
    RAISE EXCEPTION 'slug_taken';
  END IF;

  INSERT INTO yatra.ambassadeur_profiles (user_id, slug, bio, social_links)
  VALUES (p_user_id, lower(p_slug), p_bio, COALESCE(p_social_links, '{}'::jsonb))
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('ambassadeur_id', v_id, 'slug', lower(p_slug));
END $$;

GRANT EXECUTE ON FUNCTION yatra.apply_ambassadeur_v1(UUID, TEXT, TEXT, JSONB) TO authenticated, service_role;

-- ============================================================================
-- 14. RPC pool_credit_v1 / pool_debit_v1 — atomiques
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.pool_credit_v1(
  p_pool_type TEXT,
  p_amount_eur NUMERIC,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_pool yatra.pool_balances%ROWTYPE;
  v_tx_id UUID;
BEGIN
  IF p_amount_eur <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_pool FROM yatra.pool_balances WHERE pool_type = p_pool_type FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pool_not_found';
  END IF;

  UPDATE yatra.pool_balances
    SET balance_eur = balance_eur + p_amount_eur,
        total_in_eur = total_in_eur + p_amount_eur,
        last_in_at = NOW()
    WHERE id = v_pool.id;

  INSERT INTO yatra.pool_transactions (pool_id, amount_eur, direction, reason, metadata)
  VALUES (v_pool.id, p_amount_eur, 'in', p_reason, p_metadata)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('tx_id', v_tx_id, 'pool_id', v_pool.id, 'new_balance_eur', v_pool.balance_eur + p_amount_eur);
END $$;

GRANT EXECUTE ON FUNCTION yatra.pool_credit_v1(TEXT, NUMERIC, TEXT, JSONB) TO service_role;

CREATE OR REPLACE FUNCTION yatra.pool_debit_v1(
  p_pool_type TEXT,
  p_amount_eur NUMERIC,
  p_reason TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_pool yatra.pool_balances%ROWTYPE;
  v_tx_id UUID;
BEGIN
  IF p_amount_eur <= 0 THEN
    RAISE EXCEPTION 'invalid_amount';
  END IF;

  SELECT * INTO v_pool FROM yatra.pool_balances WHERE pool_type = p_pool_type FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'pool_not_found';
  END IF;

  IF v_pool.balance_eur < p_amount_eur THEN
    RAISE EXCEPTION 'insufficient_pool_balance';
  END IF;

  UPDATE yatra.pool_balances
    SET balance_eur = balance_eur - p_amount_eur,
        total_out_eur = total_out_eur + p_amount_eur,
        last_out_at = NOW()
    WHERE id = v_pool.id;

  INSERT INTO yatra.pool_transactions (pool_id, amount_eur, direction, reason, metadata)
  VALUES (v_pool.id, p_amount_eur, 'out', p_reason, p_metadata)
  RETURNING id INTO v_tx_id;

  RETURN jsonb_build_object('tx_id', v_tx_id, 'pool_id', v_pool.id, 'new_balance_eur', v_pool.balance_eur - p_amount_eur);
END $$;

GRANT EXECUTE ON FUNCTION yatra.pool_debit_v1(TEXT, NUMERIC, TEXT, JSONB) TO service_role;

-- ============================================================================
-- 15. RPC compute_weekly_score_v1 — score concours hebdo (parrainages×10 + abos×50 + actifs×5/j + missions×3)
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.compute_weekly_score_v1(
  p_user_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS NUMERIC
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_referrals INT;
  v_clean_trips INT;
  v_score NUMERIC;
  v_active_days INT;
BEGIN
  -- Parrainages actifs sur la période
  SELECT COUNT(*) INTO v_referrals
  FROM yatra.referrals
  WHERE referrer_id = p_user_id
    AND created_at::date BETWEEN p_period_start AND p_period_end
    AND status = 'active';

  -- Trajets propres validés (compt comme abonnement actif)
  SELECT COUNT(*) INTO v_clean_trips
  FROM yatra.trips
  WHERE user_id = p_user_id
    AND ended_at::date BETWEEN p_period_start AND p_period_end
    AND status = 'completed';

  -- Jours actifs (au moins 1 trip ou 1 message Aria)
  SELECT COUNT(DISTINCT activity_date) INTO v_active_days FROM (
    SELECT ended_at::date AS activity_date FROM yatra.trips
      WHERE user_id = p_user_id AND ended_at::date BETWEEN p_period_start AND p_period_end
    UNION
    SELECT created_at::date FROM yatra.aria_messages
      WHERE created_at::date BETWEEN p_period_start AND p_period_end
        AND conversation_id IN (
          SELECT id FROM yatra.aria_conversations WHERE user_id = p_user_id
        )
  ) AS act;

  v_score := (v_referrals * 10) + (v_clean_trips * 5) + (v_active_days * 5);

  RETURN ROUND(v_score, 2);
END $$;

GRANT EXECUTE ON FUNCTION yatra.compute_weekly_score_v1(UUID, DATE, DATE) TO authenticated, service_role;

-- ============================================================================
-- 16. RPC track_ambassador_click_v1 — atomique
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.track_ambassador_click_v1(
  p_slug TEXT,
  p_ip_hash TEXT,
  p_ua TEXT,
  p_referer TEXT,
  p_utm JSONB
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_amb_id UUID;
  v_click_id UUID;
BEGIN
  SELECT id INTO v_amb_id FROM yatra.ambassadeur_profiles WHERE slug = lower(p_slug) AND status = 'active';

  -- Insert click même si slug inconnu (pour analyse)
  INSERT INTO yatra.ambassadeur_clicks (slug, ambassadeur_id, ip_hash, ua_truncated, referer, utm)
  VALUES (lower(p_slug), v_amb_id, p_ip_hash, COALESCE(left(p_ua, 200), ''), p_referer, COALESCE(p_utm, '{}'::jsonb))
  RETURNING id INTO v_click_id;

  -- Bump compteur si ambassadeur trouvé
  IF v_amb_id IS NOT NULL THEN
    UPDATE yatra.ambassadeur_profiles
      SET total_clicks = total_clicks + 1, updated_at = NOW()
      WHERE id = v_amb_id;
  END IF;

  RETURN jsonb_build_object(
    'click_id', v_click_id,
    'ambassadeur_id', v_amb_id,
    'found', v_amb_id IS NOT NULL
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.track_ambassador_click_v1(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
