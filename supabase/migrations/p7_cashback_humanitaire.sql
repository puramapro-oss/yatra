-- YATRA — Migration P7
-- Cashback éthique + Voyages humanitaires (VIDA Assoc). Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. cashback_partners — boutiques/services partenaires
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.cashback_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'bio' | 'vrac' | 'mobilite' | 'energie' | 'mode_ethique' | 'cosmetique' | 'librairie' | 'voyage'
  logo_url TEXT,
  description TEXT NOT NULL,
  redirect_url TEXT NOT NULL, -- URL partenaire (avec placeholder {tracking_id})
  commission_pct NUMERIC(5,2) NOT NULL CHECK (commission_pct >= 0 AND commission_pct <= 100),
  user_share_pct NUMERIC(5,2) NOT NULL DEFAULT 70 CHECK (user_share_pct >= 0 AND user_share_pct <= 100), -- % de la commission reversé à l'user
  min_purchase_eur NUMERIC(10,2) DEFAULT 0,
  max_cashback_eur NUMERIC(10,2),
  conditions TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  ethical_score INT NOT NULL DEFAULT 80 CHECK (ethical_score >= 0 AND ethical_score <= 100),
  popularity_score INT NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashback_partners_category ON yatra.cashback_partners(category) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_cashback_partners_popularity ON yatra.cashback_partners(popularity_score DESC) WHERE active = true;

