-- YATRA — Migration P16 (VACANCES V2.0 §4 — L'argent récupéré)
-- EU261 (indemnisation retards/annulations) + extension aides sociales vacances
-- + suivi réservations pour rebooking. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. AÉROPORTS DE RÉFÉRENCE (coordonnées réelles — calcul distance EU261)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_airports_geo (
  code_iata TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT NOT NULL,
  pays TEXT NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lon NUMERIC(9, 6) NOT NULL,
  ue BOOLEAN NOT NULL DEFAULT false
);

INSERT INTO yatra.vacances_airports_geo (code_iata, nom, ville, pays, lat, lon, ue) VALUES
  ('CDG', 'Paris Charles de Gaulle', 'Paris', 'France', 49.0097, 2.5479, true),
  ('ORY', 'Paris Orly', 'Paris', 'France', 48.7233, 2.3794, true),
  ('LYS', 'Lyon Saint-Exupéry', 'Lyon', 'France', 45.7256, 5.0811, true),
  ('MRS', 'Marseille Provence', 'Marseille', 'France', 43.4393, 5.2214, true),
  ('NCE', 'Nice Côte d''Azur', 'Nice', 'France', 43.6584, 7.2159, true),
  ('TLS', 'Toulouse Blagnac', 'Toulouse', 'France', 43.6293, 1.3638, true),
  ('BOD', 'Bordeaux Mérignac', 'Bordeaux', 'France', 44.8283, -0.7156, true),
  ('BVA', 'Beauvais-Tillé', 'Paris', 'France', 49.4544, 2.1128, true),
  ('BIQ', 'Biarritz Pays Basque', 'Biarritz', 'France', 43.4684, -1.5311, true),
  ('LIS', 'Lisbonne Humberto Delgado', 'Lisbonne', 'Portugal', 38.7813, -9.1359, true),
  ('OPO', 'Porto Francisco Sá Carneiro', 'Porto', 'Portugal', 41.2481, -8.6814, true),
  ('RAK', 'Marrakech Ménara', 'Marrakech', 'Maroc', 31.6069, -8.0363, false),
  ('BUD', 'Budapest Ferenc Liszt', 'Budapest', 'Hongrie', 47.4298, 19.2611, true),
  ('KRK', 'Cracovie Jean-Paul II', 'Cracovie', 'Pologne', 50.0777, 19.7848, true),
  ('BCN', 'Barcelone El Prat', 'Barcelone', 'Espagne', 41.2971, 2.0785, true),
  ('SVQ', 'Séville San Pablo', 'Séville', 'Espagne', 37.4180, -5.8931, true),
  ('FCO', 'Rome Fiumicino', 'Rome', 'Italie', 41.8003, 12.2389, true),
  ('NAP', 'Naples Capodichino', 'Naples', 'Italie', 40.8860, 14.2908, true),
  ('ATH', 'Athènes Eleftherios Venizelos', 'Athènes', 'Grèce', 37.9364, 23.9445, true),
  ('BER', 'Berlin Brandenburg', 'Berlin', 'Allemagne', 52.3667, 13.5033, true),
  ('AMS', 'Amsterdam Schiphol', 'Amsterdam', 'Pays-Bas', 52.3105, 4.7683, true),
  ('BRU', 'Bruxelles Zaventem', 'Bruxelles', 'Belgique', 50.9010, 4.4844, true),
  ('JFK', 'New York John F. Kennedy', 'New York', 'États-Unis', 40.6413, -73.7781, false),
  ('BKK', 'Bangkok Suvarnabhumi', 'Bangkok', 'Thaïlande', 13.6900, 100.7501, false),
  ('DXB', 'Dubaï International', 'Dubaï', 'Émirats arabes unis', 25.2532, 55.3657, false),
  ('PUJ', 'Punta Cana', 'Punta Cana', 'République dominicaine', 18.5674, -68.3634, false)
ON CONFLICT (code_iata) DO NOTHING;

-- ============================================================================
-- 2. RÉCLAMATIONS EU261
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_eu261_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  compagnie TEXT NOT NULL,
  numero_vol TEXT NOT NULL,
  date_vol DATE NOT NULL,
  aeroport_depart_code TEXT NOT NULL REFERENCES yatra.vacances_airports_geo(code_iata),
  aeroport_arrivee_code TEXT NOT NULL REFERENCES yatra.vacances_airports_geo(code_iata),
  distance_km NUMERIC(7, 1) NOT NULL,
  type_incident TEXT NOT NULL CHECK (type_incident IN ('retard', 'annulation', 'refus_embarquement')),
  retard_heures NUMERIC(4, 1),
  jours_notice_annulation INT,
  circonstances_extraordinaires_invoquees BOOLEAN NOT NULL DEFAULT false,
  eligibilite TEXT NOT NULL CHECK (eligibilite IN ('oui', 'non', 'incertain')),
  motif_eligibilite TEXT NOT NULL,
  montant_estime_eur NUMERIC(6, 2) NOT NULL DEFAULT 0,
  montant_obtenu_eur NUMERIC(6, 2),
  nom_complet TEXT NOT NULL,
  lettre_texte TEXT NOT NULL,
  statut TEXT NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'envoyee', 'obtenue', 'refusee')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eu261_user ON yatra.vacances_eu261_claims(user_id, created_at DESC);

