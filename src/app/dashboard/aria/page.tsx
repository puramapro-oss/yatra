import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pickDailyQuestionIndex } from '@/lib/aria'
import { AriaHubView } from './AriaHubView'

export const dynamic = 'force-dynamic'

export default async function AriaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_completed, full_name')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.onboarding_completed) redirect('/onboarding')

  const [{ data: questions }, { data: lastConv }, { data: state }] = await Promise.all([
    supabase
      .from('aria_daily_questions')
      .select('id, slug, text, category')
      .eq('active', true)
      .order('display_order', { ascending: true }),
    supabase
      .from('aria_conversations')
      .select('id, mode, title, started_at, ended_at, sentiment, summary')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('aria_user_state')
      .select('daily_streak, total_conversations, current_mood, current_intention')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const list = questions ?? []
  const dailyQuestion = list[pickDailyQuestionIndex(list.length)] ?? null
  const firstName = profile?.full_name?.split(' ')[0] ?? null

  return (
    <AriaHubView
      firstName={firstName}
      dailyQuestion={dailyQuestion}
      lastConversation={lastConv ?? null}
      state={state ?? null}
    />
  )
}
