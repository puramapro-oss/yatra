-- Fix RLS policies manquantes pour onboarding insert
SET search_path = yatra, public;

DROP POLICY IF EXISTS shh_self_insert ON yatra.score_humanite_history;
CREATE POLICY shh_self_insert ON yatra.score_humanite_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);
