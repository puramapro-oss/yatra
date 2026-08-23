-- P31 — Socle légal partagé NIYAMA (packages/legal/sql/001_legal_core.sql, schéma yatra).
-- NON EXÉCUTÉE lors de l'intégration du socle (2026-08-23) : SSH VPS (port 22) inaccessible
-- depuis ce sandbox (HTTPS 443 OK, "Connection refused" sur 22 — piège réseau connu,
-- PIEGES.md §16 entrée mukti 2026-08-23). Prête à l'emploi dès qu'une session avec accès
-- VPS est disponible :
--
--   sshpass -p '<VPS_SSH_PASSWORD>' ssh root@72.62.191.111 \
--     "docker exec -i supabase-db psql -U supabase_admin -d postgres -f /dev/stdin" \
--     < supabase/migrations/p31_legal_niyama.sql
--
-- -U supabase_admin (pas postgres) : le rôle postgres n'est pas superuser sur ce VPS et
-- n'a pas CREATE sur le schéma yatra (PIEGES.md §16, entrées sarva/rishi 2026-08-23).
-- Puis régénérer les types : supabase gen types typescript --project-id ... > src/types/database.ts

CREATE TABLE IF NOT EXISTS yatra.legal_acceptances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('mentions', 'cgu', 'cgv', 'confidentialite')),
  version TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip INET,
  user_agent TEXT,
  UNIQUE (user_id, doc_type)
);

CREATE INDEX IF NOT EXISTS legal_acceptances_user_id_idx ON yatra.legal_acceptances (user_id);

ALTER TABLE yatra.legal_acceptances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY legal_acceptances_select_own ON yatra.legal_acceptances
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_acceptances_insert_own ON yatra.legal_acceptances
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY legal_acceptances_update_own ON yatra.legal_acceptances
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS yatra.cookie_consents (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  necessaire BOOLEAN NOT NULL DEFAULT true,
  mesure BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE yatra.cookie_consents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY cookie_consents_select_own ON yatra.cookie_consents
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY cookie_consents_insert_own ON yatra.cookie_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY cookie_consents_update_own ON yatra.cookie_consents
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS yatra.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_for TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'executing', 'completed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS account_deletion_requests_due_idx
  ON yatra.account_deletion_requests (status, scheduled_for);

ALTER TABLE yatra.account_deletion_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_select_own ON yatra.account_deletion_requests
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_insert_own ON yatra.account_deletion_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY account_deletion_requests_update_own ON yatra.account_deletion_requests
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Grants explicites (convention yatra, cf p4_wallet.sql) : les 3 tables n'héritent pas
-- forcément des ALTER DEFAULT PRIVILEGES posés en P0/P1 (PIEGES.md §16 entrée arogya).
GRANT ALL ON yatra.legal_acceptances TO postgres, authenticated, service_role;
GRANT ALL ON yatra.cookie_consents TO postgres, authenticated, service_role;
GRANT ALL ON yatra.account_deletion_requests TO postgres, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
