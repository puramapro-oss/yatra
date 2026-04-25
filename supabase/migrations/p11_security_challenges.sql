-- YATRA — Migration P11 : Sécurité Vivante + Challenges Stake + 4 Rangs avantages.
-- Trust Score 0-100 + signalements zones dangereuses + challenges staking € + RPC atomiques.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. trust_scores — score 0-100 par user (anti-fraude / réputation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.trust_scores (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 50 CHECK (score BETWEEN 0 AND 100),
  proofs_ok INT NOT NULL DEFAULT 0,
  proofs_failed INT NOT NULL DEFAULT 0,
  audits_passed INT NOT NULL DEFAULT 0,
  audits_failed INT NOT NULL DEFAULT 0,
  reports_credible INT NOT NULL DEFAULT 0, -- signalements jugés utiles
  reports_invalid INT NOT NULL DEFAULT 0,  -- signalements rejetés / spam
  last_event_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_scores_score ON yatra.trust_scores(score DESC);

-- ============================================================================
-- 2. trust_events — append-only ledger des événements impactant le score
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.trust_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'proof_ok',
    'proof_failed',
    'audit_pass',
    'audit_fail',
    'suspect_speed',
    'multi_account_flag',
    'safety_report_credible',
    'safety_report_invalid',
    'challenge_completed',
    'challenge_failed',
    'manual_admin_adjust'
  )),
  delta INT NOT NULL CHECK (delta BETWEEN -50 AND 50),
  reason TEXT,
  source_id UUID, -- trip_id, challenge_id, report_id, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trust_events_user ON yatra.trust_events(user_id, created_at DESC);

-- ============================================================================
-- 3. challenges_stake — défis avec mise en jeu €
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.challenges_stake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_slug TEXT NOT NULL, -- 'no-car-7d', 'walk-30d', etc.
  duration_days INT NOT NULL CHECK (duration_days IN (7, 30, 90)),
  stake_amount_eur NUMERIC(10, 2) NOT NULL CHECK (stake_amount_eur >= 5 AND stake_amount_eur <= 200),
  reward_target_eur NUMERIC(10, 2) NOT NULL CHECK (reward_target_eur > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed', 'frozen')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL,
  proofs_done INT NOT NULL DEFAULT 0,
  proofs_required INT NOT NULL,
  trust_score_at_start INT NOT NULL,
  jackpot_eur NUMERIC(10, 2),  -- bonus payout si complété
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_challenges_stake_user_status ON yatra.challenges_stake(user_id, status);
CREATE INDEX IF NOT EXISTS idx_challenges_stake_active ON yatra.challenges_stake(status, end_date) WHERE status = 'active';

-- ============================================================================
-- 4. challenge_days — preuves journalières
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.challenge_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES yatra.challenges_stake(id) ON DELETE CASCADE,
  day_index INT NOT NULL CHECK (day_index >= 1),
  day_date DATE NOT NULL,
  proof_type TEXT NOT NULL CHECK (proof_type IN ('trip_clean', 'photo_code', 'gps_zone', 'self_declared')),
  proof_value JSONB,        -- {trip_id, code, lat/lon, etc.}
  validated BOOLEAN NOT NULL DEFAULT false,
  validated_at TIMESTAMPTZ,
  fraud_score INT,          -- si proof type=trip_clean copie le fraud_score du trip
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id, day_index),
  UNIQUE (challenge_id, day_date)
);

CREATE INDEX IF NOT EXISTS idx_challenge_days_challenge ON yatra.challenge_days(challenge_id);

-- ============================================================================
-- 5. challenge_payouts — historique payouts (gain ou perte)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.challenge_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES yatra.challenges_stake(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  outcome TEXT NOT NULL CHECK (outcome IN ('won', 'lost')),
  stake_returned_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  reward_won_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  jackpot_won_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  trust_delta INT NOT NULL DEFAULT 0,
  fees_taken_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  wallet_transaction_id UUID, -- lien vers wallet_transactions si gain
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (challenge_id) -- 1 payout définitif par challenge
);

CREATE INDEX IF NOT EXISTS idx_challenge_payouts_user ON yatra.challenge_payouts(user_id, created_at DESC);

