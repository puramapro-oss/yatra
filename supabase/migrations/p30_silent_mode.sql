-- YATRA — Migration P30 (P23a multisensoriel)
-- Mode "Silence total" — toggle global désactive tout multisensoriel d'un coup.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. Ajout colonne silent_mode à user_ambient_preferences
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'yatra'
      AND table_name = 'user_ambient_preferences'
      AND column_name = 'silent_mode'
  ) THEN
    ALTER TABLE yatra.user_ambient_preferences
    ADD COLUMN silent_mode BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

COMMENT ON COLUMN yatra.user_ambient_preferences.silent_mode IS
  'Mode Silence total : désactive d''un coup sons binaural + parallax gyroscope + vibrations haptiques + animations lourdes (brief V3 §11)';
