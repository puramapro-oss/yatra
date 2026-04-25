-- ════════════════════════════════════════════════════════════════════
-- YATRA — schéma complet (P1 → P13 anticipé)
-- Schéma : yatra
-- Compte unifié auth.users (Supabase) — auto-create profil sur signup.
-- ════════════════════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS yatra;
SET search_path = yatra, public;

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────
-- 1. PROFILES (base utilisateur YATRA)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin', 'ambassadeur')),
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium_monthly', 'premium_annual', 'lifetime')),
  billing_period TEXT CHECK (billing_period IN ('monthly', 'annual', 'lifetime')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'cancelled', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  treezor_user_id TEXT,
  treezor_wallet_id TEXT,
  kyc_status TEXT DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'validated', 'rejected')),
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES yatra.profiles(id) ON DELETE SET NULL,

  -- YATRA-spécifique
  ville_principale TEXT,
  pays_principal TEXT DEFAULT 'FR',
  langue_preferee TEXT DEFAULT 'fr',
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'oled', 'light')),
  ambiance_preferee TEXT DEFAULT 'foret' CHECK (ambiance_preferee IN ('foret', 'pluie', 'ocean', 'feu', 'temple_futuriste', 'silence_sacre')),
  rang TEXT DEFAULT 'explorateur' CHECK (rang IN ('explorateur', 'gardien', 'regenerateur', 'legende')),
  score_humanite NUMERIC(4, 2) DEFAULT 0 CHECK (score_humanite >= 0 AND score_humanite <= 10),
  awakening_level INT DEFAULT 1,
  affirmations_seen INT DEFAULT 0,
  anciennete_months INT DEFAULT 0,
  xp INT DEFAULT 0,
  level INT DEFAULT 1,
  streak_days INT DEFAULT 0,
  tutorial_completed BOOLEAN DEFAULT false,
  intro_seen BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,

  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON yatra.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON yatra.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON yatra.profiles(referred_by);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON yatra.profiles(stripe_customer_id);

-- ─────────────────────────────────────────────────────────────────────
-- 2. CHAT / Aria conversations
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  title TEXT,
  mode TEXT DEFAULT 'trajet',
  is_pinned BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  message_count INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON yatra.conversations(user_id);

CREATE TABLE IF NOT EXISTS yatra.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES yatra.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tokens_used INT DEFAULT 0,
  feedback INT CHECK (feedback IN (-1, 0, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON yatra.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON yatra.messages(user_id);

-- ─────────────────────────────────────────────────────────────────────
-- 3. PAIEMENTS / FACTURES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  stripe_payment_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  amount_after_discount NUMERIC(10, 2),
  discount_applied NUMERIC(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'eur',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  plan TEXT,
  billing_period TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON yatra.payments(user_id);

CREATE TABLE IF NOT EXISTS yatra.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount_ht NUMERIC(10, 2) NOT NULL,
  tva_rate NUMERIC(5, 2) DEFAULT 0,
  tva_amount NUMERIC(10, 2) DEFAULT 0,
  amount_ttc NUMERIC(10, 2) NOT NULL,
  plan TEXT,
  billing_period TEXT,
  pdf_url TEXT,
  client_name TEXT,
  client_email TEXT,
  client_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user ON yatra.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON yatra.invoices(invoice_number);

-- ─────────────────────────────────────────────────────────────────────
-- 4. PARRAINAGE
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'user' CHECK (type IN ('user', 'ambassadeur', 'influencer')),
  total_uses INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  validity_days INT DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  referral_code_id UUID REFERENCES yatra.referral_codes(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  first_payment_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON yatra.referrals(referrer_id);

CREATE TABLE IF NOT EXISTS yatra.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID REFERENCES yatra.referrals(id) ON DELETE CASCADE,
  beneficiary_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('first_payment_50pct', 'recurring_10pct', 'milestone_bonus_30pct', 'contest_reward', 'lottery_reward', 'redistribution', 'ambassadeur_lifetime', 'ambassadeur_n2_15pct')),
  amount NUMERIC(10, 2) NOT NULL,
  source_payment_amount NUMERIC(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'failed')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_beneficiary ON yatra.commissions(beneficiary_id);

-- ─────────────────────────────────────────────────────────────────────
-- 5. WALLET (Vida Credits + €)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  balance NUMERIC(10, 2) DEFAULT 0,
  pending_balance NUMERIC(10, 2) DEFAULT 0,
  vida_credits NUMERIC(10, 2) DEFAULT 0,
  vida_credits_pending NUMERIC(10, 2) DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0,
  total_withdrawn NUMERIC(10, 2) DEFAULT 0,
  total_from_referrals NUMERIC(10, 2) DEFAULT 0,
  total_from_contests NUMERIC(10, 2) DEFAULT 0,
  total_from_lottery NUMERIC(10, 2) DEFAULT 0,
  total_from_trajets NUMERIC(10, 2) DEFAULT 0,
  total_from_redistribution NUMERIC(10, 2) DEFAULT 0,
  bank_holder_name TEXT,
  bank_iban_last4 TEXT,
  bank_bic TEXT,
  bank_details_filled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES yatra.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'withdrawal', 'refund')),
  amount NUMERIC(10, 2) NOT NULL,
  balance_after NUMERIC(10, 2),
  source TEXT NOT NULL,
  source_id UUID,
  description TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON yatra.wallet_transactions(user_id);

CREATE TABLE IF NOT EXISTS yatra.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES yatra.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 5),
  method TEXT DEFAULT 'treezor' CHECK (method IN ('stripe', 'treezor', 'bank_transfer')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'pending_admin')),
  treezor_payout_id TEXT,
  stripe_payout_id TEXT,
  bank_iban_last4 TEXT,
  bank_holder_name TEXT,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────