-- ============================================================================
-- 3. RÉSERVATIONS SUIVIES (rebooking §4.3 — V1 : suivi manuel + rappel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_tracked_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  prix_paye_eur NUMERIC(8, 2) NOT NULL,
  lien_reservation TEXT,
  annulable BOOLEAN NOT NULL DEFAULT true,
  date_limite_annulation DATE,
  prix_constate_eur NUMERIC(8, 2),
  economie_potentielle_eur NUMERIC(8, 2),
  derniere_verification_at TIMESTAMPTZ,
  statut TEXT NOT NULL DEFAULT 'suivi' CHECK (statut IN ('suivi', 'rebooke', 'abandonne', 'expire')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_bookings_user ON yatra.vacances_tracked_bookings(user_id, statut);

-- ============================================================================
-- 4. RLS
-- ============================================================================
ALTER TABLE yatra.vacances_airports_geo ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_eu261_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_tracked_bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_airports_geo' AND policyname='airports_geo_read_all') THEN
    CREATE POLICY airports_geo_read_all ON yatra.vacances_airports_geo FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_eu261_claims' AND policyname='eu261_self_all') THEN
    CREATE POLICY eu261_self_all ON yatra.vacances_eu261_claims FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_tracked_bookings' AND policyname='tracked_bookings_self_all') THEN
    CREATE POLICY tracked_bookings_self_all ON yatra.vacances_tracked_bookings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT ON yatra.vacances_airports_geo TO authenticated, service_role;
GRANT ALL ON yatra.vacances_eu261_claims TO authenticated, service_role;
GRANT ALL ON yatra.vacances_tracked_bookings TO authenticated, service_role;

-- ============================================================================
-- 5. EXTENSION AIDES SOCIALES VACANCES (réutilise yatra.aides existant — P5)
--    Schéma réel en prod ≠ supabase/schema.sql versionné (colonnes slug NOT NULL
--    UNIQUE + category ajoutées hors migration trackée) : on s'aligne dessus.
-- ============================================================================
INSERT INTO yatra.aides (nom, slug, type_aide, category, profil_eligible, situation_eligible, montant_max, url_officielle, description, region, active)
SELECT * FROM (VALUES
  ('Aide aux vacances VACAF', 'vacaf', 'vacances', 'vacances', ARRAY['famille','allocataire_caf'], ARRAY['depart_premiere_fois','quotient_familial_bas'], 500::numeric, 'https://www.caf.fr/allocataires/vacaf', 'Aide financière CAF pour partir en vacances via un réseau de plus de 1000 hébergements partenaires, sous conditions de quotient familial.', NULL::text, true),
  ('Chèques-Vacances ANCV', 'cheques-vacances-ancv', 'vacances', 'vacances', ARRAY['salarie','agent_public','retraite'], ARRAY['epargne_vacances'], 1500::numeric, 'https://www.ancv.com/', 'Titres de paiement (financés en partie par l''employeur ou le CE) acceptés chez plus de 175 000 prestataires (transport, hébergement, loisirs, restauration).', NULL::text, true),
  ('Aides vacances du Comité Social et Économique (CSE)', 'aides-cse-vacances', 'vacances', 'vacances', ARRAY['salarie'], ARRAY['cse_entreprise'], 400::numeric, 'https://www.service-public.fr/particuliers/vosdroits/F32086', 'Participation financière ou chèques-vacances distribués par le CSE de l''entreprise — montant et conditions variables selon l''employeur.', NULL::text, true),
  ('Bourse Solidarité Vacances', 'bourse-solidarite-vacances', 'vacances', 'vacances', ARRAY['famille','personne_isolee','precarite'], ARRAY['difficultes_financieres','orientation_travailleur_social'], 300::numeric, 'https://www.bsv.asso.fr/', 'Séjours à prix très réduits pour les personnes en difficulté, orientées par un travailleur social ou une association partenaire.', NULL::text, true),
  ('Aides régionales vacances jeunes', 'aides-regionales-vacances-jeunes', 'vacances', 'vacances', ARRAY['jeune','etudiant'], ARRAY['age_moins_30'], 200::numeric, 'https://www.service-public.fr/particuliers/vosdroits/F34158', 'Bons vacances ou pass région pour les 15-30 ans — dispositifs variables selon la région de résidence, à vérifier auprès du conseil régional.', NULL::text, true)
) AS v(nom, slug, type_aide, category, profil_eligible, situation_eligible, montant_max, url_officielle, description, region, active)
WHERE NOT EXISTS (SELECT 1 FROM yatra.aides WHERE yatra.aides.slug = v.slug);
