import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { validateMissionCompletion } from '@/lib/humanitarian-completion'
import { isSuperAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const CompleteSchema = z.object({
  targetUserId: z.string().uuid().optional(), // admin peut valider pour un autre user
  validationNotes: z.string().max(500).optional(),
})

/**
 * POST /api/humanitarian/[id]/complete
 * Valide qu'un utilisateur a accompli une mission humanitaire.
 * - Admin : peut valider pour n'importe quel user
 * - User : peut auto-valider sa propre mission (si logique temporelle OK)
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const parsed = CompleteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({
        error: parsed.error.issues[0]?.message ?? 'Payload invalide',
      }, { status: 400 })
    }

    const isAdmin = await isSuperAdmin(user.id)
    const targetUserId = parsed.data.targetUserId ?? user.id

    // Si l'utilisateur essaie de valider pour quelqu'un d'autre sans être admin
    if (targetUserId !== user.id && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    // Récupérer la mission
    const isUuid = UUID_RX.test(id)
    const { data: mission, error: me } = await supabase
      .from('humanitarian_missions')
      .select('id, slug, title, ends_at, active, reward_points')
      .eq(isUuid ? 'id' : 'slug', id)
      .maybeSingle()

    if (me || !mission || !mission.active) {
      return NextResponse.json({ error: 'Mission introuvable' }, { status: 404 })
    }

    // Vérifier que l'utilisateur a candidaté à cette mission
    const { data: application } = await supabase
      .from('humanitarian_applications')
      .select('id, status')
      .eq('user_id', targetUserId)
      .eq('mission_id', mission.id)
      .maybeSingle()

    // Auto-validation : nécessite une candidature acceptée
    if (!isAdmin) {
      if (!application || application.status !== 'accepted') {
        return NextResponse.json({
          error: 'Ta candidature doit être acceptée avant de valider la mission',
        }, { status: 403 })
      }

      // Auto-validation : vérifier que la mission est terminée (ends_at passé)
      if (mission.ends_at) {
        const endDate = new Date(mission.ends_at)
        if (endDate > new Date()) {
          return NextResponse.json({
            error: 'Mission pas encore terminée. Attends la fin de la mission pour valider.',
          }, { status: 400 })
        }
      }
    }

    // Valider la mission
    const result = await validateMissionCompletion({
      userId: targetUserId,
      missionId: mission.id,
      applicationId: application?.id,
      validatedBy: isAdmin ? user.id : undefined,
      validationNotes: parsed.data.validationNotes,
    })

    return NextResponse.json({
      ok: true,
      completion: result,
      mission: {
        id: mission.id,
        slug: mission.slug,
        title: mission.title,
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    console.error('[humanitarian/complete]', msg, e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