-- 6. CONCOURS / TIRAGES
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.contests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly', 'yearly')),
  period_label TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_revenue NUMERIC(10, 2) DEFAULT 0,
  prize_pool_amount NUMERIC(10, 2) DEFAULT 0,
  total_submissions INT DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'judging', 'completed')),
  rankings JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.contest_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_id UUID NOT NULL REFERENCES yatra.contests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_data JSONB DEFAULT '{}',
  ai_score NUMERIC(5, 2),
  ai_scores_detail JSONB,
  ai_feedback TEXT,
  rank INT,
  prize_amount NUMERIC(10, 2),
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(contest_id, user_id)
);

CREATE TABLE IF NOT EXISTS yatra.lottery_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('weekly', 'monthly')),
  period_label TEXT NOT NULL,
  total_participants INT DEFAULT 0,
  total_tickets INT DEFAULT 0,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'drawing', 'completed')),
  draw_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.lottery_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  draw_id UUID REFERENCES yatra.lottery_draws(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('subscription_current', 'trajet_propre', 'mission', 'partage', 'note', 'challenge', 'streak', 'parrainage', 'inscription', 'subscription_other_app', 'achat_points')),
  source_app TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lottery_tickets_user ON yatra.lottery_tickets(user_id);

CREATE TABLE IF NOT EXISTS yatra.lottery_prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES yatra.lottery_draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  rank INT NOT NULL,
  amount_won NUMERIC(10, 2),
  prize_type TEXT NOT NULL,
  prize_label TEXT NOT NULL,
  promo_code TEXT UNIQUE,
  promo_used BOOLEAN DEFAULT false,
  notified BOOLEAN DEFAULT false,
  seen_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 7. AMBASSADEURS / INFLUENCEURS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.ambassadeur_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  platform TEXT,
  channel_url TEXT,
  followers_count INT DEFAULT 0,
  custom_link_slug TEXT UNIQUE,
  stripe_connect_id TEXT,
  payout_method TEXT DEFAULT 'treezor',
  application_status TEXT DEFAULT 'approved' CHECK (application_status IN ('pending', 'approved', 'rejected')),
  is_active BOOLEAN DEFAULT true,
  total_clicks INT DEFAULT 0,
  total_signups INT DEFAULT 0,
  total_conversions INT DEFAULT 0,
  total_earned NUMERIC(10, 2) DEFAULT 0,
  niveau INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.ambassadeur_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassadeur_id UUID NOT NULL REFERENCES yatra.ambassadeur_profiles(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  referrer_url TEXT,
  country TEXT,
  device_type TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.ambassadeur_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassadeur_id UUID NOT NULL REFERENCES yatra.ambassadeur_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  click_id UUID REFERENCES yatra.ambassadeur_clicks(id),
  conversion_type TEXT,
  subscription_plan TEXT,
  subscription_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 8. GAMIFICATION
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT CHECK (category IN ('beginner', 'mobility', 'social', 'streak', 'awakening', 'special')),
  xp_reward INT DEFAULT 0,
  is_secret BOOLEAN DEFAULT false,
  condition_type TEXT,
  condition_value INT
);

