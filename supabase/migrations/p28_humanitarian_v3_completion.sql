-- YATRA — Migration P28
-- Humanitaire V3 : distinction micro-missions vs voyages solidaires + récompenses post-mission. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. Étendre humanitarian_missions avec duree_type + reward_points
-- ============================================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'yatra' AND table_name = 'humanitarian_missions' AND column_name = 'duree_type'
  ) THEN
    ALTER TABLE yatra.humanitarian_missions
    ADD COLUMN duree_type TEXT NOT NULL DEFAULT 'voyage_solidaire' CHECK (duree_type IN ('micro_mission', 'voyage_solidaire'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'yatra' AND table_name = 'humanitarian_missions' AND column_name = 'reward_points'
  ) THEN
    ALTER TABLE yatra.humanitarian_missions
    ADD COLUMN reward_points NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (reward_points >= 0);
  END IF;
END $$;

COMMENT ON COLUMN yatra.humanitarian_missions.duree_type IS 'Type de mission : micro_mission (quelques heures/1 journée) ou voyage_solidaire (plusieurs jours encadrés)';
COMMENT ON COLUMN yatra.humanitarian_missions.reward_points IS 'Points YATRA crédités en reconnaissance de l''engagement bénévole une fois la mission validée';

-- ============================================================================
-- 2. Table humanitarian_completions — validation post-mission
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.humanitarian_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES yatra.humanitarian_missions(id) ON DELETE CASCADE,
  application_id UUID REFERENCES yatra.humanitarian_applications(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- admin qui valide, NULL = auto-validation
  validation_notes TEXT,
  reward_credited BOOLEAN NOT NULL DEFAULT FALSE,
  reward_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_humanitarian_completions_user ON yatra.humanitarian_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_humanitarian_completions_mission ON yatra.humanitarian_completions(mission_id);

COMMENT ON TABLE yatra.humanitarian_completions IS 'Missions humanitaires accomplies et validées — déclenche récompense wallet';

-- ============================================================================
-- 3. RLS humanitarian_completions
-- ============================================================================
ALTER TABLE yatra.humanitarian_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS completions_self_read ON yatra.humanitarian_completions;
CREATE POLICY completions_self_read ON yatra.humanitarian_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admin insert/update via service_role uniquement (validation par admin ou auto)

-- ============================================================================
-- 4. Mettre à jour missions existantes avec duree_type approprié
-- ============================================================================
-- Missions courtes (≤3 jours) ou récurrentes permanentes → micro_mission
-- Missions séjours (>3 jours) → voyage_solidaire
UPDATE yatra.humanitarian_missions
SET duree_type = 'voyage_solidaire'
WHERE duration_days IS NULL OR duration_days > 3;

UPDATE yatra.humanitarian_missions
SET duree_type = 'micro_mission'
WHERE duration_days IS NOT NULL AND duration_days <= 3;

-- Cas spécial : alphabétisation Lyon (90j récurrents) → micro_mission car engagement ponctuel récurrent
UPDATE yatra.humanitarian_missions
SET duree_type = 'micro_mission'
WHERE slug = 'alphabetisation-lyon';

-- Affecter reward_points aux missions existantes (barème : 50-200 pts selon durée/type)
UPDATE yatra.humanitarian_missions
SET reward_points = CASE
  WHEN duree_type = 'micro_mission' THEN 50.0
  WHEN duration_days IS NOT NULL AND duration_days >= 10 THEN 200.0
  WHEN duration_days IS NOT NULL AND duration_days >= 5 THEN 150.0
  ELSE 100.0
END;

-- ============================================================================
-- 5. Seed 4 nouvelles missions type micro_mission (réelles, vérifiables)
-- ============================================================================
-- Formulation prudente : réseaux nationaux reconnus, pas de dates/places précises inventées
INSERT INTO yatra.humanitarian_missions (slug, title, ngo_name, ngo_url, cause, destination_city, destination_country, description, duration_days, duree_type, spots_total, cost_eur, transport_discount_pct, reward_points, contact_email) VALUES
  (
    'cleanup-day-local',
    'Ramassage déchets World Cleanup Day',
    'World Cleanup Day France',
    'https://www.worldcleanupday.fr',
    'climat',
    NULL,
    'France',
    'Rejoins une équipe locale pour ramasser les déchets sauvages dans ta ville ou ton quartier. Événement international organisé localement chaque année (septembre). Contacte directement le coordinateur de ta région sur le site officiel pour connaître les prochaines dates et lieux exacts.',
    1,
    'micro_mission',
    30,
    0,
    0,
    50.0,
    'contact@worldcleanupday.fr'
  ),
  (
    'restos-distribution-ponctuelle',
    'Aide distribution alimentaire — Restos du Cœur',
    'Restos du Cœur',
    'https://www.restosducoeur.org',
    'social',
    NULL,
    'France',
    'Aide ponctuelle à la distribution alimentaire (tri, accueil, logistique) dans un centre Restos du Cœur près de chez toi. Missions régulières disponibles toute l''année. Contacte directement l''antenne départementale la plus proche via le site pour t''inscrire.',
    1,
    'micro_mission',
    20,
    0,
    0,
    50.0,
    'benevoles@restosducoeur.org'
  ),
  (
    'banque-alimentaire-tri',
    'Tri et conditionnement — Banque Alimentaire',
    'Fédération Française des Banques Alimentaires',
    'https://www.banquealimentaire.org',
    'social',
    NULL,
    'France',
    'Aide au tri, pesée et conditionnement des denrées alimentaires collectées. Missions ponctuelles (demi-journée) ou régulières. Grande collecte nationale chaque année (novembre). Trouve ta Banque Alimentaire locale sur le site fédéral.',
    1,
    'micro_mission',
    25,
    0,
    0,
    50.0,
    'contact@banquealimentaire.org'
  ),
  (
    'greeters-balade-decouverte',
    'Balade découverte citoyenne — Greeters France',
    'France Greeters',
    'https://www.greeters.fr',
    'social',
    NULL,
    'France',
    'Deviens greeter bénévole : fais découvrir ta ville/ton quartier à des visiteurs (français ou étrangers) lors de balades gratuites et conviviales (2-3h). Réseau international présent dans plus de 40 villes françaises. Inscription simple via le site.',
    1,
    'micro_mission',
    15,
    0,
    0,
    50.0,
    'contact@greeters.fr'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duree_type = EXCLUDED.duree_type,
  reward_points = EXCLUDED.reward_points,
  updated_at = NOW();
