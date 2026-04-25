-- YATRA — Migration P8
-- 6 modes ambiance (Three.js + Web Audio binaural). Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. ambient_modes — catalogue 6 modes
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.ambient_modes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  carrier_hz NUMERIC(7,2) NOT NULL,        -- fréquence porteuse (Solfeggio / Schumann)
  beat_hz NUMERIC(5,2) NOT NULL,            -- battement binaural (delta=0-4 / theta=4-8 / alpha=8-13)
  beat_band TEXT NOT NULL,                  -- 'delta' | 'theta' | 'alpha' | 'beta'
  primary_color TEXT NOT NULL,              -- hex
  secondary_color TEXT NOT NULL,
  ideal_time_of_day TEXT NOT NULL,          -- 'morning' | 'midday' | 'afternoon' | 'evening' | 'night' | 'any'
  ideal_trip_mode TEXT,                     -- 'velo' | 'marche' | 'train' | 'voiture' | NULL (any)
  emoji TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ambient_modes_active ON yatra.ambient_modes(display_order) WHERE active = true;

-- ============================================================================
-- 2. user_ambient_preferences — 1 ligne par user
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.user_ambient_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_mode_slug TEXT REFERENCES yatra.ambient_modes(slug) ON DELETE SET NULL,
  default_volume NUMERIC(3,2) NOT NULL DEFAULT 0.4 CHECK (default_volume >= 0 AND default_volume <= 1),
  binaural_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  haptics_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  auto_during_trip BOOLEAN NOT NULL DEFAULT FALSE,
  total_minutes_listened INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. ambient_sessions — telemetry (1 row par session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.ambient_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode_slug TEXT NOT NULL REFERENCES yatra.ambient_modes(slug) ON DELETE CASCADE,
  trip_id UUID REFERENCES yatra.trips(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  binaural_played BOOLEAN NOT NULL DEFAULT FALSE,
  CHECK (ended_at IS NULL OR ended_at >= started_at)
);

CREATE INDEX IF NOT EXISTS idx_ambient_sessions_user ON yatra.ambient_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_ambient_sessions_mode ON yatra.ambient_sessions(mode_slug, started_at DESC);

-- ============================================================================
-- 4. RLS
-- ============================================================================
ALTER TABLE yatra.ambient_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.user_ambient_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambient_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS modes_read ON yatra.ambient_modes;
CREATE POLICY modes_read ON yatra.ambient_modes
  FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS prefs_self_read ON yatra.user_ambient_preferences;
CREATE POLICY prefs_self_read ON yatra.user_ambient_preferences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS prefs_self_write ON yatra.user_ambient_preferences;
CREATE POLICY prefs_self_write ON yatra.user_ambient_preferences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS prefs_self_update ON yatra.user_ambient_preferences;
CREATE POLICY prefs_self_update ON yatra.user_ambient_preferences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_self_read ON yatra.ambient_sessions;
CREATE POLICY sessions_self_read ON yatra.ambient_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_self_insert ON yatra.ambient_sessions;
CREATE POLICY sessions_self_insert ON yatra.ambient_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS sessions_self_update ON yatra.ambient_sessions;
CREATE POLICY sessions_self_update ON yatra.ambient_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 5. Seed 6 modes
-- ============================================================================
INSERT INTO yatra.ambient_modes (slug, name, tagline, description, carrier_hz, beat_hz, beat_band, primary_color, secondary_color, ideal_time_of_day, ideal_trip_mode, emoji, display_order) VALUES
  ('forest', 'Forêt vivante', 'Reconnecte à la verticalité du vivant', 'Particules de pollen, lumière filtrée par les feuilles, fréquence Solfège 432 Hz pour l''ancrage. Battement theta 4 Hz pour l''état méditatif.', 432.00, 4.00, 'theta', '#10B981', '#065F46', 'morning', 'marche', '🌲', 1),
  ('ocean', 'Océan résonant', 'Suis le rythme de la Terre', 'Surface ondulante à la résonance Schumann (7,83 Hz), porteuse 174 Hz pour le relâchement somatique. Bleu-cyan océanique infini.', 174.00, 7.83, 'theta', '#0EA5E9', '#0C4A6E', 'midday', 'velo', '🌊', 2),
  ('mountain', 'Montagne immobile', 'Ton souffle devient sommet', 'Particules de neige lente, sommets respirants, porteuse 396 Hz pour libérer la peur. Battement alpha 8 Hz pour la clarté mentale.', 396.00, 8.00, 'alpha', '#94A3B8', '#1E293B', 'afternoon', 'train', '⛰️', 3),
  ('desert', 'Désert de feu', 'L''espace contient déjà tout', 'Vague de chaleur shimmer, dunes infinies, porteuse 528 Hz (fréquence de transformation). Theta 6 Hz pour la créativité profonde.', 528.00, 6.00, 'theta', '#F59E0B', '#7C2D12', 'evening', NULL, '🏜️', 4),
  ('aurora', 'Aurore boréale', 'Laisse les couleurs te traverser', 'Voile multicolore animé en spirale, porteuse 639 Hz pour les relations harmonieuses. Alpha 10 Hz pour la connexion sociale apaisée.', 639.00, 10.00, 'alpha', '#A855F7', '#0EA5E9', 'evening', 'voiture', '🌌', 5),
  ('cosmos', 'Cosmos infini', 'Tu es vu par les étoiles', 'Galaxie tournoyante, nébuleuse pulsante, porteuse 963 Hz (fréquence de l''éveil). Theta profond 4 Hz pour l''espace intérieur.', 963.00, 4.00, 'theta', '#7C3AED', '#0F0F23', 'night', NULL, '✨', 6)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  carrier_hz = EXCLUDED.carrier_hz,
  beat_hz = EXCLUDED.beat_hz,
  primary_color = EXCLUDED.primary_color,
  secondary_color = EXCLUDED.secondary_color,
  ideal_time_of_day = EXCLUDED.ideal_time_of_day,
  ideal_trip_mode = EXCLUDED.ideal_trip_mode;

-- ============================================================================
-- 6. Trigger updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trg_user_ambient_prefs_updated ON yatra.user_ambient_preferences;
CREATE TRIGGER trg_user_ambient_prefs_updated BEFORE UPDATE ON yatra.user_ambient_preferences
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
