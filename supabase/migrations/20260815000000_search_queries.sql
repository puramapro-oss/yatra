-- Migration: table search_queries pour routeur de recherche langage naturel (P14)
-- Stocke historique recherches utilisateur + types détectés (trajet/budget/radar/aides)

CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL CHECK (char_length(query_text) <= 500),
  detected_type TEXT CHECK (detected_type IN ('trajet', 'budget_inverse', 'radar_gratuit', 'aides', 'ambigu')),
  confidence NUMERIC(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  redirected_to TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_search_queries_user_created ON search_queries(user_id, created_at DESC);
CREATE INDEX idx_search_queries_type ON search_queries(detected_type) WHERE detected_type IS NOT NULL;

-- RLS: owner peut insérer + lire ses propres recherches
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY search_queries_owner_insert ON search_queries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY search_queries_owner_read ON search_queries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

COMMENT ON TABLE search_queries IS 'Historique recherches NLU utilisateur pour routeur intelligent YATRA (P14)';
