import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isSuperAdmin } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const CreateCampaignSchema = z.object({
  partner_name: z.string().min(1).max(200),
  location_name: z.string().min(1).max(200),
  location_type: z.enum(['bus', 'train', 'taxi', 'gare', 'aeroport', 'autre']),
  city: z.string().min(1).max(100),
  campaign_slug: z.string().min(1).max(100),
  commission_pct: z.number().min(0).max(100).nullable().optional(),
})

export async function POST(request: Request) {
  try {
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
    const validated = CreateCampaignSchema.parse(body)

    const svc = createServiceClient()

    // Vérifier unicité slug
    const { data: existing } = await svc
      .from('qr_campaigns')
      .select('id')
      .eq('campaign_slug', validated.campaign_slug)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ce slug existe déjà' }, { status: 409 })
    }

    // Créer campagne
    const { data: campaign, error: insertError } = await svc
      .from('qr_campaigns')
      .insert({
        partner_name: validated.partner_name,
        location_name: validated.location_name,
        location_type: validated.location_type,
        city: validated.city,
        campaign_slug: validated.campaign_slug,
        commission_pct: validated.commission_pct ?? null,
        active: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[QR campaigns] insert error:', insertError)
      return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 })
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
