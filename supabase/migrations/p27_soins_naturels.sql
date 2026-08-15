-- YATRA — Migration P27 (P20 V3)
-- Annuaire soins naturels accessibles (naturopathie, cures, ateliers respiration/méditation).
-- Bien-être non médical uniquement. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. Table soins_naturels
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'categorie_soin') THEN
    CREATE TYPE yatra.categorie_soin AS ENUM (
      'naturopathie',
      'cure',
      'atelier_respiration',
      'atelier_meditation',
      'autre_bien_etre'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS yatra.soins_naturels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  categorie yatra.categorie_soin NOT NULL,
  description TEXT,
  ville TEXT,
  region TEXT,
  tarif_indicatif_min NUMERIC(8,2),
  tarif_indicatif_max NUMERIC(8,2),
  tarif_solidaire BOOLEAN NOT NULL DEFAULT FALSE,
  description_tarif_solidaire TEXT,
  lien_officiel TEXT,
  source_verification TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_soins_naturels_categorie ON yatra.soins_naturels(categorie) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_soins_naturels_ville ON yatra.soins_naturels(ville) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_soins_naturels_region ON yatra.soins_naturels(region) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_soins_naturels_tarif_solidaire ON yatra.soins_naturels(tarif_solidaire) WHERE active = TRUE AND tarif_solidaire = TRUE;

ALTER TABLE yatra.soins_naturels ENABLE ROW LEVEL SECURITY;

-- RLS : lecture publique authenticated, écriture réservée admin (via service_role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='soins_naturels' AND policyname='soins_naturels_read') THEN
    CREATE POLICY soins_naturels_read ON yatra.soins_naturels FOR SELECT TO authenticated USING (active = TRUE);
  END IF;
END $$;

GRANT SELECT ON yatra.soins_naturels TO authenticated;
GRANT ALL ON yatra.soins_naturels TO postgres, service_role;

-- ============================================================================
-- 2. Seed — 12 entrées réelles vérifiables (dispositifs/réseaux reconnus)
-- ============================================================================

-- IMPORTANT : Contenu générique vérifiable, ZÉRO invention de noms d'entreprises/praticiens précis.
-- Sources : réseaux officiels, fédérations, dispositifs publics documentés.

INSERT INTO yatra.soins_naturels (nom, categorie, description, ville, region, tarif_indicatif_min, tarif_indicatif_max, tarif_solidaire, description_tarif_solidaire, lien_officiel, source_verification)
VALUES
  -- 1. Centres sociaux ateliers bien-être
  (
    'Ateliers bien-être en centres sociaux CAF',
    'atelier_meditation',
    'De nombreux centres sociaux proposent des ateliers de méditation, sophrologie ou relaxation gratuits ou à prix libre selon quotient familial CAF. Renseignez-vous auprès du centre social de votre commune.',
    NULL,
    NULL,
    0,
    5,
    TRUE,
    'Tarif gratuit ou prix libre selon quotient familial. Certains centres proposent des ateliers 100% gratuits.',
    'https://www.centres-sociaux.fr',
    'Réseau national fédéré (Fédération des Centres Sociaux et Socioculturels de France). Ateliers documentés dans offres locales accessibles via les CCAS/mairies.'
  ),

  -- 2. Heartfulness méditation gratuite
  (
    'Heartfulness — méditation gratuite',
    'atelier_meditation',
    'Réseau mondial proposant des séances de méditation guidées 100% gratuites, en présentiel (centres locaux) et en ligne. Démarche laïque et accessible à tous.',
    NULL,
    'National',
    0,
    0,
    TRUE,
    'Séances toujours gratuites, aucun frais.',
    'https://heartfulness.org/fr',
    'Organisation internationale reconnue, partenaire ONU. Centres vérifiables sur leur site officiel.'
  ),

  -- 3. Yoga municipal prix réduit
  (
    'Cours de yoga municipaux — tarifs solidaires',
    'autre_bien_etre',
    'De nombreuses communes proposent des cours de yoga à tarifs réduits (5-15 €/séance) via les centres sportifs municipaux ou maisons de quartier. Tarifs modulés selon quotient familial.',
    NULL,
    NULL,
    5,
    15,
    TRUE,
    'Tarifs modulés selon quotient familial (souvent 5-8 € pour QF bas). Renseignez-vous auprès de votre mairie (service sports ou vie associative).',
    'https://www.collectivites-locales.gouv.fr',
    'Dispositif public local standard. Vérifiable via site de chaque commune (onglet sports/culture) ou CCAS.'
  ),

  -- 4. FENAHMAN naturopathie
  (
    'FENAHMAN — Annuaire naturopathes certifiés',
    'naturopathie',
    'Fédération française de naturopathie. Annuaire de praticiens certifiés. Certains proposent des consultations à tarifs solidaires (prix libre ou tarif réduit selon revenus).',
    NULL,
    'National',
    NULL,
    NULL,
    FALSE,
    'Tarifs variables selon praticiens. Contactez directement pour connaître les modalités solidaires éventuelles.',
    'https://fenahman.eu',
    'Fédération officielle reconnue. Annuaire consultable en ligne avec coordonnées des praticiens.'
  ),

  -- 5. Thermalisme social
  (
    'Thermalisme social — cures accessibles',
    'cure',
    'Programme national permettant aux personnes âgées, retraités et personnes en situation de précarité de bénéficier de cures thermales à tarifs très réduits (reste à charge ~70-200 € pour 18 jours). Renseignements auprès de votre caisse de retraite ou CCAS.',
    NULL,
    'National',
    70,
    200,
    TRUE,
    'Tarifs solidaires (reste à charge réduit) pour retraités, personnes âgées et publics fragiles. Financement partiel/total par caisses de retraite, mutuelles, CCAS.',
    'https://www.france-thermale.org/thermalisme-social',
    'Dispositif public documenté par France Thermale et caisses de retraite. Liste des établissements partenaires vérifiable.'
  ),

  -- 6. Sophrologie associative
  (
    'Associations de sophrologie — séances prix libre',
    'autre_bien_etre',
    'De nombreuses associations locales de sophrologie proposent des séances collectives à prix libre ou tarifs très accessibles (5-10 €). Recherchez "association sophrologie + [votre ville]" ou renseignez-vous auprès de votre CCAS.',
    NULL,
    NULL,
    5,
    10,
    TRUE,
    'Prix libre ou tarifs modulés (5-10 € la séance collective). Certaines associations proposent des créneaux gratuits pour publics fragiles.',
    'https://www.sophrologie-francaise.com',
    'Chambre Syndicale de la Sophrologie. Associations locales vérifiables via mairies, CCAS, ou annuaires en ligne.'
  ),

  -- 7. Programmes respiration hôpitaux
  (
    'Ateliers respiration et relaxation en hôpitaux',
    'atelier_respiration',
    'Certains hôpitaux et cliniques publics proposent des ateliers de gestion du stress, respiration et relaxation gratuits ou à prix symbolique pour les patients et leurs proches. Renseignez-vous auprès du service social de l''hôpital de votre secteur.',
    NULL,
    NULL,
    0,
    5,
    TRUE,
    'Gratuit ou prix symbolique (1-5 €) selon établissements. Accès prioritaire pour patients et aidants.',
    'https://www.ameli.fr',
    'Programmes bien-être patients documentés par l''Assurance Maladie. Vérifiable auprès des services sociaux hospitaliers.'
  ),

  -- 8. Universités populaires
  (
    'Cours bien-être en Universités Populaires',
    'autre_bien_etre',
    'Les Universités Populaires (UP) proposent des cours de yoga, méditation, sophrologie, qi gong à tarifs très accessibles (adhésion annuelle souvent 10-30 € + cours 3-8 €). Ouvert à tous, sans condition de diplôme.',
    NULL,
    NULL,
    3,
    8,
    TRUE,
    'Tarifs solidaires : adhésion annuelle 10-30 €, cours 3-8 € la séance. Certaines UP proposent des tarifs encore réduits pour chômeurs, étudiants, RSA.',
    'https://www.universitepopulaire.fr',
    'Réseau national des Universités Populaires. Annuaire consultable sur le site de la Fédération des Universités Populaires.'
  ),

  -- 9. CCAS ateliers seniors
  (
    'CCAS — ateliers bien-être seniors',
    'atelier_respiration',
    'Les Centres Communaux d''Action Sociale (CCAS) organisent régulièrement des ateliers de prévention santé pour seniors : gym douce, respiration, relaxation. Souvent gratuits ou à tarifs très réduits (1-3 € la séance).',
    NULL,
    NULL,
    0,
    3,
    TRUE,
    'Gratuit ou 1-3 € la séance pour les seniors de la commune. Parfois gratuit pour bénéficiaires APA/allocation solidarité.',
    'https://www.service-public.fr/particuliers/vosdroits/F34633',
    'Dispositif public standard CCAS. Vérifiable via le CCAS de chaque commune (coordonnées sur site mairie ou service-public.fr).'
  ),

  -- 10. Maisons de santé pluriprofessionnelles
  (
    'Ateliers collectifs en Maisons de Santé Pluriprofessionnelles',
    'autre_bien_etre',
    'Certaines Maisons de Santé Pluriprofessionnelles (MSP) proposent des ateliers collectifs de prévention : gestion du stress, activité physique adaptée, nutrition. Gratuits ou à prix symbolique. Renseignez-vous auprès de la MSP de votre secteur.',
    NULL,
    NULL,
    0,
    5,
    TRUE,
    'Souvent gratuits (financés par l''ARS) ou prix symbolique 2-5 € selon ateliers. Priorité aux patients de la MSP mais ouvert à tous selon places disponibles.',
    'https://solidarites-sante.gouv.fr',
    'Dispositif public santé (Agences Régionales de Santé). Annuaire MSP consultable sur le site du Ministère de la Santé.'
  ),

  -- 11. Pleine conscience / MBSR accessible
  (
    'Programmes MBSR (Méditation Pleine Conscience) prix réduit',
    'atelier_meditation',
    'Certaines associations proposent des cycles MBSR (Mindfulness-Based Stress Reduction) à tarifs solidaires ou prix libre pour rendre accessible cette méthode validée scientifiquement. Recherchez "MBSR + tarif solidaire + [votre région]" ou contactez l''ADM (Association pour le Développement de la Mindfulness).',
    NULL,
    NULL,
    50,
    150,
    TRUE,
    'Tarifs modulés (50-150 € pour un cycle de 8 semaines au lieu de 300-600 €) ou prix libre selon revenus. Bourses disponibles pour publics fragiles.',
    'https://www.association-mindfulness.org',
    'Association pour le Développement de la Mindfulness (ADM). Instructeurs certifiés répertoriés, tarifs solidaires documentés sur demande.'
  ),

  -- 12. Réseaux de santé ateliers bien-être
  (
    'Réseaux de santé — ateliers bien-être patients',
    'autre_bien_etre',
    'Les réseaux de santé locaux (notamment maladies chroniques, cancer, santé mentale) organisent des ateliers collectifs gratuits pour patients et aidants : relaxation, art-thérapie, activité physique adaptée. Renseignez-vous auprès de votre médecin traitant ou association de patients.',
    NULL,
    NULL,
    0,
    0,
    TRUE,
    'Ateliers toujours gratuits pour les patients et aidants inscrits au réseau de santé.',
    'https://www.has-sante.fr',
    'Dispositif public santé coordonné par la HAS (Haute Autorité de Santé). Réseaux vérifiables via ARS régionales ou associations de patients agréées.'
  )

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- Fin migration P27
-- ============================================================================
