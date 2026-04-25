/**
 * Wallet — wrappers RPC (server-only).
 * Toute écriture passe par les fonctions atomiques Postgres pour cohérence garantie.
 */

import 'server-only'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type CreditSource =
  | 'trip_clean'
  | 'referral'
  | 'contest'
  | 'lottery'
  | 'redistribution'
  | 'manual_admin'
  | 'mission'

export type CreditResult = {
  transaction_id: string
  new_balance: number
  new_total_earned: number
}

export type WithdrawalResult = {
  withdrawal_id: string
  new_balance: number
  status: string
}

/**
 * Crédite le wallet d'un utilisateur de façon atomique.
 * Doit être appelé en contexte serveur authentifié (ou avec service client).
 */
export async function creditWallet(opts: {
  userId: string
  amount: number
  source: CreditSource
  description?: string
  sourceId?: string
  useServiceRole?: boolean
}): Promise<CreditResult> {
  const supabase = opts.useServiceRole ? createServiceClient() : await createClient()
  const { data, error } = await supabase.rpc('credit_wallet_v1' as never, {
    p_user_id: opts.userId,
    p_amount: opts.amount,
    p_source: opts.source,
    p_description: opts.description ?? null,
    p_source_id: opts.sourceId ?? null,
  } as never)

  if (error) {
    throw new Error(error.message)
  }
  // RPC TABLE-returning → array
  const row = Array.isArray(data) ? data[0] : data
  return {
    transaction_id: row.transaction_id as string,
    new_balance: Number(row.new_balance),
    new_total_earned: Number(row.new_total_earned),
  }
}

/**
 * Demande un retrait IBAN (status='pending_admin' tant que pré-Treezor).
 */
export async function requestWithdrawal(opts: {
  userId: string
  amount: number
  ibanLast4: string
  holderName: string
}): Promise<WithdrawalResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('request_withdrawal_v1' as never, {
    p_user_id: opts.userId,
    p_amount: opts.amount,
    p_iban_last4: opts.ibanLast4,
    p_holder_name: opts.holderName,
  } as never)

  if (error) {
    throw new Error(error.message)
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    withdrawal_id: row.withdrawal_id as string,
    new_balance: Number(row.new_balance),
    status: row.status as string,
  }
}