-- ============================================================================
-- 2. cashback_clicks — tracking redirection user → partner
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.cashback_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES yatra.cashback_partners(id) ON DELETE CASCADE,
  tracking_id TEXT UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  ip_hash TEXT,
  user_agent TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted BOOLEAN NOT NULL DEFAULT FALSE,
  converted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cashback_clicks_user ON yatra.cashback_clicks(user_id, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_clicks_tracking ON yatra.cashback_clicks(tracking_id);

-- ============================================================================
-- 3. cashback_transactions — événement-source (immuable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES yatra.cashback_partners(id) ON DELETE CASCADE,
  click_id UUID REFERENCES yatra.cashback_clicks(id) ON DELETE SET NULL,
  purchase_amount_eur NUMERIC(10,2) NOT NULL CHECK (purchase_amount_eur > 0),
  commission_total_eur NUMERIC(10,2) NOT NULL CHECK (commission_total_eur >= 0),
  user_share_eur NUMERIC(10,2) NOT NULL CHECK (user_share_eur >= 0),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'confirmed' | 'paid' | 'cancelled'
  external_order_id TEXT,
  notes TEXT,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cashback_tx_user ON yatra.cashback_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cashback_tx_status ON yatra.cashback_transactions(status, created_at DESC);

-- ============================================================================
-- 4. RPC credit_cashback_v1 — atomique : confirm tx + credit wallet
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.credit_cashback_v1(
  p_user_id UUID,
  p_tx_id UUID
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = yatra, public AS $$
DECLARE
  v_tx yatra.cashback_transactions%ROWTYPE;
  v_partner_name TEXT;
BEGIN
  -- Lock + read transaction
  SELECT * INTO v_tx
  FROM yatra.cashback_transactions
  WHERE id = p_tx_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'cashback_tx_not_found';
  END IF;

  IF v_tx.status <> 'pending' THEN
    RAISE EXCEPTION 'cashback_tx_already_processed: %', v_tx.status;
  END IF;

  SELECT name INTO v_partner_name FROM yatra.cashback_partners WHERE id = v_tx.partner_id;

  -- Mark confirmed
  UPDATE yatra.cashback_transactions
  SET status = 'confirmed', confirmed_at = NOW()
  WHERE id = p_tx_id;

  -- Insert wallet event-source
  INSERT INTO yatra.wallet_transactions (user_id, type, amount, source, source_id, description)
  VALUES (
    p_user_id,
    'credit',
    v_tx.user_share_eur,
    'cashback',
    p_tx_id,
    'Cashback ' || COALESCE(v_partner_name, 'partenaire')
  );

  -- Update wallet aggregate
  INSERT INTO yatra.wallets (user_id, balance, total_earned)
  VALUES (p_user_id, v_tx.user_share_eur, v_tx.user_share_eur)
  ON CONFLICT (user_id) DO UPDATE
  SET balance = yatra.wallets.balance + v_tx.user_share_eur,
      total_earned = yatra.wallets.total_earned + v_tx.user_share_eur,
      updated_at = NOW();

  RETURN jsonb_build_object(
    'tx_id', p_tx_id,
    'amount_credited', v_tx.user_share_eur,
    'partner', v_partner_name
  );
END $$;

GRANT EXECUTE ON FUNCTION yatra.credit_cashback_v1(UUID, UUID) TO service_role;
REVOKE EXECUTE ON FUNCTION yatra.credit_cashback_v1(UUID, UUID) FROM authenticated, anon, public;

-- ============================================================================
-- 5. humanitarian_missions — missions VIDA Assoc
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.humanitarian_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  ngo_name TEXT NOT NULL,
  ngo_url TEXT,
  cause TEXT NOT NULL, -- 'climat' | 'social' | 'education' | 'sante' | 'biodiversite' | 'urgence'
  destination_city TEXT,
  destination_country TEXT NOT NULL DEFAULT 'France',
  description TEXT NOT NULL,
  duration_days INT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  spots_total INT NOT NULL DEFAULT 10,
  spots_taken INT NOT NULL DEFAULT 0 CHECK (spots_taken >= 0),
  cost_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_discount_pct INT NOT NULL DEFAULT 50, -- réduction billet train (mobilité douce vers mission)
  required_age_min INT DEFAULT 18,
  prerequisites TEXT,
  contact_email TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (spots_taken <= spots_total)
);

CREATE INDEX IF NOT EXISTS idx_humanitarian_cause ON yatra.humanitarian_missions(cause) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_humanitarian_starts_at ON yatra.humanitarian_missions(starts_at) WHERE active = true;

-- ============================================================================
-- 6. humanitarian_applications — candidatures
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.humanitarian_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES yatra.humanitarian_missions(id) ON DELETE CASCADE,
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'declined' | 'withdrawn'
  status_reason TEXT,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_humanitarian_apps_user ON yatra.humanitarian_applications(user_id, applied_at DESC);
CREATE INDEX IF NOT EXISTS idx_humanitarian_apps_mission ON yatra.humanitarian_applications(mission_id, status);

-- ============================================================================
-- 7. RLS
-- ============================================================================
ALTER TABLE yatra.cashback_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.cashback_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.cashback_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.humanitarian_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.humanitarian_applications ENABLE ROW LEVEL SECURITY;

-- Partners : lecture publique (auth)
DROP POLICY IF EXISTS partners_read_authed ON yatra.cashback_partners;
CREATE POLICY partners_read_authed ON yatra.cashback_partners
  FOR SELECT TO authenticated USING (active = true);

-- Clicks : user voit ses propres clicks
DROP POLICY IF EXISTS clicks_self_read ON yatra.cashback_clicks;
CREATE POLICY clicks_self_read ON yatra.cashback_clicks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS clicks_self_insert ON yatra.cashback_clicks;
CREATE POLICY clicks_self_insert ON yatra.cashback_clicks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Transactions : user voit ses propres tx (insert via webhook = service_role)
DROP POLICY IF EXISTS cashback_tx_self_read ON yatra.cashback_transactions;
CREATE POLICY cashback_tx_self_read ON yatra.cashback_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Missions : lecture publique (auth)
DROP POLICY IF EXISTS missions_read_authed ON yatra.humanitarian_missions;
CREATE POLICY missions_read_authed ON yatra.humanitarian_missions
  FOR SELECT TO authenticated USING (active = true);

-- Applications : self read/insert/update (withdraw)
DROP POLICY IF EXISTS apps_self_read ON yatra.humanitarian_applications;
CREATE POLICY apps_self_read ON yatra.humanitarian_applications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS apps_self_insert ON yatra.humanitarian_applications;
CREATE POLICY apps_self_insert ON yatra.humanitarian_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS apps_self_update ON yatra.humanitarian_applications;
CREATE POLICY apps_self_update ON yatra.humanitarian_applications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 8. Seed 8 partenaires éthiques FR
-- ============================================================================
INSERT INTO yatra.cashback_partners (slug, name, category, description, redirect_url, commission_pct, user_share_pct, ethical_score, popularity_score) VALUES
  ('greenweez', 'Greenweez', 'bio', 'Le supermarché bio en ligne — 17 000 produits bio et écologiques.', 'https://www.greenweez.com/?ref=yatra&t={tracking_id}', 4.0, 70, 92, 95),
  ('la-fourche', 'La Fourche', 'bio', 'Adhésion bio à prix coûtant. -20% à -50% sur le bio en ligne.', 'https://lafourche.fr/?ref=yatra&t={tracking_id}', 6.0, 70, 95, 90),
  ('blablacar-daily', 'BlaBlaCar Daily', 'mobilite', 'Covoiturage domicile-travail entre voisins. Économies + CO₂ évité.', 'https://www.blablacardaily.com/?ref=yatra&t={tracking_id}', 8.0, 75, 88, 92),
  ('citiz', 'Citiz Autopartage', 'mobilite', 'Réseau coopératif d''autopartage en France. 5x moins de voitures stationnées.', 'https://citiz.fr/?ref=yatra&t={tracking_id}', 5.0, 70, 90, 78),
  ('enercoop', 'Enercoop', 'energie', 'Coopérative d''énergie 100% renouvelable et locale.', 'https://www.enercoop.fr/?ref=yatra&t={tracking_id}', 3.0, 75, 98, 85),
  ('ilek', 'ilek', 'energie', 'Énergie verte directement chez les producteurs locaux français.', 'https://www.ilek.fr/?ref=yatra&t={tracking_id}', 4.5, 70, 90, 80),
  ('fairphone', 'Fairphone', 'mode_ethique', 'Smartphone modulaire et réparable, matériaux équitables.', 'https://shop.fairphone.com/?ref=yatra&t={tracking_id}', 2.5, 80, 96, 75),
  ('veja', 'Veja', 'mode_ethique', 'Sneakers en coton bio, caoutchouc d''Amazonie, transparence radicale.', 'https://www.veja-store.com/?ref=yatra&t={tracking_id}', 5.0, 70, 89, 88)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  commission_pct = EXCLUDED.commission_pct,
  user_share_pct = EXCLUDED.user_share_pct,
  updated_at = NOW();

-- ============================================================================
-- 9. Seed 6 missions VIDA Assoc
-- ============================================================================
INSERT INTO yatra.humanitarian_missions (slug, title, ngo_name, ngo_url, cause, destination_city, destination_country, description, duration_days, spots_total, cost_eur, transport_discount_pct, contact_email) VALUES
  ('reforestation-cevennes-2026', 'Reforestation Cévennes — 5 jours', 'Reforest''Action', 'https://www.reforestaction.com', 'biodiversite', 'Florac', 'France', 'Plantation de 1000 arbres sur parcelles dévastées. Hébergement collectif. Train + navette inclus.', 5, 12, 0, 100, 'missions@reforestaction.com'),
  ('maraude-paris-hiver', 'Maraude solidaire Paris — Hiver', 'Croix-Rouge française', 'https://www.croix-rouge.fr', 'social', 'Paris', 'France', '3 nuits de maraudes en équipe pour rencontrer et soutenir les sans-abri.', 3, 20, 0, 75, 'paris@croix-rouge.fr'),
  ('jardins-partages-marseille', 'Jardins partagés Marseille — Printemps', 'Le Talus', 'https://letalus.com', 'climat', 'Marseille', 'France', 'Aide à l''implantation de jardins permaculture en quartier nord. Chantier participatif.', 7, 15, 0, 60, 'contact@letalus.com'),
  ('alphabetisation-lyon', 'Alphabétisation adultes — Lyon', 'Secours Catholique', 'https://www.secours-catholique.org', 'education', 'Lyon', 'France', 'Soutien hebdomadaire en alphabétisation auprès de personnes en précarité.', 90, 8, 0, 50, 'lyon@secours-catholique.org'),
  ('vendanges-solidaires-bordeaux', 'Vendanges solidaires bio — Bordeaux', 'Terre de Liens', 'https://terredeliens.org', 'climat', 'Bordeaux', 'France', 'Vendanges chez producteurs bio en transition. Repas + hébergement offerts.', 10, 25, 0, 70, 'gironde@terredeliens.org'),
  ('classes-vertes-pyrenees', 'Animation classes vertes — Pyrénées', 'Mountain Riders', 'https://www.mountain-riders.org', 'education', 'Cauterets', 'France', 'Animation auprès de scolaires sur la fonte des glaciers et la protection des écosystèmes.', 14, 6, 200, 80, 'asso@mountain-riders.org')
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  spots_total = EXCLUDED.spots_total,
  cost_eur = EXCLUDED.cost_eur,
  updated_at = NOW();

-- ============================================================================
-- 10. Trigger updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trg_cashback_partners_updated ON yatra.cashback_partners;
CREATE TRIGGER trg_cashback_partners_updated BEFORE UPDATE ON yatra.cashback_partners
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();

DROP TRIGGER IF EXISTS trg_humanitarian_missions_updated ON yatra.humanitarian_missions;
CREATE TRIGGER trg_humanitarian_missions_updated BEFORE UPDATE ON yatra.humanitarian_missions
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
