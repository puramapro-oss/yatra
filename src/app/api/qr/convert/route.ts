import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { campaign_slug } = await request.json()

    if (!campaign_slug || typeof campaign_slug !== 'string') {
      return NextResponse.json({ error: 'campaign_slug requis' }, { status: 400 })
    }

    // Récupérer la campagne
    const svc = createServiceClient()
    const { data: campaign } = await svc
      .from('qr_campaigns')
      .select('id')
      .eq('campaign_slug', campaign_slug)
      .eq('active', true)
      .maybeSingle()

    if (!campaign) {
      return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    }

    // Marquer la conversion (update le scan le plus récent de cette campagne pour cet utilisateur)
    // On marque TOUS les scans récents (< 30j) non convertis de cette campagne
    // (car l'utilisateur peut avoir scanné plusieurs fois avant de signup)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { error: updateError } = await svc
      .from('qr_scans')
      .update({
        converted_to_signup: true,
        user_id: user.id,
      })
      .eq('campaign_id', campaign.id)
      .eq('converted_to_signup', false)
      .gte('scanned_at', thirtyDaysAgo)
      .is('user_id', null)

    if (updateError) {
      console.error('[QR convert] update error:', updateError)
      return NextResponse.json({ error: 'Erreur lors de la conversion' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[QR convert] error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
