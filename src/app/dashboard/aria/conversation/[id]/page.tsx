import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ARIA_MODE_META, isValidMode } from '@/lib/aria'
import { ConversationView } from './ConversationView'

export const dynamic = 'force-dynamic'

export default async function AriaConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: conv } = await supabase
    .from('aria_conversations')
    .select('id, mode, title, sentiment, summary, started_at, ended_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!conv || !isValidMode(conv.mode)) notFound()

  const { data: messages } = await supabase
    .from('aria_messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })

  return (
    <ConversationView
      conversation={conv}
      initialMessages={(messages ?? []).filter((m) => m.role !== 'system')}
      meta={ARIA_MODE_META[conv.mode]}
    />
  )
}
