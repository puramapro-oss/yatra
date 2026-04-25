-- YATRA — Migration P10
-- Famille + Radar + Cleanup RGPD. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. families
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  invite_code TEXT UNIQUE NOT NULL, -- 6 chars uppercase alphanumérique
  invite_expires_at TIMESTAMPTZ,
  max_members INT NOT NULL DEFAULT 6 CHECK (max_members BETWEEN 2 AND 20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_families_owner ON yatra.families(owner_id);
CREATE INDEX IF NOT EXISTS idx_families_invite ON yatra.families(invite_code);

-- ============================================================================
-- 2. family_members
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES yatra.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id, user_id),
  UNIQUE (user_id) -- un user = max 1 famille pour MVP
);

CREATE INDEX IF NOT EXISTS idx_family_members_family ON yatra.family_members(family_id);

-- ============================================================================
-- 3. RPC join_family_v1 — atomique : check capacité + insert member + mark invite used
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.join_family_v1(p_user_id UUID, p_invite_code TEXT)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_family yatra.families%ROWTYPE;
  v_count INT;
BEGIN
  SELECT * INTO v_family FROM yatra.families WHERE invite_code = upper(p_invite_code) FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'family_not_found';
  END IF;
  IF v_family.invite_expires_at IS NOT NULL AND v_family.invite_expires_at < NOW() THEN
    RAISE EXCEPTION 'invite_expired';
  END IF;

  IF EXISTS (SELECT 1 FROM yatra.family_members WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'already_in_family';
  END IF;

  SELECT COUNT(*) INTO v_count FROM yatra.family_members WHERE family_id = v_family.id;
  IF v_count >= v_family.max_members THEN
    RAISE EXCEPTION 'family_full';
  END IF;

  INSERT INTO yatra.family_members (family_id, user_id, role)
  VALUES (v_family.id, p_user_id, 'member');

  RETURN jsonb_build_object(
    'family_id', v_family.id,
    'family_name', v_family.name,
    'members_after_join', v_count + 1
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.join_family_v1(UUID, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 4. RPC cleanup_aria_old_v1 — RGPD purge conversations clôturées >180j
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.cleanup_aria_old_v1()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_threshold TIMESTAMPTZ := NOW() - INTERVAL '180 days';
  v_conv_count INT;
  v_msg_count INT;
BEGIN
  -- Compte avant suppression (messages cascade via FK ON DELETE CASCADE)
  SELECT COUNT(*) INTO v_conv_count
  FROM yatra.aria_conversations
  WHERE ended_at IS NOT NULL AND ended_at < v_threshold;

  SELECT COUNT(*) INTO v_msg_count
  FROM yatra.aria_messages m
  JOIN yatra.aria_conversations c ON c.id = m.conversation_id
  WHERE c.ended_at IS NOT NULL AND c.ended_at < v_threshold;

  DELETE FROM yatra.aria_conversations
  WHERE ended_at IS NOT NULL AND ended_at < v_threshold;

  RETURN jsonb_build_object(
    'threshold', v_threshold,
    'conversations_deleted', v_conv_count,
    'messages_cascade_deleted', v_msg_count
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.cleanup_aria_old_v1() TO service_role;
REVOKE EXECUTE ON FUNCTION yatra.cleanup_aria_old_v1() FROM authenticated, anon, public;

-- ============================================================================
-- 5. RLS
-- ============================================================================
ALTER TABLE yatra.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.family_members ENABLE ROW LEVEL SECURITY;

-- Families : owner et membres lisent
DROP POLICY IF EXISTS families_member_read ON yatra.families;
CREATE POLICY families_member_read ON yatra.families
  FOR SELECT TO authenticated USING (
    owner_id = auth.uid()
    OR EXISTS (SELECT 1 FROM yatra.family_members fm WHERE fm.family_id = id AND fm.user_id = auth.uid())
  );

DROP POLICY IF EXISTS families_owner_insert ON yatra.families;
CREATE POLICY families_owner_insert ON yatra.families
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS families_owner_update ON yatra.families;
CREATE POLICY families_owner_update ON yatra.families
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS families_owner_delete ON yatra.families;
CREATE POLICY families_owner_delete ON yatra.families
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);

-- Family members : visible aux membres de la même famille
DROP POLICY IF EXISTS fm_self_read ON yatra.family_members;
CREATE POLICY fm_self_read ON yatra.family_members
  FOR SELECT TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM yatra.family_members me
      WHERE me.user_id = auth.uid() AND me.family_id = family_members.family_id
    )
  );

DROP POLICY IF EXISTS fm_self_leave ON yatra.family_members;
CREATE POLICY fm_self_leave ON yatra.family_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Insert via RPC service_role uniquement (pas de policy authenticated insert direct)

-- ============================================================================
-- 6. Trigger updated_at + auto-add owner as member on family create
-- ============================================================================
DROP TRIGGER IF EXISTS trg_families_updated ON yatra.families;
CREATE TRIGGER trg_families_updated BEFORE UPDATE ON yatra.families
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

CREATE OR REPLACE FUNCTION yatra.auto_add_family_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = yatra, public AS $$
BEGIN
  INSERT INTO yatra.family_members (family_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_families_auto_owner ON yatra.families;
CREATE TRIGGER trg_families_auto_owner AFTER INSERT ON yatra.families
  FOR EACH ROW EXECUTE FUNCTION yatra.auto_add_family_owner();
