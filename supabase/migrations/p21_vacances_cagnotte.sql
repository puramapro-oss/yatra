-- YATRA — Migration P21 (VACANCES V2.0 §8 — Cagnotte yatrage)
-- Cagnotte par projet de voyage, contributions publiques via lien de partage (les
-- proches n'ont pas forcément de compte YATRA). Phase 1 : crédite le wallet YATRA
-- existant du porteur de projet (yatra.credit_wallet_v1, p4_wallet.sql) — branchement
-- complet au wallet central via WALLET_INTEGRATION.md quand le core sera prêt.
-- Idempotent.

SET search_path = yatra, public;

CREATE TABLE IF NOT EXISTS yatra.vacances_cagnottes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  destination TEXT,
  objectif_eur NUMERIC(8, 2) NOT NULL CHECK (objectif_eur > 0),
  montant_actuel_eur NUMERIC(8, 2) NOT NULL DEFAULT 0,
  lien_partage_code TEXT UNIQUE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'active' CHECK (statut IN ('active', 'cloturee')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cagnottes_user ON yatra.vacances_cagnottes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cagnottes_code ON yatra.vacances_cagnottes(lien_partage_code);

CREATE TABLE IF NOT EXISTS yatra.vacances_cagnotte_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cagnotte_id UUID NOT NULL REFERENCES yatra.vacances_cagnottes(id) ON DELETE CASCADE,
  contributeur_nom TEXT NOT NULL,
  montant_eur NUMERIC(7, 2) NOT NULL CHECK (montant_eur > 0 AND montant_eur <= 500),
  type TEXT NOT NULL DEFAULT 'cotisation' CHECK (type IN ('cotisation', 'arrondi', 'mission_credit')),
  message TEXT,
  wallet_transaction_id UUID,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cagnotte_contrib_cagnotte ON yatra.vacances_cagnotte_contributions(cagnotte_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cagnotte_contrib_ip ON yatra.vacances_cagnotte_contributions(ip_hash, created_at DESC) WHERE ip_hash IS NOT NULL;

-- RPC atomique : insère la contribution + crédite le wallet du porteur + met à jour l'agrégat.
CREATE OR REPLACE FUNCTION yatra.contribute_cagnotte_v1(
  p_cagnotte_id UUID,
  p_contributeur_nom TEXT,
  p_montant_eur NUMERIC,
  p_type TEXT DEFAULT 'cotisation',
  p_message TEXT DEFAULT NULL,
  p_ip_hash TEXT DEFAULT NULL
) RETURNS TABLE(contribution_id UUID, nouveau_montant_actuel_eur NUMERIC, wallet_transaction_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_statut TEXT;
  v_contrib_id UUID;
  v_new_montant NUMERIC;
  v_credit RECORD;
BEGIN
  IF p_montant_eur IS NULL OR p_montant_eur <= 0 THEN
    RAISE EXCEPTION 'Montant invalide: %', p_montant_eur;
  END IF;

  SELECT user_id, statut INTO v_user_id, v_statut
  FROM yatra.vacances_cagnottes
  WHERE id = p_cagnotte_id
  FOR UPDATE;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Cagnotte introuvable';
  END IF;
  IF v_statut <> 'active' THEN
    RAISE EXCEPTION 'Cette cagnotte est clôturée';
  END IF;

  INSERT INTO yatra.vacances_cagnotte_contributions (cagnotte_id, contributeur_nom, montant_eur, type, message, ip_hash)
  VALUES (p_cagnotte_id, p_contributeur_nom, p_montant_eur, p_type, p_message, p_ip_hash)
  RETURNING id INTO v_contrib_id;

  SELECT * INTO v_credit FROM yatra.credit_wallet_v1(v_user_id, p_montant_eur, 'cagnotte_voyage', format('Cagnotte : %s', p_contributeur_nom), p_cagnotte_id);

  UPDATE yatra.vacances_cagnottes
  SET montant_actuel_eur = montant_actuel_eur + p_montant_eur
  WHERE id = p_cagnotte_id
  RETURNING montant_actuel_eur INTO v_new_montant;

  UPDATE yatra.vacances_cagnotte_contributions SET wallet_transaction_id = v_credit.transaction_id WHERE id = v_contrib_id;

  RETURN QUERY SELECT v_contrib_id, v_new_montant, v_credit.transaction_id;
END;
$$;

-- Pas de GRANT à `anon` : la contribution publique passe par l'API Next.js (service_role),
-- qui valide/limite la requête avant d'appeler cette fonction — pas d'exposition RPC directe.
GRANT EXECUTE ON FUNCTION yatra.contribute_cagnotte_v1(UUID, TEXT, NUMERIC, TEXT, TEXT, TEXT) TO authenticated, service_role;

ALTER TABLE yatra.vacances_cagnottes ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_cagnotte_contributions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_cagnottes' AND policyname='cagnottes_owner_all') THEN
    CREATE POLICY cagnottes_owner_all ON yatra.vacances_cagnottes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_cagnotte_contributions' AND policyname='cagnotte_contrib_owner_read') THEN
    CREATE POLICY cagnotte_contrib_owner_read ON yatra.vacances_cagnotte_contributions FOR SELECT
      USING (EXISTS (SELECT 1 FROM yatra.vacances_cagnottes c WHERE c.id = cagnotte_id AND c.user_id = auth.uid()));
  END IF;
END $$;

GRANT ALL ON yatra.vacances_cagnottes TO authenticated, service_role;
GRANT SELECT ON yatra.vacances_cagnotte_contributions TO authenticated;
GRANT ALL ON yatra.vacances_cagnotte_contributions TO service_role;
