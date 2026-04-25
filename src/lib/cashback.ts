/**
 * Cashback — wrappers RPC + helper signature webhook.
 * Webhook partenaire signe avec HMAC SHA-256 (secret partagé).
 */

import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { createHmac, timingSafeEqual } from 'node:crypto'

export type CashbackPartner = {
  id: string
  slug: string
  name: string
  category: string
  description: string
  logo_url: string | null
  redirect_url: string
  commission_pct: number
  user_share_pct: number
  min_purchase_eur: number | null
  max_cashback_eur: number | null
  ethical_score: number
}

export type CreditCashbackResult = {
  tx_id: string
  amount_credited: number
  partner: string | null
}

/**
 * Confirme une cashback_transaction et crédite le wallet user atomiquement.
 * Appelé uniquement côté serveur depuis le webhook partenaire signé.
 */
export async function creditCashback(opts: {
  userId: string
  txId: string
}): Promise<CreditCashbackResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase.rpc('credit_cashback_v1' as never, {
    p_user_id: opts.userId,
    p_tx_id: opts.txId,
  } as never)

  if (error) {
    throw new Error(error.message)
  }
  const row = Array.isArray(data) ? data[0] : data
  return {
    tx_id: String(row.tx_id ?? row.id ?? opts.txId),
    amount_credited: Number(row.amount_credited),
    partner: (row.partner ?? null) as string | null,
  }
}

/**
 * Vérifie la signature HMAC d'un webhook partenaire.
 * Header: x-yatra-signature = HEX(HMAC_SHA256(rawBody, CASHBACK_WEBHOOK_SECRET))
 */
export function verifyWebhookSignature(rawBody: string, headerSig: string | null): boolean {
  const secret = process.env.CASHBACK_WEBHOOK_SECRET
  if (!secret || !headerSig) return false
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(headerSig.trim(), 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Calcule la part user à partir du montant et des taux partenaire.
 */
export function computeUserShare(opts: {
  purchaseAmountEur: number
  commissionPct: number
  userSharePct: number
  maxCashbackEur?: number | null
}): { commissionTotal: number; userShare: number } {
  const commissionTotal = +(opts.purchaseAmountEur * (opts.commissionPct / 100)).toFixed(2)
  let userShare = +(commissionTotal * (opts.userSharePct / 100)).toFixed(2)
  if (opts.maxCashbackEur && userShare > opts.maxCashbackEur) {
    userShare = opts.maxCashbackEur
  }
  return { commissionTotal, userShare }
}
