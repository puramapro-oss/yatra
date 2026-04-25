-- YATRA — Migration P6
-- Radar Gratuit + Achat Groupé. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. gratuit_events — événements gratuits accessibles en mobilité douce
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.gratuit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'musee' | 'atelier' | 'concert' | 'expo' | 'repas_solidaire' | 'soin' | 'sport' | 'culture'
  city TEXT NOT NULL,
  region TEXT,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  recurrence TEXT, -- 'weekly' | 'monthly_first_sunday' | 'one_off' | 'permanent'
  url_official TEXT,
  source_type TEXT NOT NULL DEFAULT 'official', -- 'official' | 'tavily' | 'community'
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gratuit_city ON yatra.gratuit_events(city) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_gratuit_category ON yatra.gratuit_events(category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_gratuit_starts ON yatra.gratuit_events(starts_at) WHERE active = true;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'gratuit_events_updated_at') THEN
    CREATE TRIGGER gratuit_events_updated_at BEFORE UPDATE ON yatra.gratuit_events FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 2. group_purchases — pools achat groupé
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.group_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'transport' | 'activite' | 'soins' | 'culture' | 'autre'
  city TEXT,
  target_count INT NOT NULL CHECK (target_count BETWEEN 2 AND 1000),
  current_count INT NOT NULL DEFAULT 1,
  unit_price_eur NUMERIC(10,2) NOT NULL CHECK (unit_price_eur >= 0),
  group_price_eur NUMERIC(10,2) NOT NULL CHECK (group_price_eur >= 0),
  savings_percent NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN unit_price_eur > 0 THEN ROUND(((unit_price_eur - group_price_eur) / unit_price_eur) * 100, 2) ELSE 0 END
  ) STORED,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reached','expired','cancelled')),
  unlock_code TEXT,
  partner_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_groups_status ON yatra.group_purchases(status);
CREATE INDEX IF NOT EXISTS idx_groups_city ON yatra.group_purchases(city) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_groups_deadline ON yatra.group_purchases(deadline) WHERE status = 'open';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'groups_updated_at') THEN
    CREATE TRIGGER groups_updated_at BEFORE UPDATE ON yatra.group_purchases FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 3. group_purchase_members — adhésions
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.group_purchase_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES yatra.group_purchases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gpm_user ON yatra.group_purchase_members(user_id);

-- ============================================================================
-- 4. RPC join atomique (lock + count)
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.group_join_v1(p_user_id UUID, p_group_id UUID)
RETURNS TABLE(joined BOOLEAN, new_count INT, status TEXT, unlock_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_target INT;
  v_status TEXT;
  v_count INT;
  v_code TEXT;
BEGIN
  -- Lock le pool
  SELECT target_count, status, current_count, unlock_code
    INTO v_target, v_status, v_count, v_code
    FROM yatra.group_purchases WHERE id = p_group_id FOR UPDATE;

  IF v_status IS NULL THEN RAISE EXCEPTION 'Pool introuvable'; END IF;
  IF v_status <> 'open' THEN RAISE EXCEPTION 'Pool fermé (%)', v_status; END IF;

  -- Insert membership (UNIQUE empêche double join)
  INSERT INTO yatra.group_purchase_members (group_id, user_id)
    VALUES (p_group_id, p_user_id)
    ON CONFLICT DO NOTHING;

  -- Check si deja member (no insert)
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, v_count, v_status, v_code::TEXT;
    RETURN;
  END IF;

  -- Increment count
  UPDATE yatra.group_purchases
    SET current_count = current_count + 1,
        status = CASE WHEN current_count + 1 >= v_target THEN 'reached' ELSE status END,
        unlock_code = CASE WHEN current_count + 1 >= v_target AND unlock_code IS NULL
                            THEN 'YATRA-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
                            ELSE unlock_code END
    WHERE id = p_group_id
    RETURNING current_count, status, unlock_code INTO v_count, v_status, v_code;

  RETURN QUERY SELECT TRUE, v_count, v_status, v_code::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION yatra.group_join_v1(UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- 5. RLS
-- ============================================================================
ALTER TABLE yatra.gratuit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.group_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.group_purchase_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='gratuit_events' AND policyname='ge_public_select') THEN
    CREATE POLICY ge_public_select ON yatra.gratuit_events FOR SELECT USING (active = TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='group_purchases' AND policyname='gp_public_select') THEN
    CREATE POLICY gp_public_select ON yatra.group_purchases FOR SELECT USING (status IN ('open','reached'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='group_purchases' AND policyname='gp_creator_insert') THEN
    CREATE POLICY gp_creator_insert ON yatra.group_purchases FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='group_purchases' AND policyname='gp_creator_update') THEN
    CREATE POLICY gp_creator_update ON yatra.group_purchases FOR UPDATE USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='group_purchase_members' AND policyname='gpm_self_select') THEN
    CREATE POLICY gpm_self_select ON yatra.group_purchase_members FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.gratuit_events TO postgres, anon, authenticated, service_role;
