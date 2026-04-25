import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { SAFETY_CATEGORIES, SAFETY_SEVERITIES } from '@/lib/safety'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const reportSchema = z.object({
  category: z.enum(SAFETY_CATEGORIES),
  severity: z.enum(SAFETY_SEVERITIES),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  description: z.string().min(10).max(500),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = reportSchema.parse(body)

    const { data: result, error: rpcErr } = await supabase.rpc('report_safety_v1' as never, {
      p_user_id: user.id,
      p_category: data.category,
      p_severity: data.severity,
      p_lat: data.lat,
      p_lon: data.lon,
      p_description: data.description,
    } as never)

    if (rpcErr) {
      const msg = rpcErr.message
      if (msg.includes('too_many_reports')) {
        return NextResponse.json({ error: 'Trop de signalements récents. Patiente une heure.' }, { status: 429 })
      }
      if (msg.includes('trust_too_low')) {
        return NextResponse.json({ error: 'Trust Score insuffisant pour signaler. Seuil : 20/100' }, { status: 403 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ ok: true, result }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
