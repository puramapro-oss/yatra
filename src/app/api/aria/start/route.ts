import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { isValidMode, ARIA_MODE_META } from '@/lib/aria'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const StartSchema = z.object({
  mode: z.string().refine(isValidMode, 'Mode invalide'),
  title: z.string().max(200).optional(),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = StartSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Payload invalide' }, { status: 400 })
    }

    const fallbackTitle = ARIA_MODE_META[parsed.data.mode as keyof typeof ARIA_MODE_META]?.label ?? 'Aria'
    const { data, error } = await supabase
      .from('aria_conversations')
      .insert({
        user_id: user.id,
        mode: parsed.data.mode,
        title: parsed.data.title?.trim() || fallbackTitle,
      })
      .select('id, mode, title, started_at')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Init / bump user_state
    const today = new Date().toISOString().slice(0, 10)
    const { data: existing } = await supabase
      .from('aria_user_state')
      .select('daily_streak, last_active_date, total_conversations')
      .eq('user_id', user.id)
      .maybeSingle()

    let nextStreak = 1
    if (existing?.last_active_date) {
      const last = new Date(existing.last_active_date).getTime()
      const todayTs = new Date(today).getTime()
      const diffDays = Math.round((todayTs - last) / (1000 * 60 * 60 * 24))
      if (diffDays === 0) nextStreak = existing.daily_streak ?? 1
      else if (diffDays === 1) nextStreak = (existing.daily_streak ?? 0) + 1
      else nextStreak = 1
    }

    await supabase
      .from('aria_user_state')
      .upsert(
        {
          user_id: user.id,
          last_active_date: today,
          daily_streak: nextStreak,
          total_conversations: (existing?.total_conversations ?? 0) + 1,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    return NextResponse.json({ conversation: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
