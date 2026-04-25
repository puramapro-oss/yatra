-- YATRA — Migration P12 fix : drop+recreate legacy ambassadeur tables.
-- Les tables P1 scaffolding ont un schéma différent et étaient vides.

SET search_path = yatra, public;

-- Drop dependencies first (cascade)
DROP TABLE IF EXISTS yatra.ambassadeur_conversions CASCADE;
DROP TABLE IF EXISTS yatra.ambassadeur_clicks CASCADE;
DROP TABLE IF EXISTS yatra.ambassadeur_profiles CASCADE;
DROP FUNCTION IF EXISTS yatra.apply_ambassadeur_v1(UUID, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS yatra.track_ambassador_click_v1(TEXT, TEXT, TEXT, TEXT, JSONB) CASCADE;

-- Recréer ambassadeur_profiles (P12 schema)
CREATE TABLE yatra.ambassadeur_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{3,30}$'),
  bio TEXT CHECK (length(bio) <= 500),
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
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

CREATE INDEX idx_ambassadeur_user ON yatra.ambassadeur_profiles(user_id);
CREATE INDEX idx_ambassadeur_slug ON yatra.ambassadeur_profiles(slug);
CREATE INDEX idx_ambassadeur_tier ON yatra.ambassadeur_profiles(tier, total_earnings_eur DESC);

CREATE TABLE yatra.ambassadeur_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL,
  ambassadeur_id UUID REFERENCES yatra.ambassadeur_profiles(id) ON DELETE SET NULL,
  ip_hash TEXT NOT NULL,
  ua_truncated TEXT,
  referer TEXT,
  utm JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassadeur_clicks_slug ON yatra.ambassadeur_clicks(slug, created_at DESC);
CREATE INDEX idx_ambassadeur_clicks_ambassador ON yatra.ambassadeur_clicks(ambassadeur_id, created_at DESC);

CREATE TABLE yatra.ambassadeur_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassadeur_id UUID NOT NULL REFERENCES yatra.ambassadeur_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('signup', 'first_payment', 'recurring')),
  amount_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  commission_pct NUMERIC(5, 2),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ambassadeur_id, user_id, event_type)
);

CREATE INDEX idx_ambassadeur_conv_ambassador ON yatra.ambassadeur_conversions(ambassadeur_id, created_at DESC);

-- RLS
ALTER TABLE yatra.ambassadeur_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY ambassadeur_profiles_self ON yatra.ambassadeur_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY ambassadeur_profiles_self_insert ON yatra.ambassadeur_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY ambassadeur_profiles_self_update ON yatra.ambassadeur_profiles
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY ambassadeur_conv_self ON yatra.ambassadeur_conversions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles a WHERE a.id = ambassadeur_id AND a.user_id = auth.uid())
  );

-- Trigger updated_at
CREATE TRIGGER ambassadeur_profiles_updated_at BEFORE UPDATE ON yatra.ambassadeur_profiles
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

-- RPC apply_ambassadeur_v1
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

-- RPC track_ambassador_click_v1
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

  INSERT INTO yatra.ambassadeur_clicks (slug, ambassadeur_id, ip_hash, ua_truncated, referer, utm)
  VALUES (lower(p_slug), v_amb_id, p_ip_hash, COALESCE(left(p_ua, 200), ''), p_referer, COALESCE(p_utm, '{}'::jsonb))
  RETURNING id INTO v_click_id;

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

GRANT EXECUTE ON FUNCTION yatra.track_ambassador_click_v1(TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role, authenticated;