-- ============================================================================
-- 6. safety_reports — signalements zones dangereuses GPS communautaires
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.safety_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'travaux',
    'eclairage',
    'voirie_degradee',
    'agression',
    'vol',
    'circulation_dangereuse',
    'autre'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'danger')),
  lat NUMERIC(10, 6) NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lon NUMERIC(10, 6) NOT NULL CHECK (lon BETWEEN -180 AND 180),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 500),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
  upvotes INT NOT NULL DEFAULT 0,
  downvotes INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_reports_active_geo ON yatra.safety_reports(status, lat, lon)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_safety_reports_user ON yatra.safety_reports(user_id, created_at DESC);

-- ============================================================================
-- 7. RLS + GRANTS
-- ============================================================================
ALTER TABLE yatra.trust_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.trust_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.challenges_stake ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.challenge_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.challenge_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.safety_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS trust_scores_self_read ON yatra.trust_scores;
CREATE POLICY trust_scores_self_read ON yatra.trust_scores
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS trust_events_self_read ON yatra.trust_events;
CREATE POLICY trust_events_self_read ON yatra.trust_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS challenges_stake_self_read ON yatra.challenges_stake;
CREATE POLICY challenges_stake_self_read ON yatra.challenges_stake
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS challenge_days_self_read ON yatra.challenge_days;
CREATE POLICY challenge_days_self_read ON yatra.challenge_days
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM yatra.challenges_stake c WHERE c.id = challenge_id AND c.user_id = auth.uid())
  );

DROP POLICY IF EXISTS challenge_payouts_self_read ON yatra.challenge_payouts;
CREATE POLICY challenge_payouts_self_read ON yatra.challenge_payouts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- safety_reports : tout authenticated peut lire les zones actives, mais signaler/modifier que les siennes
DROP POLICY IF EXISTS safety_reports_authenticated_read ON yatra.safety_reports;
CREATE POLICY safety_reports_authenticated_read ON yatra.safety_reports
  FOR SELECT TO authenticated USING (status = 'active');

DROP POLICY IF EXISTS safety_reports_self_write ON yatra.safety_reports;
CREATE POLICY safety_reports_self_write ON yatra.safety_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS safety_reports_self_update ON yatra.safety_reports;
CREATE POLICY safety_reports_self_update ON yatra.safety_reports
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 8. Trigger updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trust_scores_updated_at ON yatra.trust_scores;
CREATE TRIGGER trust_scores_updated_at BEFORE UPDATE ON yatra.trust_scores
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

DROP TRIGGER IF EXISTS challenges_stake_updated_at ON yatra.challenges_stake;
CREATE TRIGGER challenges_stake_updated_at BEFORE UPDATE ON yatra.challenges_stake
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

DROP TRIGGER IF EXISTS safety_reports_updated_at ON yatra.safety_reports;
CREATE TRIGGER safety_reports_updated_at BEFORE UPDATE ON yatra.safety_reports
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

