-- YATRA — Migration P9
-- Aria Conscience : agent IA + 7 modes spéciaux. Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. aria_conversations
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aria_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL, -- 'coach_trajet' | 'meditation' | 'journal' | 'cri_du_coeur' | 'boussole' | 'gratitude' | 'question_profonde'
  title TEXT,
  sentiment TEXT, -- 'apaise' | 'energise' | 'inspire' | 'doute' | 'libere' | 'neutre'
  summary TEXT,
  message_count INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aria_conv_user ON yatra.aria_conversations(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_aria_conv_mode ON yatra.aria_conversations(mode, started_at DESC);

-- ============================================================================
-- 2. aria_messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aria_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES yatra.aria_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_msg_conv ON yatra.aria_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_aria_msg_user ON yatra.aria_messages(user_id, created_at DESC);

-- ============================================================================
-- 3. aria_daily_questions — 30 questions FR seedées (rotation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aria_daily_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL, -- 'gratitude' | 'intuition' | 'verite' | 'lien' | 'transformation' | 'presence'
  display_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aria_dq_active ON yatra.aria_daily_questions(display_order) WHERE active = true;

-- ============================================================================
-- 4. aria_user_state — 1 ligne par user (état émotionnel + question last seen)
-- ============================================================================
CREATE TABLE IF NOT EXISTS yatra.aria_user_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_mood TEXT, -- 'rayonne' | 'tendu' | 'fatigue' | 'curieux' | 'calme' | 'agite'
  current_intention TEXT, -- texte libre user
  last_seen_question_id UUID REFERENCES yatra.aria_daily_questions(id) ON DELETE SET NULL,
  last_seen_question_at TIMESTAMPTZ,
  daily_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  total_conversations INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. RLS
-- ============================================================================
ALTER TABLE yatra.aria_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.aria_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.aria_daily_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE yatra.aria_user_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS aria_conv_self_read ON yatra.aria_conversations;
CREATE POLICY aria_conv_self_read ON yatra.aria_conversations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_conv_self_insert ON yatra.aria_conversations;
CREATE POLICY aria_conv_self_insert ON yatra.aria_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_conv_self_update ON yatra.aria_conversations;
CREATE POLICY aria_conv_self_update ON yatra.aria_conversations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_msg_self_read ON yatra.aria_messages;
CREATE POLICY aria_msg_self_read ON yatra.aria_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_msg_self_insert ON yatra.aria_messages;
CREATE POLICY aria_msg_self_insert ON yatra.aria_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_dq_read ON yatra.aria_daily_questions;
CREATE POLICY aria_dq_read ON yatra.aria_daily_questions
  FOR SELECT TO authenticated USING (active = true);

DROP POLICY IF EXISTS aria_state_self_read ON yatra.aria_user_state;
CREATE POLICY aria_state_self_read ON yatra.aria_user_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_state_self_write ON yatra.aria_user_state;
CREATE POLICY aria_state_self_write ON yatra.aria_user_state
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS aria_state_self_update ON yatra.aria_user_state;
CREATE POLICY aria_state_self_update ON yatra.aria_user_state
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 6. Seed 30 questions FR
-- ============================================================================
INSERT INTO yatra.aria_daily_questions (slug, text, category, display_order) VALUES
  ('q01-touche-aujourdhui', 'Qu''est-ce qui t''a vraiment touché aujourd''hui — pas seulement plu, mais touché ?', 'presence', 1),
  ('q02-ce-que-je-porte', 'Qu''est-ce que tu portes en ce moment qui n''est pas à toi ?', 'verite', 2),
  ('q03-respiration', 'Si tu écoutes ta respiration là maintenant, qu''est-ce qu''elle dit de ton état ?', 'presence', 3),
  ('q04-derriere-fatigue', 'Quand tu te sens fatigué, qu''est-ce qui se cache vraiment derrière ?', 'verite', 4),
  ('q05-ce-quil-faut-lacher', 'Quelle pensée tournait en boucle hier que tu peux laisser partir aujourd''hui ?', 'transformation', 5),
  ('q06-corps-message', 'Si ton corps avait un message à te transmettre maintenant, ce serait lequel ?', 'intuition', 6),
  ('q07-rencontre-marquante', 'Qui as-tu croisé récemment qui t''a laissé une trace, même brève ?', 'lien', 7),
  ('q08-merci-silencieux', 'À qui dirais-tu merci silencieusement, là, si tu pouvais ?', 'gratitude', 8),
  ('q09-pas-encore-ose', 'Qu''est-ce que tu n''as pas encore osé te dire à toi-même ?', 'verite', 9),
  ('q10-instant-fragile', 'Quel instant fragile dans ta semaine mérite d''être tenu doucement ?', 'presence', 10),
  ('q11-direction-coeur', 'Quand tu écoutes ton cœur — pas ta tête — quelle direction se dessine ?', 'intuition', 11),
  ('q12-ce-que-je-fuis', 'Qu''est-ce que tu évites en ce moment, et qu''est-ce que ça protège vraiment ?', 'verite', 12),
  ('q13-trois-merci', 'Cite trois mercis non dits que tu pourrais murmurer ce soir.', 'gratitude', 13),
  ('q14-personne-comprise', 'À quelle personne te sens-tu profondément comprise ou compris ?', 'lien', 14),
  ('q15-changer-une-chose', 'Si tu pouvais changer une seule chose dans ta journée, ce serait laquelle, et pourquoi ?', 'transformation', 15),
  ('q16-silence-confortable', 'Avec qui le silence est-il confortable plutôt qu''embarrassant ?', 'lien', 16),
  ('q17-instinct-ignore', 'Quel instinct as-tu ignoré récemment et que ferais-tu différemment maintenant ?', 'intuition', 17),
  ('q18-bonté-recue', 'Quelle petite bonté reçue récemment continue de te porter ?', 'gratitude', 18),
  ('q19-pas-prochain', 'Quel petit pas, vraiment petit, ferais-tu demain s''il n''y avait aucun jugement ?', 'transformation', 19),
  ('q20-corps-dit-non', 'Quand est-ce que ton corps dit non même quand ta bouche dit oui ?', 'verite', 20),
  ('q21-paix-trouvee', 'Où ressens-tu une paix simple aujourd''hui — un coin, une activité, une personne ?', 'presence', 21),
  ('q22-question-attente', 'Quelle question attend que tu la poses depuis trop longtemps ?', 'verite', 22),
  ('q23-rythme-juste', 'Ton rythme cette semaine — trop rapide, trop lent, ou juste ?', 'presence', 23),
  ('q24-personne-soutien', 'Vers qui peux-tu te tourner quand tu n''as pas envie de faire semblant ?', 'lien', 24),
  ('q25-mots-vrais', 'Quels mots aimerais-tu entendre, sans les attendre de personne en particulier ?', 'verite', 25),
  ('q26-emerveillement', 'Quand t''es-tu émerveillé pour la dernière fois, même 3 secondes ?', 'presence', 26),
  ('q27-vieille-blessure', 'Quelle vieille blessure mérite une nouvelle écoute aujourd''hui ?', 'transformation', 27),
  ('q28-territoire-libre', 'Où te sens-tu pleinement libre d''être toi — pas performant, juste là ?', 'lien', 28),
  ('q29-petit-non', 'Quel petit "non" courageux pourrais-tu poser cette semaine ?', 'transformation', 29),
  ('q30-cadeau-cache', 'Quel cadeau caché contient une difficulté actuelle que tu n''as pas encore vu ?', 'transformation', 30)
ON CONFLICT (slug) DO UPDATE SET
  text = EXCLUDED.text,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order;

-- ============================================================================
-- 7. Trigger updated_at
-- ============================================================================
DROP TRIGGER IF EXISTS trg_aria_user_state_updated ON yatra.aria_user_state;
CREATE TRIGGER trg_aria_user_state_updated BEFORE UPDATE ON yatra.aria_user_state
  FOR EACH ROW EXECUTE FUNCTION yatra.set_updated_at();
