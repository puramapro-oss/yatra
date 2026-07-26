import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/server'
import { isValidCagnotteCode } from '@/lib/vacances/cagnotte'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  contributeur_nom: z.string().min(1).max(80),
  montant_eur: z.number().min(1).max(500),
  type: z.enum(['cotisation', 'arrondi']).default('cotisation'),
  message: z.string().max(300).nullable().optional(),
})

const MAX_CONTRIBUTIONS_PER_IP_PER_HOUR = 3

export async function POST(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    if (!isValidCagnotteCode(code)) return NextResponse.json({ error: 'Lien invalide' }, { status: 400 })

    const body = bodySchema.parse(await request.json())
    const supabase = createServiceClient()

    const { data: cagnotte } = await supabase
      .from('vacances_cagnottes')
      .select('id, objectif_eur, montant_actuel_eur, statut')
      .eq('lien_partage_code', code.toUpperCase())
      .maybeSingle()
    if (!cagnotte) return NextResponse.json({ error: 'Cagnotte introuvable' }, { status: 404 })
    if (cagnotte.statut !== 'active') return NextResponse.json({ error: 'Cette cagnotte est clôturée' }, { status: 409 })

    // Sanity anti-abus : refuse si ça pousserait le total à plus de 2x l'objectif.
    if (Number(cagnotte.montant_actuel_eur) + body.montant_eur > Number(cagnotte.objectif_eur) * 2) {
      return NextResponse.json({ error: 'Cette cagnotte a déjà largement dépassé son objectif.' }, { status: 409 })
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
    const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 32) : null

    if (ipHash) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('vacances_cagnotte_contributions')
        .select('id', { count: 'exact', head: true })
        .eq('cagnotte_id', cagnotte.id)
        .eq('ip_hash', ipHash)
        .gte('created_at', oneHourAgo)
      if ((count ?? 0) >= MAX_CONTRIBUTIONS_PER_IP_PER_HOUR) {
        return NextResponse.json({ error: 'Trop de contributions récentes depuis cette connexion. Réessaie plus tard.' }, { status: 429 })
      }
    }

    const { data: result, error } = await supabase.rpc('contribute_cagnotte_v1' as never, {
      p_cagnotte_id: cagnotte.id,
      p_contributeur_nom: body.contributeur_nom,
      p_montant_eur: body.montant_eur,
      p_type: body.type,
      p_message: body.message ?? null,
      p_ip_hash: ipHash,
    } as never)
    if (error) throw new Error(error.message)

    const row = Array.isArray(result) ? result[0] : result

    return NextResponse.json({
      nouveau_montant_actuel_eur: (row as { nouveau_montant_actuel_eur: number }).nouveau_montant_actuel_eur,
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
