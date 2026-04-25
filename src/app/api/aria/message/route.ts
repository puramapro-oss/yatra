import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { streamClaude, MODELS } from '@/lib/claude'
import {
  getAriaSystemPrompt,
  isValidMode,
  truncateMessages,
  ARIA_MODE_META,
  ARIA_DAILY_LIMIT_FREE,
} from '@/lib/aria'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MessageSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(8000),
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const parsed = MessageSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Payload invalide' }, { status: 400 })
    }

    // Charge la conversation + vérifie ownership
    const { data: conv, error: ce } = await supabase
      .from('aria_conversations')
      .select('id, mode, user_id')
      .eq('id', parsed.data.conversation_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (ce || !conv) {
      return NextResponse.json({ error: 'Conversation introuvable' }, { status: 404 })
    }

    if (!isValidMode(conv.mode)) {
      return NextResponse.json({ error: 'Mode conversation invalide' }, { status: 400 })
    }

    // Rate limit : 50 messages user role / 24h pour les non-payants
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('aria_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', since)

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .maybeSingle()

    const isPaid = profile?.plan && profile.plan !== 'free' && profile.plan !== 'lifetime' ? true : profile?.plan === 'lifetime'
    if (!isPaid && (count ?? 0) >= ARIA_DAILY_LIMIT_FREE) {
      return NextResponse.json(
        { error: `Limite quotidienne atteinte (${ARIA_DAILY_LIMIT_FREE} messages/jour). Reviens demain ou passe Premium pour discussions illimitées avec Aria.` },
        { status: 429 },
      )
    }

    // Persist message user
    const { data: userMsg, error: ie } = await supabase
      .from('aria_messages')
      .insert({
        conversation_id: conv.id,
        user_id: user.id,
        role: 'user',
        content: parsed.data.content,
      })
      .select('id')
      .single()

    if (ie || !userMsg) {
      return NextResponse.json({ error: 'Erreur enregistrement' }, { status: 500 })
    }

    // Charge l'historique (max 12 messages)
    const { data: history } = await supabase
      .from('aria_messages')
      .select('role, content')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true })

    const conversation = truncateMessages(
      (history ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    )

    const meta = ARIA_MODE_META[conv.mode]
    const systemPrompt = getAriaSystemPrompt(conv.mode)

    const stream = await streamClaude(systemPrompt, conversation, {
      model: 'main',
      maxTokens: meta.maxTokens,
    })

    let fullText = ''
    let inputTokens = 0
    let outputTokens = 0

    const encoder = new TextEncoder()
    const sse = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              fullText += event.delta.text
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`),
              )
            } else if (event.type === 'message_delta' && event.usage) {
              outputTokens = event.usage.output_tokens ?? outputTokens
            } else if (event.type === 'message_start' && event.message?.usage) {
              inputTokens = event.message.usage.input_tokens ?? 0
              outputTokens = event.message.usage.output_tokens ?? 0
            }
          }

          // Persist assistant message + bump conversation counters (best effort)
          await supabase.from('aria_messages').insert({
            conversation_id: conv.id,
            user_id: user.id,
            role: 'assistant',
            content: fullText,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            model: MODELS.main,
          })

          await supabase
            .from('aria_conversations')
            .update({
              message_count: (conversation.length ?? 0) + 1,
              total_tokens: inputTokens + outputTokens,
            })
            .eq('id', conv.id)

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
          controller.close()
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: err instanceof Error ? err.message : 'stream error' })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
