-- YATRA — Migration P25 (V3 P16 — Radar gratuit & aides seniors)
-- Complète les aides pour profil senior/retraité (sous-représenté : 3→8+ aides)
-- Étend radar gratuit avec colonne prix (0€/<5€/<10€). Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. EXTENSION RADAR GRATUIT — Ajouter colonne prix
-- ============================================================================
ALTER TABLE yatra.gratuit_events
  ADD COLUMN IF NOT EXISTS prix NUMERIC(6,2) DEFAULT 0 NOT NULL CHECK (prix >= 0);

CREATE INDEX IF NOT EXISTS idx_gratuit_prix ON yatra.gratuit_events(prix) WHERE active = true;

COMMENT ON COLUMN yatra.gratuit_events.prix IS 'Prix en euros. 0 = gratuit, <5 = accessible, <10 = très accessible.';

-- ============================================================================
-- 2. SEED EVENTS GRATUITS/ACCESSIBLES — Extension <5€/<10€
-- ============================================================================
INSERT INTO yatra.gratuit_events (slug, title, category, city, region, lat, lon, description, recurrence, prix, url_official, source_type)
VALUES
  -- 0€ existants déjà seedés en P6, on ajoute des <5€ et <10€
  ('balade-guidee-paris-gratuite', 'Balades guidées Paris Greeters (gratuit)', 'culture', 'Paris', 'IDF', 48.8566, 2.3522,
    'Balades gratuites avec habitants bénévoles pour découvrir Paris autrement. Réservation en ligne.',
    'permanent', 0, 'https://www.greeters.paris/', 'official'),

  ('musee-carnavalet-paris-gratuit', 'Musée Carnavalet Paris (gratuit)', 'musee', 'Paris', 'IDF', 48.8571, 2.3624,
    'Musée d''histoire de Paris, collections permanentes gratuites toute l''année.',
    'permanent', 0, 'https://www.carnavalet.paris.fr/', 'official'),

  ('parc-tete-or-lyon-gratuit', 'Parc de la Tête d''Or Lyon (gratuit)', 'culture', 'Lyon', 'AURA', 45.7772, 4.8542,
    'Plus grand parc urbain de France, zoo gratuit, roseraie, serres tropicales gratuites.',
    'permanent', 0, 'https://www.lyon.fr/lieu/parcs/parc-de-la-tete-dor', 'official'),

  ('visite-guidee-vieux-lyon-5e', 'Visite guidée Vieux Lyon (5€)', 'culture', 'Lyon', 'AURA', 45.7640, 4.8270,
    'Visite guidée 2h du quartier Renaissance par l''Office de Tourisme, tarif réduit.',
    'weekly', 5, 'https://www.lyon-france.com/', 'official'),

  ('cinema-utopia-toulouse-5e', 'Cinéma Utopia Toulouse (séance 5€)', 'culture', 'Toulouse', 'OCC', 43.6047, 1.4442,
    'Séances cinéma art et essai à tarif militant 5€ (tout public), certains lundis et mercredis.',
    'weekly', 5, 'https://www.cinemas-utopia.org/toulouse/', 'official'),

  ('atelier-cuisine-solidaire-marseille-3e', 'Atelier cuisine solidaire Marseille (3€)', 'atelier', 'Marseille', 'PACA', 43.2965, 5.3698,
    'Atelier cuisine interculturel par association La Table de Cana, contribution libre 3€ suggérée.',
    'weekly', 3, 'https://www.tabledecana.org/', 'official'),

  ('concert-conservatoire-paris-8e', 'Concerts étudiants Conservatoire Paris (8€)', 'concert', 'Paris', 'IDF', 48.8606, 2.3376,
    'Concerts des élèves du Conservatoire National, tarif public 8€, réservation en ligne.',
    'weekly', 8, 'https://www.conservatoiredeparis.fr/', 'official'),

  ('visite-palais-rohan-strasbourg-6e', 'Visite Palais Rohan Strasbourg (6€)', 'musee', 'Strasbourg', 'Grand Est', 48.5810, 7.7521,
    'Musées du Palais Rohan (Arts décoratifs, Beaux-Arts, Archéologie), tarif réduit 6€ selon profil.',
    'permanent', 6, 'https://www.musees.strasbourg.eu/', 'official')

ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  lat = EXCLUDED.lat,
  lon = EXCLUDED.lon,
  description = EXCLUDED.description,
  recurrence = EXCLUDED.recurrence,
  prix = EXCLUDED.prix,
  url_official = EXCLUDED.url_official,
  source_type = EXCLUDED.source_type,
  active = true,
  updated_at = NOW();