-- ============================================================================
-- 9. RPC start_challenge_stake_v1 — atomique : check Trust + insert challenge + insert N challenge_days + record event
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.start_challenge_stake_v1(
  p_user_id UUID,
  p_template_slug TEXT,
  p_duration_days INT,
  p_stake_amount_eur NUMERIC,
  p_reward_target_eur NUMERIC,
  p_proof_type TEXT,
  p_proofs_required INT
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_trust_score INT;
  v_challenge_id UUID;
  v_active_count INT;
  i INT;
  v_start DATE := CURRENT_DATE;
  v_end DATE := CURRENT_DATE + (p_duration_days - 1);
BEGIN
  -- Trust score requis : 30 minimum pour staker (évite multi-account spam)
  SELECT COALESCE(score, 50) INTO v_trust_score FROM yatra.trust_scores WHERE user_id = p_user_id;
  IF v_trust_score IS NULL THEN
    INSERT INTO yatra.trust_scores (user_id, score) VALUES (p_user_id, 50);
    v_trust_score := 50;
  END IF;

  IF v_trust_score < 30 THEN
    RAISE EXCEPTION 'trust_too_low';
  END IF;

  -- Max 1 challenge actif simultanément MVP
  SELECT COUNT(*) INTO v_active_count
  FROM yatra.challenges_stake
  WHERE user_id = p_user_id AND status = 'active';

  IF v_active_count > 0 THEN
    RAISE EXCEPTION 'already_active';
  END IF;

  INSERT INTO yatra.challenges_stake (
    user_id, template_slug, duration_days, stake_amount_eur, reward_target_eur,
    proofs_required, trust_score_at_start, start_date, end_date
  ) VALUES (
    p_user_id, p_template_slug, p_duration_days, p_stake_amount_eur, p_reward_target_eur,
    p_proofs_required, v_trust_score, v_start, v_end
  ) RETURNING id INTO v_challenge_id;

  -- Pré-créer les N challenge_days (1 entrée par jour, validated=false)
  FOR i IN 1..p_duration_days LOOP
    INSERT INTO yatra.challenge_days (challenge_id, day_index, day_date, proof_type)
    VALUES (v_challenge_id, i, v_start + (i - 1), p_proof_type);
  END LOOP;

  RETURN jsonb_build_object(
    'challenge_id', v_challenge_id,
    'start_date', v_start,
    'end_date', v_end,
    'proofs_required', p_proofs_required,
    'trust_score_at_start', v_trust_score
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.start_challenge_stake_v1(UUID, TEXT, INT, NUMERIC, NUMERIC, TEXT, INT) TO authenticated, service_role;

-- ============================================================================
-- 10. RPC submit_challenge_proof_v1 — valide la preuve du jour
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.submit_challenge_proof_v1(
  p_user_id UUID,
  p_challenge_id UUID,
  p_day_date DATE,
  p_proof_value JSONB,
  p_fraud_score INT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_challenge yatra.challenges_stake%ROWTYPE;
  v_day yatra.challenge_days%ROWTYPE;
  v_total_validated INT;
BEGIN
  SELECT * INTO v_challenge FROM yatra.challenges_stake
    WHERE id = p_challenge_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'challenge_not_found';
  END IF;
  IF v_challenge.status <> 'active' THEN
    RAISE EXCEPTION 'challenge_not_active';
  END IF;
  IF p_day_date < v_challenge.start_date OR p_day_date > v_challenge.end_date THEN
    RAISE EXCEPTION 'day_out_of_range';
  END IF;

  SELECT * INTO v_day FROM yatra.challenge_days
    WHERE challenge_id = p_challenge_id AND day_date = p_day_date FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'day_not_found';
  END IF;
  IF v_day.validated THEN
    RAISE EXCEPTION 'day_already_validated';
  END IF;

  -- Validation : si preuve de type trip_clean avec fraud_score, on rejette si fraud >=60
  IF v_day.proof_type = 'trip_clean' AND p_fraud_score IS NOT NULL AND p_fraud_score >= 60 THEN
    UPDATE yatra.challenge_days
      SET proof_value = p_proof_value, fraud_score = p_fraud_score, validated = false, validated_at = NOW()
      WHERE id = v_day.id;
    RAISE EXCEPTION 'proof_fraud_detected';
  END IF;

  -- Sinon validate
  UPDATE yatra.challenge_days
    SET proof_value = p_proof_value,
        fraud_score = p_fraud_score,
        validated = true,
        validated_at = NOW()
    WHERE id = v_day.id;

  -- Bump compteur sur challenge
  SELECT COUNT(*) INTO v_total_validated
    FROM yatra.challenge_days WHERE challenge_id = p_challenge_id AND validated = true;

  UPDATE yatra.challenges_stake
    SET proofs_done = v_total_validated, updated_at = NOW()
    WHERE id = p_challenge_id;

  RETURN jsonb_build_object(
    'day_id', v_day.id,
    'day_index', v_day.day_index,
    'proofs_done', v_total_validated,
    'proofs_required', v_challenge.proofs_required
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.submit_challenge_proof_v1(UUID, UUID, DATE, JSONB, INT) TO authenticated, service_role;

-- ============================================================================
-- 11. RPC complete_challenge_v1 — clôt le challenge (won/lost) + payout + crédite wallet
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.complete_challenge_v1(
  p_user_id UUID,
  p_challenge_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_challenge yatra.challenges_stake%ROWTYPE;
  v_total_validated INT;
  v_outcome TEXT;
  v_stake_returned NUMERIC := 0;
  v_reward_won NUMERIC := 0;
  v_trust_delta INT := 0;
  v_fees NUMERIC := 0;
  v_payout_id UUID;
  v_wtx_id UUID;
BEGIN
  SELECT * INTO v_challenge FROM yatra.challenges_stake
    WHERE id = p_challenge_id AND user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'challenge_not_found';
  END IF;
  IF v_challenge.status <> 'active' THEN
    RAISE EXCEPTION 'challenge_not_active';
  END IF;
  IF CURRENT_DATE < v_challenge.end_date THEN
    RAISE EXCEPTION 'too_early';
  END IF;

  SELECT COUNT(*) INTO v_total_validated
    FROM yatra.challenge_days WHERE challenge_id = p_challenge_id AND validated = true;

  IF v_total_validated >= v_challenge.proofs_required THEN
    v_outcome := 'won';
    v_stake_returned := v_challenge.stake_amount_eur;
    v_reward_won := v_challenge.reward_target_eur;
    v_trust_delta := 5;
  ELSE
    v_outcome := 'lost';
    v_fees := v_challenge.stake_amount_eur; -- la mise est redistribuée (cagnottes/jackpots futur)
    v_trust_delta := -3;
  END IF;

  -- Créer payout (UNIQUE sur challenge_id donc atomique)
  INSERT INTO yatra.challenge_payouts (
    challenge_id, user_id, outcome, stake_returned_eur, reward_won_eur, trust_delta, fees_taken_eur
  ) VALUES (
    p_challenge_id, p_user_id, v_outcome, v_stake_returned, v_reward_won, v_trust_delta, v_fees
  ) RETURNING id INTO v_payout_id;

  -- Update challenge status
  UPDATE yatra.challenges_stake
    SET status = CASE WHEN v_outcome = 'won' THEN 'completed' ELSE 'failed' END,
        updated_at = NOW()
    WHERE id = p_challenge_id;

  -- Si won : créditer wallet (stake retour + reward) en utilisant credit_wallet_v1 path direct
  IF v_outcome = 'won' AND (v_stake_returned + v_reward_won) > 0 THEN
    INSERT INTO yatra.wallet_transactions (user_id, amount, source, description, source_id, balance_after)
    SELECT
      p_user_id,
      (v_stake_returned + v_reward_won),
      'mission'::text,
      'Challenge réussi · ' || v_challenge.template_slug,
      p_challenge_id,
      COALESCE((SELECT balance FROM yatra.wallets WHERE user_id = p_user_id), 0) + (v_stake_returned + v_reward_won)
    RETURNING id INTO v_wtx_id;

    INSERT INTO yatra.wallets (user_id, balance, total_earned)
    VALUES (p_user_id, v_stake_returned + v_reward_won, v_stake_returned + v_reward_won)
    ON CONFLICT (user_id) DO UPDATE
      SET balance = yatra.wallets.balance + (v_stake_returned + v_reward_won),
          total_earned = yatra.wallets.total_earned + (v_stake_returned + v_reward_won),
          updated_at = NOW();

    UPDATE yatra.challenge_payouts SET wallet_transaction_id = v_wtx_id WHERE id = v_payout_id;
  END IF;

  -- Trust event
  INSERT INTO yatra.trust_events (user_id, event_type, delta, reason, source_id)
  VALUES (
    p_user_id,
    CASE WHEN v_outcome = 'won' THEN 'challenge_completed' ELSE 'challenge_failed' END,
    v_trust_delta,
    'Challenge ' || v_challenge.template_slug || ' (' || v_total_validated || '/' || v_challenge.proofs_required || ')',
    p_challenge_id
  );

  -- Update trust_scores agrégat
  INSERT INTO yatra.trust_scores (user_id, score, last_event_at)
  VALUES (p_user_id, GREATEST(0, LEAST(100, 50 + v_trust_delta)), NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET score = GREATEST(0, LEAST(100, yatra.trust_scores.score + v_trust_delta)),
        last_event_at = NOW(),
        updated_at = NOW();

  RETURN jsonb_build_object(
    'payout_id', v_payout_id,
    'outcome', v_outcome,
    'proofs_validated', v_total_validated,
    'proofs_required', v_challenge.proofs_required,
    'stake_returned_eur', v_stake_returned,
    'reward_won_eur', v_reward_won,
    'trust_delta', v_trust_delta,
    'wallet_transaction_id', v_wtx_id
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.complete_challenge_v1(UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- 12. RPC report_safety_v1 — signaler une zone (vérifie pas trop de spam)
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.report_safety_v1(
  p_user_id UUID,
  p_category TEXT,
  p_severity TEXT,
  p_lat NUMERIC,
  p_lon NUMERIC,
  p_description TEXT
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_recent_count INT;
  v_trust INT;
  v_report_id UUID;
BEGIN
  -- Anti-spam : max 5 reports par user dans la dernière heure
  SELECT COUNT(*) INTO v_recent_count
  FROM yatra.safety_reports
  WHERE user_id = p_user_id AND created_at > NOW() - INTERVAL '1 hour';

  IF v_recent_count >= 5 THEN
    RAISE EXCEPTION 'too_many_reports';
  END IF;

  -- Trust >= 20 requis (anti-multi-account spam)
  SELECT COALESCE(score, 50) INTO v_trust FROM yatra.trust_scores WHERE user_id = p_user_id;
  IF v_trust IS NULL THEN
    INSERT INTO yatra.trust_scores (user_id, score) VALUES (p_user_id, 50);
    v_trust := 50;
  END IF;
  IF v_trust < 20 THEN
    RAISE EXCEPTION 'trust_too_low';
  END IF;

  INSERT INTO yatra.safety_reports (user_id, category, severity, lat, lon, description)
  VALUES (p_user_id, p_category, p_severity, p_lat, p_lon, p_description)
  RETURNING id INTO v_report_id;

  RETURN jsonb_build_object('report_id', v_report_id);
END $$;

GRANT EXECUTE ON FUNCTION yatra.report_safety_v1(UUID, TEXT, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 13. RPC record_trust_event_v1 — append event + recompute aggregate
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.record_trust_event_v1(
  p_user_id UUID,
  p_event_type TEXT,
  p_delta INT,
  p_reason TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_event_id UUID;
  v_new_score INT;
BEGIN
  INSERT INTO yatra.trust_events (user_id, event_type, delta, reason, source_id)
  VALUES (p_user_id, p_event_type, p_delta, p_reason, p_source_id)
  RETURNING id INTO v_event_id;

  -- Met à jour agrégat (insert si manquant à 50)
  INSERT INTO yatra.trust_scores (user_id, score, last_event_at)
  VALUES (p_user_id, GREATEST(0, LEAST(100, 50 + p_delta)), NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET score = GREATEST(0, LEAST(100, yatra.trust_scores.score + p_delta)),
        proofs_ok = yatra.trust_scores.proofs_ok + CASE WHEN p_event_type = 'proof_ok' THEN 1 ELSE 0 END,
        proofs_failed = yatra.trust_scores.proofs_failed + CASE WHEN p_event_type = 'proof_failed' THEN 1 ELSE 0 END,
        audits_passed = yatra.trust_scores.audits_passed + CASE WHEN p_event_type = 'audit_pass' THEN 1 ELSE 0 END,
        audits_failed = yatra.trust_scores.audits_failed + CASE WHEN p_event_type = 'audit_fail' THEN 1 ELSE 0 END,
        reports_credible = yatra.trust_scores.reports_credible + CASE WHEN p_event_type = 'safety_report_credible' THEN 1 ELSE 0 END,
        reports_invalid = yatra.trust_scores.reports_invalid + CASE WHEN p_event_type = 'safety_report_invalid' THEN 1 ELSE 0 END,
        last_event_at = NOW(),
        updated_at = NOW();

  SELECT score INTO v_new_score FROM yatra.trust_scores WHERE user_id = p_user_id;

  RETURN jsonb_build_object('event_id', v_event_id, 'new_score', v_new_score);
END $$;

GRANT EXECUTE ON FUNCTION yatra.record_trust_event_v1(UUID, TEXT, INT, TEXT, UUID) TO authenticated, service_role;
