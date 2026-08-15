-- YATRA — Migration P26 (P19 V3)
-- Extension achats groupés : trajets SNCF groupe + activités partenaires. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. Étendre group_purchases : pool_type + metadata
-- ============================================================================

-- Ajouter colonne pool_type si absente
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'yatra' AND table_name = 'group_purchases' AND column_name = 'pool_type'
  ) THEN
    ALTER TABLE yatra.group_purchases
    ADD COLUMN pool_type TEXT NOT NULL DEFAULT 'autre'
    CHECK (pool_type IN ('event_gratuit', 'trajet_sncf', 'activite_partenaire', 'autre'));
  END IF;
END $$;

-- Ajouter colonne metadata JSONB si absente
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'yatra' AND table_name = 'group_purchases' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE yatra.group_purchases ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Index sur pool_type
CREATE INDEX IF NOT EXISTS idx_groups_pool_type ON yatra.group_purchases(pool_type) WHERE status = 'open';

-- Mettre à jour les pools existants sans pool_type explicite (tous actuellement)
-- Pas de mise à jour forcée si déjà définis pour éviter de réinitialiser des données ultérieures
UPDATE yatra.group_purchases SET pool_type = 'autre' WHERE pool_type IS NULL OR pool_type = '';

-- ============================================================================
-- 2. Table notifications (si absente) pour seuil atteint
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'group_threshold_reached' | 'trip_completed' | 'wallet_credited' | 'challenge_reminder' | ...
  title TEXT NOT NULL,
  body TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON yatra.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON yatra.notifications(user_id) WHERE read = FALSE;

ALTER TABLE yatra.notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='notifications' AND policyname='notif_self_select') THEN
    CREATE POLICY notif_self_select ON yatra.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='notifications' AND policyname='notif_self_update') THEN
    CREATE POLICY notif_self_update ON yatra.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.notifications TO postgres, authenticated, service_role;

-- ============================================================================
-- 3. Fonction trigger auto-notification seuil atteint
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.notify_group_threshold_reached()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_member RECORD;
BEGIN
  -- Déclenché uniquement si status passe à 'reached'
  IF NEW.status = 'reached' AND (OLD.status IS NULL OR OLD.status <> 'reached') THEN
    -- Insérer une notification pour chaque membre du pool
    FOR v_member IN
      SELECT user_id FROM yatra.group_purchase_members WHERE group_id = NEW.id
    LOOP
      INSERT INTO yatra.notifications (user_id, type, title, message, link)
      VALUES (
        v_member.user_id,
        'group_threshold_reached',
        'Seuil atteint 🎉',
        'Le pool "' || NEW.title || '" a atteint son objectif ! Code de réservation disponible.',
        '/dashboard/groupes/' || NEW.id::text
      );
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

-- Créer trigger si absent
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'group_threshold_reached_trigger') THEN
    CREATE TRIGGER group_threshold_reached_trigger
    AFTER UPDATE ON yatra.group_purchases
    FOR EACH ROW
    WHEN (NEW.status = 'reached' AND (OLD.status IS DISTINCT FROM 'reached'))
    EXECUTE FUNCTION yatra.notify_group_threshold_reached();
  END IF;
END $$;

-- ============================================================================
-- Fin migration P26
-- ============================================================================
