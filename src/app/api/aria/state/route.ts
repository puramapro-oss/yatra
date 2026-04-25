import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const [{ data: state }, { data: lastConv }, { count }] = await Promise.all([
      supabase
        .from('aria_user_state')
        .select('current_mood, current_intention, daily_streak, total_conversations, last_active_date')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('aria_conversations')
        .select('id, mode, title, started_at, ended_at, sentiment, summary')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('aria_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('role', 'user')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    ])

    return NextResponse.json({
      state: state ?? null,
      last_conversation: lastConv ?? null,
      messages_today: count ?? 0,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
