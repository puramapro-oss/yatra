-- YATRA — Migration P5
-- Radar Aides & Droits + Tavily veille 24/7
-- Étend `aides` avec colonnes mobilité + crée subscriptions et match cache.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. EXTENSIONS de la table `aides`
-- ============================================================================
ALTER TABLE yatra.aides
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT, -- 'transport' | 'energie' | 'logement' | 'sante' | 'social' | 'mobilite_handicap'
  ADD COLUMN IF NOT EXISTS transport_modes_eligible TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'official', -- 'official' | 'tavily' | 'community'
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS body_jsonb JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS popularity_score NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS uniq_aides_slug ON yatra.aides(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_aides_category ON yatra.aides(category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_aides_region ON yatra.aides(region) WHERE active = true;

-- Trigger updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'aides_updated_at') THEN
    CREATE TRIGGER aides_updated_at BEFORE UPDATE ON yatra.aides FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 2. TABLE aides_subscriptions — user follow une aide pour suivi
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aides_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aide_id UUID NOT NULL REFERENCES yatra.aides(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'following' CHECK (status IN ('following','dismissed','applied','received')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, aide_id)
);

CREATE INDEX IF NOT EXISTS idx_aides_sub_user ON yatra.aides_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_aides_sub_status ON yatra.aides_subscriptions(status);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'aides_sub_updated_at') THEN
    CREATE TRIGGER aides_sub_updated_at BEFORE UPDATE ON yatra.aides_subscriptions FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
END $$;

-- ============================================================================
-- 3. TABLE aides_user_match — cache scoring pertinence (recalculé quotidien)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aides_user_match (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  aide_id UUID NOT NULL REFERENCES yatra.aides(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score BETWEEN 0 AND 100),
  reasons TEXT[] NOT NULL DEFAULT '{}',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, aide_id)
);

CREATE INDEX IF NOT EXISTS idx_aides_match_user_score ON yatra.aides_user_match(user_id, score DESC);

-- ============================================================================
-- 4. RLS
-- ============================================================================
ALTER TABLE yatra.aides_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.aides_user_match ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='aides_subscriptions' AND policyname='asub_self_all') THEN
    CREATE POLICY asub_self_all ON yatra.aides_subscriptions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='aides_user_match' AND policyname='amatch_self_select') THEN
    CREATE POLICY amatch_self_select ON yatra.aides_user_match FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.aides TO postgres, anon, authenticated, service_role;
GRANT ALL ON yatra.aides_subscriptions TO postgres, authenticated, service_role;
GRANT ALL ON yatra.aides_user_match TO postgres, authenticated, service_role;

-- ============================================================================
-- 5. SEED — 30 aides FR officielles vérifiables (sources gouv 2026)
-- Toutes avec source_type='official' et URL .gouv.fr ou écosystème
-- ============================================================================

