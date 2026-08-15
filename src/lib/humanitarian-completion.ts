/**
 * Humanitarian mission completion — validation + reward.
 * Server-only. Appelé par API admin ou auto-validation.
 */

import 'server-only'
import { createServiceClient } from '@/lib/supabase/server'
import { creditWallet } from '@/lib/wallet'

export type MissionCompletionInput = {
  userId: string
  missionId: string
  applicationId?: string
  validatedBy?: string // admin user_id, null = auto-validation
  validationNotes?: string
}

export type MissionCompletionResult = {
  completion_id: string
  reward_amount: number
  wallet_credited: boolean
}

/**
 * Valide qu'un utilisateur a accompli une mission humanitaire.
 * Crédite automatiquement le wallet avec le reward_points de la mission.
 * Idempotent : si déjà validée, retourne la completion existante sans re-créditer.
 */
export async function validateMissionCompletion(
  input: MissionCompletionInput,
): Promise<MissionCompletionResult> {
  const supabase = createServiceClient()

  // 1. Vérifier que la mission existe et récupérer reward_points
  const { data: mission, error: missionError } = await supabase
    .from('humanitarian_missions')
    .select('id, title, reward_points')
    .eq('id', input.missionId)
    .maybeSingle()

  if (missionError || !mission) {
    throw new Error(`Mission introuvable : ${input.missionId}`)
  }

  const rewardAmount = Number(mission.reward_points ?? 0)

  // 2. Vérifier si déjà validée (idempotence)
  const { data: existing } = await supabase
    .from('humanitarian_completions')
    .select('id, reward_amount, reward_credited')
    .eq('user_id', input.userId)
    .eq('mission_id', input.missionId)
    .maybeSingle()

  if (existing) {
    return {
      completion_id: existing.id,
      reward_amount: Number(existing.reward_amount),
      wallet_credited: existing.reward_credited,
    }
  }

  // 3. Créer la completion
  const { data: completion, error: completionError } = await supabase
    .from('humanitarian_completions')
    .insert({
      user_id: input.userId,
      mission_id: input.missionId,
      application_id: input.applicationId ?? null,
      validated_by: input.validatedBy ?? null,
      validation_notes: input.validationNotes ?? null,
      reward_credited: false,
      reward_amount: rewardAmount,
    })
    .select('id')
    .single()

  if (completionError || !completion) {
    throw new Error(`Erreur création completion : ${completionError?.message ?? 'Inconnue'}`)
  }

  // 4. Créditer le wallet si reward_points > 0
  let walletCredited = false
  if (rewardAmount > 0) {
    try {
      await creditWallet({
        userId: input.userId,
        amount: rewardAmount,
        source: 'mission',
        description: `Mission humanitaire : ${mission.title}`,
        sourceId: completion.id,
        useServiceRole: true,
      })
      walletCredited = true

      // Marquer reward_credited = true
      await supabase
        .from('humanitarian_completions')
        .update({ reward_credited: true })
        .eq('id', completion.id)
    } catch (walletError) {
      // Log l'erreur mais ne bloque pas (admin pourra recréditer manuellement)
      console.error('[humanitarian-completion] Erreur crédit wallet:', walletError)
    }
  }

  return {
    completion_id: completion.id,
    reward_amount: rewardAmount,
    wallet_credited: walletCredited,
  }
}

/**
 * Récupère les missions accomplies par un utilisateur.
 */
export async function getUserCompletedMissions(userId: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('humanitarian_completions')
    .select(`
      id,
      completed_at,
      reward_amount,
      reward_credited,
      humanitarian_missions (
        id,
        slug,
        title,
        ngo_name,
        cause,
        duree_type
      )
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}
