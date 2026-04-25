import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { computeCombinations } from '@/lib/zero-cost'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const bodySchema = z.object({
  from: z.object({
    label: z.string().optional(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
  to: z.object({
    label: z.string().optional(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
  }),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const { from, to } = bodySchema.parse(body)

    const combinations = await computeCombinations(
      { lat: from.lat, lon: from.lon },
      { lat: to.lat, lon: to.lon },
    )

    return NextResponse.json({
      from: { label: from.label ?? `${from.lat.toFixed(4)}, ${from.lon.toFixed(4)}`, lat: from.lat, lon: from.lon },
      to: { label: to.label ?? `${to.lat.toFixed(4)}, ${to.lon.toFixed(4)}`, lat: to.lat, lon: to.lon },
      combinations,
    })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
