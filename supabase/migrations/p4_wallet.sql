-- YATRA — Migration P4
-- Wallet sub-PURAMA (event-sourcing via wallet_transactions) + retraits + IBAN
-- Fonctions atomiques RPC garantissant cohérence ledger ↔ balance.
-- Idempotent.

SET search_path = yatra, public;

-- ============================================================================
-- 1. CRÉDIT ATOMIQUE — INSERT wallet_transactions + UPDATE wallets
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.credit_wallet_v1(
  p_user_id UUID,
  p_amount NUMERIC,
  p_source TEXT,
  p_description TEXT DEFAULT NULL,
  p_source_id UUID DEFAULT NULL
) RETURNS TABLE(transaction_id UUID, new_balance NUMERIC, new_total_earned NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance_after NUMERIC;
  v_total_earned NUMERIC;
  v_tx_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Montant invalide: %', p_amount;
  END IF;

  -- Lock le wallet pour éviter race condition
  SELECT id, balance + p_amount, total_earned + p_amount
  INTO v_wallet_id, v_balance_after, v_total_earned
  FROM yatra.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet introuvable pour user %', p_user_id;
  END IF;

  -- Insert transaction (event)
  INSERT INTO yatra.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, source, source_id, description, status
  ) VALUES (
    v_wallet_id, p_user_id, 'credit', p_amount, v_balance_after, p_source, p_source_id, p_description, 'completed'
  ) RETURNING id INTO v_tx_id;

  -- Update aggregat (cache pour lecture rapide)
  UPDATE yatra.wallets
  SET
    balance = v_balance_after,
    total_earned = v_total_earned,
    total_from_trajets = total_from_trajets + CASE WHEN p_source = 'trip_clean' THEN p_amount ELSE 0 END,
    total_from_referrals = total_from_referrals + CASE WHEN p_source = 'referral' THEN p_amount ELSE 0 END,
    total_from_contests = total_from_contests + CASE WHEN p_source = 'contest' THEN p_amount ELSE 0 END,
    total_from_lottery = total_from_lottery + CASE WHEN p_source = 'lottery' THEN p_amount ELSE 0 END,
    total_from_redistribution = total_from_redistribution + CASE WHEN p_source = 'redistribution' THEN p_amount ELSE 0 END,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  RETURN QUERY SELECT v_tx_id, v_balance_after, v_total_earned;
END;
$$;

-- ============================================================================
-- 2. DEMANDE DE RETRAIT ATOMIQUE — vérifie solde + crée withdrawal + transaction
-- ============================================================================
CREATE OR REPLACE FUNCTION yatra.request_withdrawal_v1(
  p_user_id UUID,
  p_amount NUMERIC,
  p_iban_last4 TEXT,
  p_holder_name TEXT
) RETURNS TABLE(withdrawal_id UUID, new_balance NUMERIC, status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_balance NUMERIC;
  v_balance_after NUMERIC;
  v_wd_id UUID;
BEGIN
  IF p_amount IS NULL OR p_amount < 5 THEN
    RAISE EXCEPTION 'Montant minimum retrait: 5 €';
  END IF;
  IF p_holder_name IS NULL OR length(trim(p_holder_name)) < 2 THEN
    RAISE EXCEPTION 'Nom du titulaire requis';
  END IF;
  IF p_iban_last4 IS NULL OR length(p_iban_last4) <> 4 THEN
    RAISE EXCEPTION 'IBAN invalide (4 derniers caractères requis)';
  END IF;

  -- Lock wallet
  SELECT id, balance INTO v_wallet_id, v_balance
  FROM yatra.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'Wallet introuvable';
  END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Solde insuffisant : % € disponibles, % € demandés', v_balance, p_amount;
  END IF;

  v_balance_after := v_balance - p_amount;

  -- 1. Créer withdrawal
  INSERT INTO yatra.withdrawals (
    wallet_id, user_id, amount, method, status, bank_iban_last4, bank_holder_name
  ) VALUES (
    v_wallet_id, p_user_id, p_amount, 'bank_transfer', 'pending_admin', p_iban_last4, p_holder_name
  ) RETURNING id INTO v_wd_id;

  -- 2. Insert transaction (debit)
  INSERT INTO yatra.wallet_transactions (
    wallet_id, user_id, type, amount, balance_after, source, source_id, description, status
  ) VALUES (
    v_wallet_id, p_user_id, 'withdrawal', p_amount, v_balance_after,
    'withdrawal', v_wd_id, format('Retrait IBAN ****%s', p_iban_last4), 'pending'
  );

  -- 3. Update aggregat balance + bank_iban_last4
  UPDATE yatra.wallets
  SET
    balance = v_balance_after,
    total_withdrawn = total_withdrawn + p_amount,
    bank_iban_last4 = p_iban_last4,
    bank_holder_name = p_holder_name,
    bank_details_filled = TRUE,
    updated_at = NOW()
  WHERE id = v_wallet_id;

  RETURN QUERY SELECT v_wd_id, v_balance_after, 'pending_admin'::TEXT;
END;
$$;

-- ============================================================================
-- 3. PERMISSIONS — Caller (authenticated) peut exécuter ces fonctions
-- ============================================================================
GRANT EXECUTE ON FUNCTION yatra.credit_wallet_v1(UUID, NUMERIC, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION yatra.request_withdrawal_v1(UUID, NUMERIC, TEXT, TEXT) TO authenticated, service_role;

-- ============================================================================
-- 4. INDEX POUR PERFS
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_wallet_tx_created ON yatra.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON yatra.withdrawals(user_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON yatra.withdrawals(status);

-- ============================================================================
-- 5. RLS — withdrawals self_all OK ; wallets self_select OK ; wallet_transactions self_select OK
-- (déjà appliqués en P1, on s'assure juste qu'ils existent)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='yatra' AND tablename='withdrawals' AND policyname='wd_self_select') THEN
    CREATE POLICY wd_self_select ON yatra.withdrawals FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

GRANT ALL ON yatra.wallet_transactions TO postgres, authenticated, service_role;
GRANT ALL ON yatra.withdrawals TO postgres, authenticated, service_role;
