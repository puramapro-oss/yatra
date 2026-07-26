-- YATRA — Migration P15 (VACANCES V2.0 §2 — Budget inversé)
-- Catalogue de destinations avec fourchettes de coûts indicatives (transport AR / logement
-- / repas / activités par jour) — références budget-voyageur connues, jamais un prix figé
-- inventé. Sert à générer 5 propositions chiffrées triées qualité/prix.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. CATALOGUE DESTINATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  pays TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  modes_transport TEXT[] NOT NULL DEFAULT '{}',
  cout_transport_ar_min_eur NUMERIC(7, 2) NOT NULL,
  cout_transport_ar_max_eur NUMERIC(7, 2) NOT NULL,
  cout_logement_nuit_min_eur NUMERIC(6, 2) NOT NULL,
  cout_logement_nuit_max_eur NUMERIC(6, 2) NOT NULL,
  cout_repas_jour_min_eur NUMERIC(6, 2) NOT NULL,
  cout_repas_jour_max_eur NUMERIC(6, 2) NOT NULL,
  cout_activite_jour_min_eur NUMERIC(6, 2) NOT NULL,
  cout_activite_jour_max_eur NUMERIC(6, 2) NOT NULL,
  description TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (nom, pays)
);

CREATE INDEX IF NOT EXISTS idx_destinations_tags ON yatra.vacances_destinations USING GIN (tags) WHERE active = true;

-- ============================================================================
-- 2. HISTORIQUE DES RECHERCHES BUDGET INVERSÉ
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_budget_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  budget_eur NUMERIC(8, 2) NOT NULL,
  jours INT NOT NULL,
  depart TEXT,
  avec_qui TEXT,
  envies TEXT[] DEFAULT '{}',
  results JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_searches_user ON yatra.vacances_budget_searches(user_id, created_at DESC);

-- ============================================================================
-- 3. RLS
-- ============================================================================
ALTER TABLE yatra.vacances_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_budget_searches ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_destinations' AND policyname='destinations_read_all') THEN
    CREATE POLICY destinations_read_all ON yatra.vacances_destinations FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_budget_searches' AND policyname='budget_searches_self_all') THEN
    CREATE POLICY budget_searches_self_all ON yatra.vacances_budget_searches FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT ON yatra.vacances_destinations TO authenticated, service_role;
GRANT ALL ON yatra.vacances_budget_searches TO authenticated, service_role;

-- ============================================================================
-- 4. SEED — 16 destinations, fourchettes indicatives budget-voyageur moyen
--    (départ France ; à revérifier périodiquement, très variable selon saison/anticipation)
-- ============================================================================
INSERT INTO yatra.vacances_destinations
  (nom, pays, tags, modes_transport, cout_transport_ar_min_eur, cout_transport_ar_max_eur, cout_logement_nuit_min_eur, cout_logement_nuit_max_eur, cout_repas_jour_min_eur, cout_repas_jour_max_eur, cout_activite_jour_min_eur, cout_activite_jour_max_eur, description)
VALUES
  ('Lisbonne', 'Portugal', '{ville,culture,soleil}', '{avion}', 60, 180, 25, 70, 20, 35, 5, 20, 'Miradors, tram 28, pastéis de nata — parmi les capitales les moins chères d''Europe.'),
  ('Porto', 'Portugal', '{ville,culture,soleil}', '{avion}', 55, 160, 20, 60, 18, 30, 5, 15, 'Chais de porto, Douro, ambiance plus tranquille que Lisbonne.'),
  ('Marrakech', 'Maroc', '{depaysement,soleil,culture}', '{avion}', 80, 220, 15, 50, 10, 25, 5, 20, 'Médina, souks, hammams — très bon rapport qualité/prix hors vol.'),
  ('Budapest', 'Hongrie', '{ville,culture,fete}', '{avion}', 60, 170, 20, 55, 15, 25, 5, 15, 'Bains thermaux, architecture, vie nocturne abordable.'),
  ('Cracovie', 'Pologne', '{ville,culture,histoire}', '{avion}', 50, 160, 20, 50, 12, 22, 5, 15, 'Vieille ville UNESCO, Auschwitz-Birkenau à proximité.'),
  ('Barcelone', 'Espagne', '{ville,plage,culture,fete}', '{avion,train}', 60, 200, 30, 80, 20, 35, 8, 20, 'Gaudí, plages urbaines, tapas.'),
  ('Séville', 'Espagne', '{ville,culture,soleil}', '{avion}', 60, 190, 25, 65, 18, 30, 6, 18, 'Flamenco, Alcazar, ambiance andalouse.'),
  ('Rome', 'Italie', '{ville,culture,histoire}', '{avion,train}', 70, 210, 30, 80, 20, 35, 8, 20, 'Colisée, Vatican, ambiance éternelle mais touristique.'),
  ('Naples', 'Italie', '{ville,culture,soleil,mer}', '{avion}', 60, 190, 25, 65, 18, 30, 6, 18, 'Pizza napolitaine, Pompéi, côte amalfitaine accessible.'),
  ('Athènes', 'Grèce', '{ville,culture,soleil,histoire}', '{avion}', 80, 220, 25, 65, 18, 30, 6, 18, 'Acropole, îles accessibles en ferry si extension du séjour.'),
  ('Berlin', 'Allemagne', '{ville,culture,fete,histoire}', '{avion,train}', 60, 180, 25, 70, 18, 30, 5, 15, 'Histoire du mur, street art, scène culturelle dense.'),
  ('Amsterdam', 'Pays-Bas', '{ville,culture,fete}', '{avion,train}', 70, 200, 35, 90, 20, 35, 8, 20, 'Canaux, musées, vélo — logement plus cher que la moyenne.'),
  ('Nice', 'France', '{plage,soleil,montagne}', '{avion,train}', 60, 160, 30, 90, 20, 35, 8, 20, 'Côte d''Azur, arrière-pays montagneux à 30 min.'),
  ('Biarritz', 'France', '{plage,montagne,surf}', '{train}', 70, 160, 30, 90, 18, 30, 8, 20, 'Surf, Pays basque, Espagne à 30 min.'),
  ('Annecy', 'France', '{montagne,nature,lac}', '{train}', 60, 140, 30, 90, 18, 32, 8, 20, 'Lac, Alpes, randonnée été comme hiver.'),
  ('Bruxelles', 'Belgique', '{ville,culture}', '{train}', 60, 160, 25, 70, 18, 30, 5, 15, 'Grand-Place, BD, gaufres — souvent sous-estimée.')
ON CONFLICT (nom, pays) DO NOTHING;