GRANT ALL ON yatra.group_purchases TO postgres, authenticated, service_role;
GRANT SELECT ON yatra.group_purchases TO anon;
GRANT ALL ON yatra.group_purchase_members TO postgres, authenticated, service_role;

-- ============================================================================
-- 6. SEED 12 événements FR récurrents officiels
-- ============================================================================
INSERT INTO yatra.gratuit_events (slug, title, category, city, region, lat, lon, description, recurrence, url_official, source_type)
VALUES
  ('louvre-1er-dimanche', 'Louvre — 1er dimanche du mois gratuit (oct-mars)', 'musee', 'Paris', 'IDF', 48.8606, 2.3376,
   'Le Louvre est gratuit pour tous le 1er dimanche du mois d''octobre à mars. Réservation conseillée.',
   'monthly_first_sunday', 'https://www.louvre.fr/visiter/reservation-de-billets-individuels', 'official'),

  ('orsay-1er-dimanche', 'Musée d''Orsay — 1er dimanche gratuit', 'musee', 'Paris', 'IDF', 48.8600, 2.3266,
   'Entrée gratuite le 1er dimanche du mois pour tous (réservation gratuite obligatoire).',
   'monthly_first_sunday', 'https://www.musee-orsay.fr/fr/billetterie', 'official'),

  ('beaubourg-1er-dimanche', 'Centre Pompidou — 1er dimanche gratuit', 'musee', 'Paris', 'IDF', 48.8606, 2.3522,
   'Centre Pompidou (Beaubourg) gratuit le 1er dimanche du mois.',
   'monthly_first_sunday', 'https://www.centrepompidou.fr/fr/billetterie', 'official'),

  ('petit-palais-permanent', 'Petit Palais — collections permanentes gratuites', 'musee', 'Paris', 'IDF', 48.8662, 2.3146,
   'Les collections permanentes du Petit Palais sont gratuites toute l''année. Beaux-arts du XIXᵉ.',
   'permanent', 'https://www.petitpalais.paris.fr/visiter', 'official'),

  ('mac-lyon-1er-dimanche', 'Musée d''Art Contemporain Lyon — 1er dimanche gratuit', 'musee', 'Lyon', 'AURA', 45.7853, 4.8546,
   'Le MAC Lyon est gratuit le 1er dimanche du mois.',
   'monthly_first_sunday', 'https://www.mac-lyon.com/fr/visiter', 'official'),

  ('musees-gratuits-marseille-dimanche', 'Musées Marseille — gratuits 1er dimanche', 'musee', 'Marseille', 'PACA', 43.2965, 5.3698,
   'MUCEM, Musée Cantini, Vieille Charité gratuits le 1er dimanche du mois (oct-mai).',
   'monthly_first_sunday', 'https://musees.marseille.fr/horaires-tarifs', 'official'),

  ('croix-rouge-paris', 'Repas Croix-Rouge Paris — solidaire', 'repas_solidaire', 'Paris', 'IDF', 48.8566, 2.3522,
   'Distributions de repas chauds par la Croix-Rouge française pour personnes en précarité, plusieurs lieux Paris.',
   'weekly', 'https://www.croix-rouge.fr/agir/aide-alimentaire', 'official'),

  ('restos-coeur-paris', 'Restos du Cœur — distributions gratuites', 'repas_solidaire', 'Paris', 'IDF', 48.8566, 2.3522,
   'Distribution alimentaire pour personnes en difficulté, accueil sans condition de ressources sur appréciation.',
   'weekly', 'https://www.restosducoeur.org/aide/', 'official'),

  ('halles-civiques-paris', 'Halles Civiques Paris — ateliers citoyens gratuits', 'atelier', 'Paris', 'IDF', 48.8639, 2.3641,
   'Ateliers gratuits hebdomadaires : sensibilisation environnement, citoyenneté, écologie urbaine.',
   'weekly', 'https://halles-civiques.fr/programmes', 'official'),

  ('parc-tete-dor-lyon', 'Parc de la Tête d''Or Lyon — entrée gratuite', 'culture', 'Lyon', 'AURA', 45.7758, 4.8526,
   'Le plus grand parc urbain de France. Zoo gratuit, jardin botanique, lac, vélo possible.',
   'permanent', 'https://www.lyon.fr/lieu/parcs/parc-de-la-tete-dor', 'official'),

  ('fete-musique', 'Fête de la Musique — partout en France', 'concert', 'Paris', 'FR', 48.8566, 2.3522,
   'Le 21 juin, concerts gratuits dans toutes les villes de France. Plus de 5000 événements.',
   'one_off', 'https://fetedelamusique.culture.gouv.fr/', 'official'),

  ('journees-patrimoine', 'Journées européennes du Patrimoine', 'culture', 'Paris', 'FR', 48.8566, 2.3522,
   'Mi-septembre, monuments habituellement payants ou fermés ouverts gratuitement. Visite Élysée, Sénat, etc.',
   'one_off', 'https://journeesdupatrimoine.culture.gouv.fr/', 'official')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  url_official = EXCLUDED.url_official,
  active = TRUE,
  updated_at = NOW();
