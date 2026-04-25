import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isReservedSlug, isValidSlug, normalizeSlug } from '@/lib/ambassadeur'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const socialSchema = z.object({
  instagram: z.string().max(80).optional(),
  tiktok: z.string().max(80).optional(),
  youtube: z.string().max(120).optional(),
  twitter: z.string().max(80).optional(),
  linkedin: z.string().max(120).optional(),
}).partial()

const applySchema = z.object({
  slug: z.string().min(3).max(30),
  bio: z.string().max(500).optional(),
  social_links: socialSchema.optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json()
    const data = applySchema.parse(body)

    const slug = normalizeSlug(data.slug)
    if (!isValidSlug(slug)) {
      return NextResponse.json({ error: 'Slug invalide. 3-30 chars, a-z 0-9 -' }, { status: 400 })
    }
    if (isReservedSlug(slug)) {
      return NextResponse.json({ error: 'Ce slug est réservé. Choisis un autre.' }, { status: 409 })
    }

    const { data: result, error: rpcErr } = await supabase.rpc('apply_ambassadeur_v1' as never, {
      p_user_id: user.id,
      p_slug: slug,
      p_bio: data.bio ?? null,
      p_social_links: data.social_links ?? {},
    } as never)

    if (rpcErr) {
      const msg = rpcErr.message
      if (msg.includes('already_ambassador')) {
        return NextResponse.json({ error: 'Tu es déjà ambassadeur.' }, { status: 409 })
      }
      if (msg.includes('slug_taken')) {
        return NextResponse.json({ error: 'Ce slug est déjà pris.' }, { status: 409 })
      }
      if (msg.includes('invalid_slug')) {
        return NextResponse.json({ error: 'Slug invalide.' }, { status: 400 })
      }
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ambassadeur: result }, { status: 201 })
  } catch (e: unknown) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Données invalides', details: e.issues }, { status: 400 })
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erreur' }, { status: 500 })
  }
}
