import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const UpdateCampaignSchema = z.object({
  active: z.boolean().optional(),
  commission_pct: z.number().min(0).max(100).nullable().optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    if (!isSuperAdmin(user.email ?? null)) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const body = await request.json()
    const validated = UpdateCampaignSchema.parse(body)

    const svc = createServiceClient()

    const { data: campaign, error: updateError } = await svc
      .from('qr_campaigns')
      .update(validated)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('[QR campaigns] update error:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ campaign })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }
    console.error('[QR campaigns] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