CREATE TABLE IF NOT EXISTS yatra.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES yatra.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ─────────────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'info', 'warning', 'error', 'achievement', 'referral', 'payment', 'contest', 'lottery', 'system', 'aria')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON yatra.notifications(user_id, is_read);

-- ─────────────────────────────────────────────────────────────────────
-- 10. SUPPORT
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  ticket_number TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  category TEXT CHECK (category IN ('bug', 'question', 'feature_request', 'billing', 'account', 'other')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_user', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES yatra.support_tickets(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'aria')),
  sender_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 11. VIDA CORE (P2 — hub identité partagé écosystème)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.vida_core_profile (
  user_id UUID PRIMARY KEY REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  univers_personnel JSONB DEFAULT '{}',
  fil_de_vie_visibility TEXT DEFAULT 'private' CHECK (fil_de_vie_visibility IN ('private', 'amis', 'public')),
  score_humanite NUMERIC(4, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.fil_de_vie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  app_slug TEXT DEFAULT 'yatra',
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  irreversible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fil_de_vie_user ON yatra.fil_de_vie(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS yatra.adn_mobilite (
  user_id UUID PRIMARY KEY REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  style TEXT DEFAULT 'explorateur' CHECK (style IN ('explorateur', 'gardien', 'regenerateur', 'legende')),
  rythme_appris JSONB DEFAULT '{}',
  prefs_sensorielles JSONB DEFAULT '{}',
  modes_preferes TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.score_humanite_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES yatra.profiles(id) ON DELETE CASCADE,
  score NUMERIC(4, 2) NOT NULL,
  breakdown JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 12. AIDES (P5 — radar aides & droits)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.aides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type_aide TEXT,
  profil_eligible TEXT[] DEFAULT '{}',
  situation_eligible TEXT[] DEFAULT '{}',
  montant_max NUMERIC(10, 2),
  url_officielle TEXT,
  description TEXT,
  region TEXT,
  departement TEXT,
  code_postal_pattern TEXT,
  handicap_only BOOLEAN DEFAULT false,
  age_min INT,
  age_max INT,
  conditions_revenu JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aides_active ON yatra.aides(active) WHERE active = true;

-- ─────────────────────────────────────────────────────────────────────
-- 13. AI CACHE (cache intelligent Claude)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_hash TEXT UNIQUE NOT NULL,
  question_text TEXT NOT NULL,
  response_text TEXT NOT NULL,
  model TEXT,
  tokens_used INT,
  hit_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────
-- 14. CONFIG / ANALYTICS / LOGS
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS yatra.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS yatra.analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES yatra.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_category TEXT,
  page_url TEXT,
  referrer TEXT,
  device_type TEXT,
  country TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON yatra.analytics(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS yatra.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES yatra.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────
-- 15. TRIGGERS — auto-update timestamps + auto-create profile/wallet/referral_code
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION yatra.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_updated_at') THEN
    CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON yatra.profiles FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'conversations_updated_at') THEN
    CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON yatra.conversations FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'wallets_updated_at') THEN
    CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON yatra.wallets FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
  END IF;
END $$;

-- Génère un referral_code unique court (8 chars)
CREATE OR REPLACE FUNCTION yatra.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile + wallet + referral_code on auth.users insert
CREATE OR REPLACE FUNCTION yatra.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  attempts INT := 0;
BEGIN
  -- Génère un code unique
  LOOP
    new_code := yatra.generate_referral_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM yatra.profiles WHERE referral_code = new_code) OR attempts > 10;
    attempts := attempts + 1;
  END LOOP;

  INSERT INTO yatra.profiles (id, email, full_name, avatar_url, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    new_code
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO yatra.wallets (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO yatra.referral_codes (user_id, code) VALUES (NEW.id, new_code) ON CONFLICT (code) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created_yatra') THEN
    CREATE TRIGGER on_auth_user_created_yatra
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION yatra.handle_new_auth_user();
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 16. RLS — toutes tables
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE yatra.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.contest_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.lottery_draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.lottery_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.lottery_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ambassadeur_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.vida_core_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.fil_de_vie ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.adn_mobilite ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.score_humanite_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.aides ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.app_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.admin_logs ENABLE ROW LEVEL SECURITY;

-- Helper : DO block + IF NOT EXISTS check (PostgreSQL ne supporte pas CREATE POLICY IF NOT EXISTS)
DO $$ BEGIN
  -- profiles : user voit/édite son propre profil
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='profiles' AND policyname='profiles_self_select') THEN
    CREATE POLICY profiles_self_select ON yatra.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='profiles' AND policyname='profiles_self_update') THEN
    CREATE POLICY profiles_self_update ON yatra.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;

  -- conversations / messages : user voit/édite ses propres
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='conversations' AND policyname='conv_self_all') THEN
    CREATE POLICY conv_self_all ON yatra.conversations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='messages' AND policyname='msg_self_all') THEN
    CREATE POLICY msg_self_all ON yatra.messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- payments / invoices : user select uniquement
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='payments' AND policyname='pay_self_select') THEN
    CREATE POLICY pay_self_select ON yatra.payments FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='invoices' AND policyname='inv_self_select') THEN
    CREATE POLICY inv_self_select ON yatra.invoices FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- wallet : user select propre
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='wallets' AND policyname='wallet_self_select') THEN
    CREATE POLICY wallet_self_select ON yatra.wallets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='wallet_transactions' AND policyname='wt_self_select') THEN
    CREATE POLICY wt_self_select ON yatra.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='withdrawals' AND policyname='wd_self_all') THEN
    CREATE POLICY wd_self_all ON yatra.withdrawals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- referrals/commissions : user voit ce qui le concerne
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='referral_codes' AND policyname='rc_self_all') THEN
    CREATE POLICY rc_self_all ON yatra.referral_codes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='referrals' AND policyname='ref_self_select') THEN
    CREATE POLICY ref_self_select ON yatra.referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='commissions' AND policyname='com_self_select') THEN
    CREATE POLICY com_self_select ON yatra.commissions FOR SELECT USING (auth.uid() = beneficiary_id);
  END IF;

  -- contests / lottery : public read pour leaderboards
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='contests' AND policyname='contests_public_select') THEN
    CREATE POLICY contests_public_select ON yatra.contests FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='contest_entries' AND policyname='ce_self_all') THEN
    CREATE POLICY ce_self_all ON yatra.contest_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='lottery_draws' AND policyname='ld_public_select') THEN
    CREATE POLICY ld_public_select ON yatra.lottery_draws FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='lottery_tickets' AND policyname='lt_self_select') THEN
    CREATE POLICY lt_self_select ON yatra.lottery_tickets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='lottery_prizes' AND policyname='lp_self_select') THEN
    CREATE POLICY lp_self_select ON yatra.lottery_prizes FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- ambassadeur
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='ambassadeur_profiles' AND policyname='amb_self_all') THEN
    CREATE POLICY amb_self_all ON yatra.ambassadeur_profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='ambassadeur_clicks' AND policyname='ac_owner_select') THEN
    CREATE POLICY ac_owner_select ON yatra.ambassadeur_clicks FOR SELECT USING (
      EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles ap WHERE ap.id = ambassadeur_id AND ap.user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='ambassadeur_conversions' AND policyname='aco_owner_select') THEN
    CREATE POLICY aco_owner_select ON yatra.ambassadeur_conversions FOR SELECT USING (
      EXISTS (SELECT 1 FROM yatra.ambassadeur_profiles ap WHERE ap.id = ambassadeur_id AND ap.user_id = auth.uid())
    );
  END IF;

  -- achievements (public read) + user_achievements (self)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='achievements' AND policyname='ach_public_select') THEN
    CREATE POLICY ach_public_select ON yatra.achievements FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='user_achievements' AND policyname='ua_self_all') THEN
    CREATE POLICY ua_self_all ON yatra.user_achievements FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='notifications' AND policyname='notif_self_all') THEN
    CREATE POLICY notif_self_all ON yatra.notifications FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  -- support tickets
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='support_tickets' AND policyname='st_self_all') THEN
    CREATE POLICY st_self_all ON yatra.support_tickets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='support_messages' AND policyname='sm_self_select') THEN
    CREATE POLICY sm_self_select ON yatra.support_messages FOR SELECT USING (
      EXISTS (SELECT 1 FROM yatra.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
    );
  END IF;

  -- VIDA CORE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='vida_core_profile' AND policyname='vcp_self_all') THEN
    CREATE POLICY vcp_self_all ON yatra.vida_core_profile FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='fil_de_vie' AND policyname='fdv_self_select') THEN
    CREATE POLICY fdv_self_select ON yatra.fil_de_vie FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='fil_de_vie' AND policyname='fdv_self_insert') THEN
    CREATE POLICY fdv_self_insert ON yatra.fil_de_vie FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='adn_mobilite' AND policyname='adn_self_all') THEN
    CREATE POLICY adn_self_all ON yatra.adn_mobilite FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='score_humanite_history' AND policyname='shh_self_select') THEN
    CREATE POLICY shh_self_select ON yatra.score_humanite_history FOR SELECT USING (auth.uid() = user_id);
  END IF;

  -- Aides : public read (lookup), service_role insert
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='aides' AND policyname='aides_public_select') THEN
    CREATE POLICY aides_public_select ON yatra.aides FOR SELECT USING (active = true);
  END IF;

  -- ai_cache : service_role only (no public access)
  -- app_config : public select pour clés non sensibles via filter
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='app_config' AND policyname='cfg_public_safe') THEN
    CREATE POLICY cfg_public_safe ON yatra.app_config FOR SELECT USING (key NOT LIKE 'secret_%');
  END IF;

  -- analytics : service_role insert via API ; users : aucune lecture publique
  -- admin_logs : super_admin only
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='admin_logs' AND policyname='al_super_admin_select') THEN
    CREATE POLICY al_super_admin_select ON yatra.admin_logs FOR SELECT USING (
      EXISTS (SELECT 1 FROM yatra.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin')
    );
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 17. SEED — super admin + achievements de base
-- ─────────────────────────────────────────────────────────────────────
INSERT INTO yatra.achievements (slug, name, description, icon, category, xp_reward) VALUES
  ('first_step', 'Premier pas', 'Tu as créé ton compte YATRA', '🌿', 'beginner', 50),
  ('onboarding_done', 'Voyageur prêt', 'Tu as terminé ton onboarding 30s', '🎯', 'beginner', 100),
  ('first_clean_trip', 'Premier trajet propre', 'Ton premier trajet validé sans CO₂ inutile', '🚲', 'mobility', 150),
  ('first_credit', 'Premier crédit', 'Ton premier euro Vida Credit gagné', '💰', 'mobility', 100),
  ('streak_7', 'Inarrêtable', '7 jours consécutifs actifs', '🔥', 'streak', 250),
  ('streak_30', 'Légende du quotidien', '30 jours consécutifs actifs', '✨', 'streak', 1000),
  ('first_referral', 'Inviter le mouvement', 'Premier filleul actif', '🤝', 'social', 200),
  ('first_withdrawal', 'L''argent en mouvement', 'Premier retrait wallet réussi', '💸', 'special', 200),
  ('contest_top10', 'Top 10 concours', 'Tu as fini dans le top 10', '🏆', 'special', 500),
  ('lottery_winner', 'Chanceux du tirage', 'Tu as gagné au tirage', '🎰', 'special', 300),
  ('rang_gardien', 'Devenu Gardien', 'Tu as atteint le rang Gardien', '🛡️', 'awakening', 400),
  ('rang_regenerateur', 'Devenu Régénérateur', 'Tu as atteint le rang Régénérateur', '🌱', 'awakening', 800),
  ('rang_legende', 'Devenu Légende', 'Tu as atteint le rang Légende', '⭐', 'awakening', 2000),
  ('voyage_humanitaire', 'Cœur en mouvement', 'Première mission humanitaire validée', '❤️', 'awakening', 600),
  ('aide_recue', 'Droits activés', 'Première aide auto-détectée et obtenue', '📜', 'special', 400)
ON CONFLICT (slug) DO NOTHING;

-- Super admin (création compte si auth.users existe déjà — sinon profile created on first login)
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  SELECT id INTO admin_uid FROM auth.users WHERE email = 'matiss.frasne@gmail.com' LIMIT 1;
  IF admin_uid IS NOT NULL THEN
    INSERT INTO yatra.profiles (id, email, full_name, role, plan, subscription_status, onboarding_completed, intro_seen, tutorial_completed)
    VALUES (admin_uid, 'matiss.frasne@gmail.com', 'Tissma', 'super_admin', 'lifetime', 'active', true, true, true)
    ON CONFLICT (id) DO UPDATE SET role = 'super_admin', plan = 'lifetime', subscription_status = 'active';
    INSERT INTO yatra.wallets (user_id) VALUES (admin_uid) ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- DONE
-- ─────────────────────────────────────────────────────────────────────
