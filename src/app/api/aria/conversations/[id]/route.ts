import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { askClaudeJSON } from '@/lib/claude'
import { isValidSentiment } from '@/lib/aria'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const { data: conv, error } = await supabase
      .from('aria_conversations')
      .select('id, mode, title, sentiment, summary, message_count, total_tokens, started_at, ended_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !conv) return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })

    const { data: messages } = await supabase
      .from('aria_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    return NextResponse.json({
      conversation: conv,
      messages: (messages ?? []).filter((m) => m.role !== 'system'),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

const PatchSchema = z.object({
  end: z.boolean().optional(),
  generate_summary: z.boolean().optional(),
  title: z.string().max(200).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = PatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (parsed.data.end) updates.ended_at = new Date().toISOString()
    if (parsed.data.title) updates.title = parsed.data.title.trim()

    if (parsed.data.generate_summary) {
      const { data: messages } = await supabase
        .from('aria_messages')
        .select('role, content')
        .eq('conversation_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      const transcript = (messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-20)
        .map((m) => `[${m.role === 'user' ? 'User' : 'Aria'}] ${m.content}`)
        .join('\n')

      if (transcript.length > 30) {
        try {
          const summary = await askClaudeJSON<{ summary: string; sentiment: string }>(
            `Tu es un analyste qui résume des conversations YATRA-Aria. Réponds en JSON {"summary": "...", "sentiment": "apaise|energise|inspire|doute|libere|neutre"}. Résumé en 1-2 phrases françaises, factuel, sans jugement. Sentiment selon ce que la personne semble ressentir À LA FIN.`,
            transcript,
            { model: 'fast', maxTokens: 200 },
          )
          if (summary?.summary) updates.summary = summary.summary.slice(0, 600)
          if (summary?.sentiment && isValidSentiment(summary.sentiment)) updates.sentiment = summary.sentiment
        } catch {
          // best effort, on n'échoue pas la requête
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ ok: true, noop: true })
    }

    const { data, error } = await supabase
      .from('aria_conversations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, ended_at, sentiment, summary, title')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ conversation: data })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