-- ============================================================================
-- 3. EXTENSION AIDES SOCIALES — Profil SENIOR/RETRAITÉ (actuellement 3 → 10 aides)
-- ============================================================================
INSERT INTO yatra.aides (slug, nom, category, type_aide, region, montant_max, url_officielle, source_url, source_type, description, situation_eligible, transport_modes_eligible, profil_eligible, age_min, active)
VALUES
  -- ── SENIORS TRANSPORT ──
  ('carte-senior-plus-sncf', 'Carte Senior+ SNCF (>60 ans)', 'transport', 'reduction',
    'FR', 49.00,
    'https://www.sncf-connect.com/aide/cartes-senior-plus',
    'https://www.sncf-connect.com/aide/cartes-senior-plus',
    'official',
    'Carte 49 €/an pour 30% de réduction min sur les trains TGV et Intercités. Valable dès 60 ans.',
    ARRAY['retraite'],
    ARRAY['train'],
    ARRAY['senior'],
    60,
    true),

  ('carte-amethyste-idf', 'Carte Améthyste Île-de-France (>60 ans ou invalidité)', 'transport', 'reduction',
    'IDF', 0.00,
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/amethyste',
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/amethyste',
    'official',
    'Gratuité transports en commun IDF pour personnes de plus de 60 ans non imposables ou invalides. Navigo Améthyste à tarif réduit selon ressources.',
    ARRAY['retraite'],
    ARRAY['transport_public'],
    ARRAY['senior'],
    60,
    true),

  ('tcl-tarif-senior-lyon', 'Tarif réduit TCL Lyon seniors (>65 ans)', 'transport', 'reduction',
    'AURA', 0.00,
    'https://www.tcl.fr/abonnements-et-tickets/tarifs-seniors',
    'https://www.tcl.fr/abonnements-et-tickets/tarifs-seniors',
    'official',
    'Abonnement TCL à tarif réduit pour habitants Lyon Métropole de plus de 65 ans, ou dès 60 ans pour titulaires carte d''invalidité.',
    ARRAY['retraite'],
    ARRAY['transport_public'],
    ARRAY['senior'],
    60,
    true),

  ('rtm-marseille-senior-gratuit', 'RTM Marseille gratuit >60 ans (sous conditions)', 'transport', 'reduction',
    'PACA', 0.00,
    'https://www.rtm.fr/tarifs/marseillais-60-ans-et-plus',
    'https://www.rtm.fr/tarifs/marseillais-60-ans-et-plus',
    'official',
    'Gratuité des transports RTM Marseille pour résidents marseillais de plus de 60 ans sous conditions de ressources.',
    ARRAY['retraite'],
    ARRAY['transport_public'],
    ARRAY['senior'],
    60,
    true),

  -- ── SENIORS VACANCES ──
  ('carsat-aide-vacances-retraites', 'Aides vacances CARSAT/CNAV retraités', 'vacances', 'aide',
    'FR', 600.00,
    'https://www.lassuranceretraite.fr/portail-info/home/retraite/bien-vivre-retraite/vie-quotidienne/aides-action-sociale.html',
    'https://www.lassuranceretraite.fr/portail-info/home/retraite/bien-vivre-retraite/vie-quotidienne/aides-action-sociale.html',
    'official',
    'Aides au départ en vacances pour retraités aux ressources modestes, via caisses de retraite régionales (CARSAT/CNAV). Montant variable selon caisse et ressources, jusqu''à 600 € constaté.',
    ARRAY['retraite'],
    ARRAY[]::text[],
    ARRAY['senior'],
    60,
    true),

  ('cheques-vacances-retraites-complementaires', 'Chèques-Vacances caisses de retraite complémentaires', 'vacances', 'cheque',
    'FR', 400.00,
    'https://www.agirc-arrco.fr/mes-services/particulier/action-sociale/',
    'https://www.agirc-arrco.fr/mes-services/particulier/action-sociale/',
    'official',
    'Chèques-Vacances ANCV financés en partie par les caisses de retraite complémentaires (Agirc-Arrco, MSA, etc.), selon conditions de ressources. Montant variable, jusqu''à 400 € aide constatée.',
    ARRAY['retraite'],
    ARRAY[]::text[],
    ARRAY['senior'],
    60,
    true),

  ('ancv-aide-depart-vacances-seniors', 'ANCV Aide au Départ en Vacances seniors', 'vacances', 'aide',
    'FR', 500.00,
    'https://www.ancv.com/particuliers/partir-moins-cher/seniors',
    'https://www.ancv.com/particuliers/partir-moins-cher/seniors',
    'official',
    'Programme ANCV d''aide au départ en vacances pour seniors isolés ou à revenus modestes, via partenaires locaux (CCAS, caisses de retraite). Montant variable selon partenaire, jusqu''à 500 € constaté.',
    ARRAY['retraite'],
    ARRAY[]::text[],
    ARRAY['senior'],
    65,
    true)

ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  category = EXCLUDED.category,
  type_aide = EXCLUDED.type_aide,
  region = EXCLUDED.region,
  montant_max = EXCLUDED.montant_max,
  url_officielle = EXCLUDED.url_officielle,
  source_url = EXCLUDED.source_url,
  source_type = EXCLUDED.source_type,
  description = EXCLUDED.description,
  situation_eligible = EXCLUDED.situation_eligible,
  transport_modes_eligible = EXCLUDED.transport_modes_eligible,
  profil_eligible = EXCLUDED.profil_eligible,
  age_min = EXCLUDED.age_min,
  active = true,
  last_verified_at = NOW();

-- ============================================================================
-- 4. GRANT permissions (idempotent)
-- ============================================================================
GRANT ALL ON yatra.gratuit_events TO postgres, anon, authenticated, service_role;
GRANT ALL ON yatra.aides TO postgres, anon, authenticated, service_role;
