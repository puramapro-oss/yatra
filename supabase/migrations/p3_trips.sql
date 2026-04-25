-- YATRA — Migration P3
-- Trajets + GPS + Anti-fraude + Cache routes + Partenaires transport
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- transport_partners — partenaires intégrés (P6+ activera les vrais flux)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.transport_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'rail', 'metro', 'bus', 'bike_share', 'carpool', 'ride'
  region TEXT, -- 'FR', 'IDF', 'AURA', 'global'
  color TEXT NOT NULL DEFAULT '#10b981',
  support_modes TEXT[] NOT NULL DEFAULT '{}',
  api_endpoint TEXT,
  integration_status TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'sandbox' | 'live'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_partners_region ON yatra.transport_partners(region);

-- Seed 5 partenaires FR ; status='planned' tant que P6 ne signe pas l'intégration officielle
INSERT INTO yatra.transport_partners (slug, name, type, region, color, support_modes, integration_status)
VALUES
  ('sncf-connect', 'SNCF Connect', 'rail', 'FR', '#0c2461', ARRAY['train'], 'planned'),
  ('ratp', 'RATP', 'metro', 'IDF', '#005ca9', ARRAY['transport_public'], 'planned'),
  ('blablacar', 'BlaBlaCar', 'carpool', 'FR', '#00aff5', ARRAY['covoiturage'], 'planned'),
  ('velib', 'Vélib'' Métropole', 'bike_share', 'IDF', '#88c540', ARRAY['velo'], 'planned'),
  ('velov', 'Vélo''v Lyon', 'bike_share', 'AURA', '#e30613', ARRAY['velo'], 'planned')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- trips — trajet utilisateur (status: active → completed | flagged | discarded)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','flagged','discarded')),
  declared_mode TEXT NOT NULL,
  detected_mode TEXT,
  distance_km NUMERIC(10,3) NOT NULL DEFAULT 0,
  duration_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  gain_credits_eur NUMERIC(10,4) NOT NULL DEFAULT 0,
  co2_avoided_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
  fraud_score INT NOT NULL DEFAULT 0 CHECK (fraud_score BETWEEN 0 AND 100),
  fraud_reasons TEXT[] NOT NULL DEFAULT '{}',
  from_label TEXT,
  to_label TEXT,
  from_lat DOUBLE PRECISION,
  from_lon DOUBLE PRECISION,
  to_lat DOUBLE PRECISION,
  to_lon DOUBLE PRECISION,
  geometry JSONB, -- GeoJSON LineString
  partner_slug TEXT, -- ref soft transport_partners.slug
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trips_user ON yatra.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON yatra.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_started ON yatra.trips(started_at DESC);

-- ============================================================================
-- gps_tracks — points GPS associés à un trip (1:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.gps_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES yatra.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points JSONB NOT NULL DEFAULT '[]'::jsonb,
  count INT NOT NULL DEFAULT 0,
  avg_speed_kmh NUMERIC(6,2) NOT NULL DEFAULT 0,
  max_speed_kmh NUMERIC(6,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_tracks_trip ON yatra.gps_tracks(trip_id);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_gps_tracks_trip ON yatra.gps_tracks(trip_id);

-- ============================================================================
-- route_cache — cache des calculs OSRM/Mapbox pour économiser les appels
-- Hash key : sha256(from_lat:from_lon:to_lat:to_lon:profile)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.route_cache (
  cache_key TEXT PRIMARY KEY,
  profile TEXT NOT NULL,
  from_lat DOUBLE PRECISION NOT NULL,
  from_lon DOUBLE PRECISION NOT NULL,
  to_lat DOUBLE PRECISION NOT NULL,
  to_lon DOUBLE PRECISION NOT NULL,
  distance_km NUMERIC(10,3) NOT NULL,
  duration_min NUMERIC(10,2) NOT NULL,
  geometry JSONB,
  provider TEXT NOT NULL DEFAULT 'osrm', -- 'osrm' | 'mapbox'
  hits INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_route_cache_expires ON yatra.route_cache(expires_at);

-- ============================================================================
-- RLS
-- ============================================================================
ALTER TABLE yatra.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.gps_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.transport_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.route_cache ENABLE ROW LEVEL SECURITY;

-- trips : owner only
DROP POLICY IF EXISTS "trips_select_own" ON yatra.trips;
CREATE POLICY "trips_select_own" ON yatra.trips
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_insert_own" ON yatra.trips;
CREATE POLICY "trips_insert_own" ON yatra.trips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "trips_update_own" ON yatra.trips;
CREATE POLICY "trips_update_own" ON yatra.trips
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- gps_tracks : owner only
DROP POLICY IF EXISTS "gps_select_own" ON yatra.gps_tracks;
CREATE POLICY "gps_select_own" ON yatra.gps_tracks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "gps_insert_own" ON yatra.gps_tracks;
CREATE POLICY "gps_insert_own" ON yatra.gps_tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "gps_update_own" ON yatra.gps_tracks;
CREATE POLICY "gps_update_own" ON yatra.gps_tracks
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- transport_partners : public read
DROP POLICY IF EXISTS "transport_partners_read" ON yatra.transport_partners;
CREATE POLICY "transport_partners_read" ON yatra.transport_partners
  FOR SELECT USING (TRUE);

-- route_cache : pas accessible directement client (service role only)
-- Pas de policy = aucune lecture public

-- ============================================================================
-- GRANTS (cohérence avec yatra schema)
-- ============================================================================
GRANT USAGE ON SCHEMA yatra TO postgres, anon, authenticated, service_role;
GRANT ALL ON yatra.transport_partners TO postgres, anon, authenticated, service_role;
GRANT ALL ON yatra.trips TO postgres, authenticated, service_role;
GRANT ALL ON yatra.gps_tracks TO postgres, authenticated, service_role;
GRANT ALL ON yatra.route_cache TO postgres, service_role;