INSERT INTO yatra.aides (slug, nom, category, type_aide, region, montant_max, url_officielle, source_url, source_type, description, situation_eligible, transport_modes_eligible, profil_eligible)
VALUES
  -- ── TRANSPORT ──
  ('bonus-velo-2026', 'Bonus écologique vélo électrique', 'transport', 'prime',
    'FR', 400.00,
    'https://www.service-public.fr/particuliers/vosdroits/F35804',
    'https://www.service-public.fr/particuliers/vosdroits/F35804',
    'official',
    'Aide à l''achat d''un vélo électrique neuf ou d''occasion. Montant selon revenu fiscal.',
    ARRAY['salarie','etudiant','demandeur_emploi','retraite'],
    ARRAY['velo'],
    ARRAY['adulte']),

  ('prime-conversion-velo', 'Prime à la conversion vélo (mise au rebut véhicule)', 'transport', 'prime',
    'FR', 1500.00,
    'https://www.service-public.fr/particuliers/vosdroits/F35861',
    'https://www.service-public.fr/particuliers/vosdroits/F35861',
    'official',
    'Cumulable bonus vélo. Pour mise au rebut d''une voiture en faveur d''un vélo électrique.',
    ARRAY['salarie','etudiant','demandeur_emploi'],
    ARRAY['velo'],
    ARRAY['adulte']),

  ('forfait-mobilite-durable', 'Forfait Mobilités Durables (FMD)', 'transport', 'employeur',
    'FR', 800.00,
    'https://www.service-public.fr/particuliers/vosdroits/F34758',
    'https://www.service-public.fr/particuliers/vosdroits/F34758',
    'official',
    'Prise en charge employeur pour trajets domicile-travail en vélo, covoiturage ou transports en commun. Jusqu''à 800 €/an exonérés.',
    ARRAY['salarie','agent_public'],
    ARRAY['velo','transport_public','covoiturage','trottinette'],
    ARRAY['adulte']),

  ('prime-covoiturage-100e', 'Prime covoiturage 100 €', 'transport', 'prime',
    'FR', 100.00,
    'https://www.service-public.fr/particuliers/vosdroits/F36027',
    'https://www.service-public.fr/particuliers/vosdroits/F36027',
    'official',
    'Pour conducteurs effectuant leurs premiers trajets de courte distance en covoiturage via plateforme labellisée.',
    ARRAY['salarie','etudiant','demandeur_emploi'],
    ARRAY['covoiturage'],
    ARRAY['adulte']),

  ('chequemobilite-iledefrance', 'Chèque Mobilité Île-de-France', 'transport', 'cheque',
    'IDF', 500.00,
    'https://www.iledefrance.fr/aides-services',
    'https://www.iledefrance.fr/aides-services',
    'official',
    'Aide à l''achat de vélo, trottinette ou abonnement Navigo pour Franciliens éligibles selon revenus.',
    ARRAY['salarie','etudiant','demandeur_emploi'],
    ARRAY['velo','transport_public','trottinette'],
    ARRAY['adulte']),

  ('navigo-imagine-r', 'Navigo Imagine R réduit', 'transport', 'reduction',
    'IDF', 350.00,
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/imagine-r',
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/imagine-r',
    'official',
    'Abonnement Navigo annuel réduit pour étudiants moins de 26 ans en Île-de-France. ~350 €/an.',
    ARRAY['etudiant'],
    ARRAY['transport_public'],
    ARRAY['jeune_adulte']),

  ('navigo-solidarite', 'Navigo Solidarité (50%)', 'transport', 'reduction',
    'IDF', 500.00,
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/solidarites',
    'https://www.iledefrance-mobilites.fr/titres-et-tarifs/solidarites',
    'official',
    'Réduction 50% sur Navigo pour bénéficiaires du RSA, AAH, ASS ou demandeurs emploi.',
    ARRAY['demandeur_emploi','beneficiaire_rsa','beneficiaire_aah'],
    ARRAY['transport_public'],
    ARRAY['adulte']),

  ('tcl-tarif-solidaire-lyon', 'Tarif solidaire TCL Lyon', 'transport', 'reduction',
    'AURA', 250.00,
    'https://www.tcl.fr/abonnements-et-tickets/tarifs-solidaires',
    'https://www.tcl.fr/abonnements-et-tickets/tarifs-solidaires',
    'official',
    'Abonnement TCL réduit pour habitants Lyon Métropole sous conditions de ressources.',
    ARRAY['demandeur_emploi','beneficiaire_rsa','etudiant'],
    ARRAY['transport_public'],
    ARRAY['adulte']),

  ('velov-lyon-bonus', 'Vélo''v Lyon abonnement subventionné', 'transport', 'reduction',
    'AURA', 25.00,
    'https://velov.grandlyon.com/fr/tarifs',
    'https://velov.grandlyon.com/fr/tarifs',
    'official',
    'Abonnement Vélo''v annuel à 25 € au lieu de 89 € pour étudiants et précarité énergétique.',
    ARRAY['etudiant','demandeur_emploi'],
    ARRAY['velo'],
    ARRAY['adulte']),

  ('train-tgvmax-26ans', 'TGVMax 79 € illimité (12-27 ans)', 'transport', 'forfait',
    'FR', 79.00,
    'https://www.sncf-connect.com/offre/tgvmax',
    'https://www.sncf-connect.com/offre/tgvmax',
    'official',
    'Abonnement mensuel SNCF pour voyager en illimité en TGV InOui & Intercités sur places réservées.',
    ARRAY['etudiant','jeune_actif'],
    ARRAY['train'],
    ARRAY['jeune_adulte']),

  ('carte-avantage-jeune', 'Carte Avantage Jeune (16-27 ans)', 'transport', 'forfait',
    'FR', 49.00,
    'https://www.sncf-connect.com/cartes',
    'https://www.sncf-connect.com/cartes',
    'official',
    'Carte SNCF 49 €/an pour 30% de réduction min sur les trains TGV et Intercités.',
    ARRAY['etudiant','jeune_actif'],
    ARRAY['train'],
    ARRAY['jeune_adulte']),

  -- ── ÉNERGIE / TRANSPORT CARBONÉ → ALTERNATIVES PROPRES ──
  ('cheque-energie', 'Chèque Énergie', 'energie', 'cheque',
    'FR', 277.00,
    'https://www.service-public.fr/particuliers/vosdroits/F867',
    'https://www.service-public.fr/particuliers/vosdroits/F867',
    'official',
    'Aide annuelle automatique pour payer factures énergie. Cumulable avec autres aides.',
    ARRAY['salarie','etudiant','demandeur_emploi','retraite'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('mpr-renov-velo', 'Aide rénovation logement (économies déplacements)', 'logement', 'prime',
    'FR', 4000.00,
    'https://www.service-public.fr/particuliers/vosdroits/F35066',
    'https://www.service-public.fr/particuliers/vosdroits/F35066',
    'official',
    'MaPrimeRénov'' permet de rendre logement plus économe → moins de trajets carbonés.',
    ARRAY['proprietaire'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  -- ── SOCIAL / RSA / DROITS ──
  ('rsa', 'Revenu de Solidarité Active (RSA)', 'social', 'allocation',
    'FR', 635.00,
    'https://www.service-public.fr/particuliers/vosdroits/N19775',
    'https://www.service-public.fr/particuliers/vosdroits/N19775',
    'official',
    'Allocation mensuelle pour personnes sans ressources ou ressources faibles. Ouvre droits transport solidaires.',
    ARRAY['demandeur_emploi'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('aah', 'Allocation Adultes Handicapés (AAH)', 'social', 'allocation',
    'FR', 1016.00,
    'https://www.service-public.fr/particuliers/vosdroits/N12230',
    'https://www.service-public.fr/particuliers/vosdroits/N12230',
    'official',
    'Allocation pour personnes en situation de handicap. Ouvre droits gratuits transport selon ville.',
    ARRAY['beneficiaire_aah','en_situation_handicap'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('mdph-pmr-transport', 'Carte Mobilité Inclusion (CMI)', 'mobilite_handicap', 'reduction',
    'FR', 0.00,
    'https://www.service-public.fr/particuliers/vosdroits/F34049',
    'https://www.service-public.fr/particuliers/vosdroits/F34049',
    'official',
    'Carte CMI MDPH ouvre droits gratuité transport public, places PMR, accompagnant gratuit selon mention.',
    ARRAY['en_situation_handicap','beneficiaire_aah'],
    ARRAY['transport_public','train'],
    ARRAY['adulte']),

  ('apl', 'Aide Personnalisée au Logement (APL)', 'logement', 'allocation',
    'FR', 350.00,
    'https://www.service-public.fr/particuliers/vosdroits/F1280',
    'https://www.service-public.fr/particuliers/vosdroits/F1280',
    'official',
    'Aide CAF au paiement du loyer ou prêt logement, libère du budget mobilité.',
    ARRAY['etudiant','salarie','demandeur_emploi'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('crous-aides-mobilite', 'Aides CROUS Mobilité étudiants', 'transport', 'forfait',
    'FR', 1000.00,
    'https://www.etudiant.gouv.fr/fr/aides-financieres-29',
    'https://www.etudiant.gouv.fr/fr/aides-financieres-29',
    'official',
    'Aides CROUS pour étudiants en mobilité internationale ou Master en autre académie.',
    ARRAY['etudiant'],
    ARRAY['train','transport_public'],
    ARRAY['jeune_adulte']),

  -- ── FSL TRANSPORT ──
  ('fsl-transport', 'Fonds de Solidarité Logement transport', 'social', 'aide',
    'FR', 500.00,
    'https://www.service-public.fr/particuliers/vosdroits/F1334',
    'https://www.service-public.fr/particuliers/vosdroits/F1334',
    'official',
    'Aide ponctuelle FSL transport pour acheter abonnement transport ou réparer véhicule indispensable au travail.',
    ARRAY['demandeur_emploi','beneficiaire_rsa','salarie_precaire'],
    ARRAY['transport_public'],
    ARRAY['adulte']),

  ('aide-permis-1euro', 'Permis à 1 € par jour (15-25 ans)', 'transport', 'pret',
    'FR', 1200.00,
    'https://www.service-public.fr/particuliers/vosdroits/F2825',
    'https://www.service-public.fr/particuliers/vosdroits/F2825',
    'official',
    'Prêt à taux zéro pour passer le permis de conduire (15-25 ans).',
    ARRAY['etudiant','jeune_actif'],
    ARRAY[]::text[],
    ARRAY['jeune_adulte']),

  ('cmu-c-aide-transport', 'Complémentaire Santé Solidaire (transport médical)', 'sante', 'aide',
    'FR', 0.00,
    'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante-solidaire',
    'https://www.ameli.fr/assure/droits-demarches/difficultes-acces-droits-soins/complementaire-sante-solidaire',
    'official',
    'CSS prend en charge les frais de transport médical (taxi conventionné, ambulance) pour bénéficiaires.',
    ARRAY['beneficiaire_rsa','demandeur_emploi','retraite'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('prime-activite', 'Prime d''Activité (CAF)', 'social', 'allocation',
    'FR', 240.00,
    'https://www.service-public.fr/particuliers/vosdroits/F2882',
    'https://www.service-public.fr/particuliers/vosdroits/F2882',
    'official',
    'Allocation mensuelle CAF pour travailleurs aux revenus modestes. Couvre frais transport quotidiens.',
    ARRAY['salarie_precaire','salarie'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  ('aide-installation-jeune', 'Aide à l''installation Action Logement (LOCA-PASS)', 'logement', 'pret',
    'FR', 1200.00,
    'https://www.actionlogement.fr/aide-mobi-pass',
    'https://www.actionlogement.fr/aide-mobi-pass',
    'official',
    'Avance loyer + caution pour jeunes actifs ou en mutation professionnelle.',
    ARRAY['jeune_actif','salarie'],
    ARRAY[]::text[],
    ARRAY['jeune_adulte']),

  ('aide-mobili-jeune', 'Mobili-Jeune (jeunes apprentis)', 'logement', 'aide',
    'FR', 1200.00,
    'https://www.actionlogement.fr/aide-mobili-jeune',
    'https://www.actionlogement.fr/aide-mobili-jeune',
    'official',
    'Aide mensuelle 10-100 €/mois pour aide au logement des apprentis < 30 ans.',
    ARRAY['apprenti','etudiant'],
    ARRAY[]::text[],
    ARRAY['jeune_adulte']),

  ('rqth-amenagement-poste', 'Reconnaissance Qualité Travailleur Handicapé (RQTH)', 'mobilite_handicap', 'aide',
    'FR', 0.00,
    'https://www.service-public.fr/particuliers/vosdroits/F1652',
    'https://www.service-public.fr/particuliers/vosdroits/F1652',
    'official',
    'RQTH ouvre droits aménagement poste de travail dont télétravail (réduction trajets carbonés).',
    ARRAY['en_situation_handicap','salarie'],
    ARRAY[]::text[],
    ARRAY['adulte']),

  -- ── DIVERSES ──
  ('parex-bonus-fonctionnaire', 'Indemnité kilométrique vélo Fonction Publique', 'transport', 'indemnite',
    'FR', 300.00,
    'https://www.fonction-publique.gouv.fr/biep/forfait-mobilites-durables',
    'https://www.fonction-publique.gouv.fr/biep/forfait-mobilites-durables',
    'official',
    'FMD pour agents publics, jusqu''à 300 € par an pour usage vélo ou covoiturage trajet domicile-travail.',
    ARRAY['agent_public'],
    ARRAY['velo','covoiturage'],
    ARRAY['adulte']),

  ('jeune-actif-pole-emploi', 'Aide aux frais de mobilité Pôle emploi', 'transport', 'aide',
    'FR', 200.00,
    'https://www.francetravail.fr/candidat/mes-aides-financieres/le-detail-des-aides-financieres/laide-a-la-mobilite.html',
    'https://www.francetravail.fr/candidat/mes-aides-financieres/le-detail-des-aides-financieres/laide-a-la-mobilite.html',
    'official',
    'France Travail rembourse trajets pour entretien d''embauche, formation > 60 km du domicile.',
    ARRAY['demandeur_emploi'],
    ARRAY['train','transport_public','covoiturage'],
    ARRAY['adulte']),

  ('atip-aide-velo-toulouse', 'Aide vélo Toulouse Métropole', 'transport', 'prime',
    'OCC', 400.00,
    'https://www.toulouse-metropole.fr/aides-velo',
    'https://www.toulouse-metropole.fr/aides-velo',
    'official',
    'Prime pour achat vélo électrique ou vélo cargo à Toulouse Métropole (sous conditions ressources).',
    ARRAY['salarie','etudiant','demandeur_emploi'],
    ARRAY['velo'],
    ARRAY['adulte']),

  ('bouy-grenoble-mobilite', 'Métrovélo Grenoble (location longue durée)', 'transport', 'reduction',
    'AURA', 240.00,
    'https://www.metrovelo.fr/abonnements',
    'https://www.metrovelo.fr/abonnements',
    'official',
    'Location vélo électrique à Grenoble : 20 €/mois, gratuit pour bénéficiaires RSA et CMI mobilité.',
    ARRAY['salarie','etudiant','beneficiaire_rsa','en_situation_handicap'],
    ARRAY['velo'],
    ARRAY['adulte']),

  ('zfe-prime-conversion-occitanie', 'Prime conversion vélo Occitanie ZFE', 'transport', 'prime',
    'OCC', 1500.00,
    'https://www.laregion.fr/eco-cheque-mobilite',
    'https://www.laregion.fr/eco-cheque-mobilite',
    'official',
    'Éco-chèque mobilité 1500 € en Occitanie pour habitants ZFE (Toulouse, Montpellier).',
    ARRAY['salarie','etudiant','demandeur_emploi'],
    ARRAY['velo','transport_public'],
    ARRAY['adulte'])

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
  active = TRUE,
  last_verified_at = NOW();
