-- YATRA — Migration P14 (VACANCES V2.0 §6 — socle "Vrai Prix Total")
-- Grilles de frais annexes transporteurs (bagages/sièges/dossier) + transferts aéroport
-- + historique des calculs utilisateur. Données de référence indicatives (grilles publiques
-- connues, RANGES car variables selon route/saison) — jamais un prix de billet inventé.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. GRILLES DE FRAIS ANNEXES PAR TRANSPORTEUR
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transporteur TEXT NOT NULL UNIQUE,
  type_transport TEXT NOT NULL CHECK (type_transport IN ('avion', 'train', 'bus')),
  bagage_cabine_min_eur NUMERIC(6, 2) DEFAULT 0,
  bagage_cabine_max_eur NUMERIC(6, 2) DEFAULT 0,
  bagage_soute_min_eur NUMERIC(6, 2) DEFAULT 0,
  bagage_soute_max_eur NUMERIC(6, 2) DEFAULT 0,
  siege_min_eur NUMERIC(6, 2) DEFAULT 0,
  siege_max_eur NUMERIC(6, 2) DEFAULT 0,
  frais_dossier_min_eur NUMERIC(6, 2) DEFAULT 0,
  frais_dossier_max_eur NUMERIC(6, 2) DEFAULT 0,
  notes TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fee_schedules_type ON yatra.vacances_fee_schedules(type_transport) WHERE active = true;

-- ============================================================================
-- 2. TRANSFERTS AÉROPORT (référence — coûts publics/taxi typiques)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_airport_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_aeroport TEXT NOT NULL UNIQUE,
  nom_aeroport TEXT NOT NULL,
  ville TEXT NOT NULL,
  transfert_public_eur NUMERIC(6, 2),
  transfert_public_label TEXT,
  transfert_public_duree_min INT,
  transfert_taxi_min_eur NUMERIC(6, 2),
  transfert_taxi_max_eur NUMERIC(6, 2),
  transfert_taxi_duree_min INT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. HISTORIQUE DES CALCULS "VRAI PRIX TOTAL" (audit + réutilisable §2 budget inversé)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.vacances_true_price_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  transporteur TEXT,
  prix_affiche_eur NUMERIC(8, 2) NOT NULL,
  options JSONB NOT NULL DEFAULT '{}',
  transfert_aeroport_code TEXT,
  breakdown JSONB NOT NULL DEFAULT '[]',
  total_min_eur NUMERIC(8, 2) NOT NULL,
  total_max_eur NUMERIC(8, 2) NOT NULL,
  badge_prix_verifie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_true_price_user ON yatra.vacances_true_price_calculations(user_id, created_at DESC);

-- ============================================================================
-- 4. RLS
-- ============================================================================
ALTER TABLE yatra.vacances_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_airport_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vacances_true_price_calculations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_fee_schedules' AND policyname='fee_schedules_read_all') THEN
    CREATE POLICY fee_schedules_read_all ON yatra.vacances_fee_schedules FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_airport_transfers' AND policyname='airport_transfers_read_all') THEN
    CREATE POLICY airport_transfers_read_all ON yatra.vacances_airport_transfers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vacances_true_price_calculations' AND policyname='true_price_self_all') THEN
    CREATE POLICY true_price_self_all ON yatra.vacances_true_price_calculations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT ON yatra.vacances_fee_schedules TO authenticated, service_role;
GRANT SELECT ON yatra.vacances_airport_transfers TO authenticated, service_role;
GRANT ALL ON yatra.vacances_true_price_calculations TO authenticated, service_role;

-- ============================================================================
-- 5. SEED — grilles indicatives transporteurs low-cost (à revérifier périodiquement,
--    routes/saisons font varier ces frais : RANGES volontairement larges).
-- ============================================================================
INSERT INTO yatra.vacances_fee_schedules
  (transporteur, type_transport, bagage_cabine_min_eur, bagage_cabine_max_eur, bagage_soute_min_eur, bagage_soute_max_eur, siege_min_eur, siege_max_eur, frais_dossier_min_eur, frais_dossier_max_eur, notes)
VALUES
  ('Ryanair', 'avion', 6, 20, 20, 45, 4, 20, 0, 2, 'Bagage cabine 40x20x25 inclus gratuit ; bagage 10kg soute payant dès réservation'),
  ('easyJet', 'avion', 7, 30, 15, 45, 4, 30, 0, 0, 'Petit sac sous siège gratuit ; cabine large et soute payantes'),
  ('Vueling', 'avion', 5, 25, 25, 40, 5, 20, 0, 0, NULL),
  ('Transavia', 'avion', 6, 25, 25, 40, 6, 25, 0, 0, NULL),
  ('Wizz Air', 'avion', 10, 30, 20, 45, 5, 25, 0, 3, NULL),
  ('Volotea', 'avion', 5, 20, 20, 35, 5, 20, 0, 0, NULL),
  ('SNCF Connect (OUIGO)', 'train', 0, 0, 5, 10, 0, 5, 0, 0, 'Franchise 2 bagages + 1 sac ; au-delà payant'),
  ('SNCF Connect (TGV INOUI)', 'train', 0, 0, 0, 0, 0, 0, 0, 0, 'Bagages inclus, pas de frais annexes standards'),
  ('Flixbus', 'bus', 0, 0, 4, 15, 0, 0, 0, 0, 'Franchise 1 bagage cabine + 1 bagage soute selon trajet'),
  ('BlaBlaCar Bus', 'bus', 0, 0, 4, 15, 0, 0, 0, 0, NULL)
ON CONFLICT (transporteur) DO NOTHING;

INSERT INTO yatra.vacances_airport_transfers
  (code_aeroport, nom_aeroport, ville, transfert_public_eur, transfert_public_label, transfert_public_duree_min, transfert_taxi_min_eur, transfert_taxi_max_eur, transfert_taxi_duree_min)
VALUES
  ('CDG', 'Paris Charles de Gaulle', 'Paris', 11.80, 'RER B', 50, 55, 75, 45),
  ('ORY', 'Paris Orly', 'Paris', 13.35, 'Orlyval + RER B', 40, 40, 60, 35),
  ('LYS', 'Lyon Saint-Exupéry', 'Lyon', 16.90, 'Rhônexpress', 30, 45, 60, 30),
  ('MRS', 'Marseille Provence', 'Marseille', 9.20, 'Navette + bus', 40, 45, 60, 30),
  ('NCE', 'Nice Côte d''Azur', 'Nice', 1.70, 'Tram + bus', 30, 25, 40, 20),
  ('TLS', 'Toulouse Blagnac', 'Toulouse', 8.00, 'Navette Tisséo', 25, 25, 35, 20),
  ('BOD', 'Bordeaux Mérignac', 'Bordeaux', 8.20, 'Navette Bordeaux', 40, 35, 50, 25),
  ('BVA', 'Beauvais-Tillé', 'Paris', 17.00, 'Navette Beauvais', 75, 90, 120, 70)
ON CONFLICT (code_aeroport) DO NOTHING;
