/**
 * Trust Score 0-100 — réputation anti-fraude.
 * Distinct du Score d'Humanité (engagement positif). Ici on parle de fiabilité technique.
 *
 * Score initial : 50. Plage : 0-100.
 * Gates :
 *  - Trust >= 30 pour démarrer un Challenge Stake
 *  - Trust >= 20 pour signaler une zone safety
 *  - Trust >= 40 pour passer en mode "cash withdrawal" (retrait wallet vers IBAN sans audit additionnel)
 *
 * Sources d'évolution :
 *  - +1 par trip clean validé (preuve OK)
 *  - -3 par trip flagged (preuve KO)
 *  - +5 par challenge stake completed
 *  - -3 par challenge stake failed
 *  - +2 par safety report jugé crédible (admin/community vote)
 *  - -2 par safety report rejeté (spam)
 *  - -10 par audit failed (vérification manuelle ou ML)
 */

import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'

export type TrustEventType =
  | 'proof_ok'
  | 'proof_failed'
  | 'audit_pass'
  | 'audit_fail'
  | 'suspect_speed'
  | 'multi_account_flag'
  | 'safety_report_credible'
  | 'safety_report_invalid'
  | 'challenge_completed'
  | 'challenge_failed'
  | 'manual_admin_adjust'

export const TRUST_DELTAS: Record<TrustEventType, number> = {
  proof_ok: 1,
  proof_failed: -3,
  audit_pass: 3,
  audit_fail: -10,
  suspect_speed: -5,
  multi_account_flag: -15,
  safety_report_credible: 2,
  safety_report_invalid: -2,
  challenge_completed: 5,
  challenge_failed: -3,
  manual_admin_adjust: 0, // delta géré manuellement
}

export const TRUST_THRESHOLD_STAKE = 30
export const TRUST_THRESHOLD_REPORT = 20
export const TRUST_THRESHOLD_CASH = 40

export type TrustState = {
  score: number
  proofs_ok: number
  proofs_failed: number
  audits_passed: number
  audits_failed: number
  reports_credible: number
  reports_invalid: number
  last_event_at: string | null
  level: 'verifie' | 'fiable' | 'reconnu' | 'pilier'
  level_label: string
}

export function trustLevel(score: number): { level: TrustState['level']; label: string } {
  if (score >= 85) return { level: 'pilier', label: 'Pilier de la communauté' }
  if (score >= 65) return { level: 'reconnu', label: 'Membre reconnu' }
  if (score >= 40) return { level: 'fiable', label: 'Membre fiable' }
  return { level: 'verifie', label: 'Compte vérifié' }
}

/**
 * Enregistre un trust event + met à jour l'agrégat.
 * Utilise le RPC record_trust_event_v1 (atomique).
 *
 * @param delta — surcharge optionnelle pour cas exceptionnels (sinon TRUST_DELTAS[type])
 */
export async function recordTrustEvent(opts: {
  userId: string
  type: TrustEventType
  reason?: string
  sourceId?: string | null
  delta?: number
}): Promise<{ event_id: string; new_score: number } | null> {
  try {
    const supabase = createServiceClient()
    const delta = opts.delta ?? TRUST_DELTAS[opts.type]
    const { data, error } = await supabase.rpc('record_trust_event_v1' as never, {
      p_user_id: opts.userId,
      p_event_type: opts.type,
      p_delta: delta,
      p_reason: opts.reason ?? null,
      p_source_id: opts.sourceId ?? null,
    } as never)
    if (error) return null
    const row = data as { event_id: string; new_score: number } | null
    return row ?? null
  } catch {
    return null
  }
}
