import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { pickDailyQuestionIndex } from '@/lib/aria'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: questions, error } = await supabase
      .from('aria_daily_questions')
      .select('id, slug, text, category, display_order')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Aucune question disponible' }, { status: 404 })
    }

    const idx = pickDailyQuestionIndex(questions.length)
    const question = questions[idx]

    // Marquer last_seen pour la rotation interne
    await supabase
      .from('aria_user_state')
      .upsert(
        {
          user_id: user.id,
          last_seen_question_id: question.id,
          last_seen_question_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )

    return NextResponse.json({ question })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
