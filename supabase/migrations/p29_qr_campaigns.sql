-- P22bis — QR codes & pub transports (§9 V3)
-- Générateur QR trackés par lieu/partenaire (bus, trains, taxis, gares, aéroports)
-- scan → landing → attribution (lieu, campagne, partenaire) → signup attribués

SET search_path = yatra, public;

-- Table des campagnes QR (une campagne = un partenaire physique avec son QR unique)
CREATE TABLE IF NOT EXISTS yatra.qr_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name TEXT NOT NULL,
  location_name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('bus', 'train', 'taxi', 'gare', 'aeroport', 'autre')),
  city TEXT NOT NULL,
  campaign_slug TEXT NOT NULL UNIQUE, -- slug unique pour URL /scan/{slug}
  commission_pct NUMERIC(5,2) DEFAULT NULL CHECK (commission_pct >= 0 AND commission_pct <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE yatra.qr_campaigns IS 'Campagnes QR codes pour pub physique transports/lieux';
COMMENT ON COLUMN yatra.qr_campaigns.campaign_slug IS 'Slug unique pour URL /scan/{slug}';
COMMENT ON COLUMN yatra.qr_campaigns.commission_pct IS 'Commission % sur abonnements attribués (nullable = pas de commission)';

CREATE INDEX IF NOT EXISTS idx_qr_campaigns_slug ON yatra.qr_campaigns(campaign_slug);
CREATE INDEX IF NOT EXISTS idx_qr_campaigns_active ON yatra.qr_campaigns(active) WHERE active = true;

-- Table des scans (événements d'attribution)
CREATE TABLE IF NOT EXISTS yatra.qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES yatra.qr_campaigns(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_hash TEXT NOT NULL, -- SHA-256 hash IP+UA (anti-spam, pattern cashback_clicks)
  converted_to_signup BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE yatra.qr_scans IS 'Événements de scan QR (attribution + conversions)';
COMMENT ON COLUMN yatra.qr_scans.ip_hash IS 'Hash SHA-256 de IP+UA pour anti-spam (pattern existant cashback)';
COMMENT ON COLUMN yatra.qr_scans.converted_to_signup IS 'true si l''utilisateur a complété son signup après scan';

CREATE INDEX IF NOT EXISTS idx_qr_scans_campaign ON yatra.qr_scans(campaign_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_user ON yatra.qr_scans(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_scans_converted ON yatra.qr_scans(campaign_id, converted_to_signup) WHERE converted_to_signup = true;
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON yatra.qr_scans(scanned_at DESC);

-- RLS : gestion admin only (super_admin via service_role), zéro accès direct utilisateur final
ALTER TABLE yatra.qr_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.qr_scans ENABLE ROW LEVEL SECURITY;

-- Service role bypass (admin API)
CREATE POLICY qr_campaigns_service_full ON yatra.qr_campaigns FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qr_scans_service_full ON yatra.qr_scans FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Lecture publique campagnes actives (pour affichage stats publiques futures si besoin)
-- DÉSACTIVÉ pour V1 — zéro lecture publique, admin only
-- CREATE POLICY qr_campaigns_read_active ON yatra.qr_campaigns FOR SELECT TO authenticated USING (active = true);
