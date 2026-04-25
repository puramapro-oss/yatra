'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Send, Volume2, VolumeX } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

type Conversation = {
  id: string
  mode: string
  title: string | null
  sentiment: string | null
  summary: string | null
  started_at: string
  ended_at: string | null
}

type Message = {
  id: string
  role: string
  content: string
  created_at: string
}

type ModeMeta = {
  label: string
  emoji: string
  tagline: string
  maxTokens: number
  placeholder: string
}

export function ConversationView({
  conversation,
  initialMessages,
  meta,
}: {
  conversation: Conversation
  initialMessages: Message[]
  meta: ModeMeta
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [streamingText, setStreamingText] = useState('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const [endedAt, setEndedAt] = useState<string | null>(conversation.ended_at)
  const [endingSession, setEndingSession] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Autoscroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamingText])

  // Stop TTS speech on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  }, [])

  function speak(text: string) {
    if (!ttsEnabled || typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    try {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'fr-FR'
      utt.rate = 0.95
      utt.pitch = 1.05
      const voices = window.speechSynthesis.getVoices()
      const fr = voices.find((v) => v.lang.startsWith('fr') && /female|claire|female|amelie|audrey|julie/i.test(v.name)) ||
        voices.find((v) => v.lang.startsWith('fr'))
      if (fr) utt.voice = fr
      window.speechSynthesis.speak(utt)
    } catch {
      // ignore
    }
  }

  async function send() {
    const trimmed = input.trim()
    if (!trimmed || sending || endedAt) return
    setSending(true)
    setStreamingText('')

    const tempUserMsg: Message = {
      id: `tmp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }
    setMessages((m) => [...m, tempUserMsg])
    setInput('')

    try {
      const res = await fetch('/api/aria/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversation_id: conversation.id, content: trimmed }),
      })

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Limite atteinte')
        setSending(false)
        return
      }

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Erreur')
        setSending(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split('\n\n')
        buffer = events.pop() ?? ''
        for (const event of events) {
          if (!event.startsWith('data: ')) continue
          try {
            const payload = JSON.parse(event.slice(6))
            if (payload.delta) {
              assistantText += payload.delta as string
              setStreamingText(assistantText)
            }
            if (payload.error) {
              toast.error(payload.error)
            }
          } catch {
            // skip malformed
          }
        }
      }

      const finalAssistantMsg: Message = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: assistantText,
        created_at: new Date().toISOString(),
      }
      setMessages((m) => [...m, finalAssistantMsg])
      setStreamingText('')

      if (assistantText) speak(assistantText)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setSending(false)
    }
  }

  async function endSession() {
    if (endingSession || endedAt) return
    setEndingSession(true)
    try {
      const r = await fetch(`/api/aria/conversations/${conversation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ end: true, generate_summary: true }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      setEndedAt(new Date().toISOString())
      toast.success('Conversation clôturée 🌙')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setEndingSession(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh flex flex-col">
        <header className="px-6 py-4 flex items-center gap-3 border-b border-white/5 backdrop-blur-md bg-black/20">
          <Link href="/dashboard/aria" className="text-white/60 hover:text-white transition">
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-2xl">{meta.emoji}</span>
            <div className="min-w-0">
              <p className="font-semibold tracking-tight truncate" style={{ fontFamily: 'var(--font-display)' }}>
                {conversation.title ?? meta.label}
              </p>
              <p className="text-xs text-white/45 truncate">{meta.tagline}</p>
            </div>
          </div>
          <button
            onClick={() => setTtsEnabled((v) => !v)}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
              ttsEnabled ? 'bg-violet-500/20 text-violet-200' : 'bg-white/5 text-white/40'
            }`}
            aria-label={ttsEnabled ? 'Couper la voix' : 'Activer la voix'}
            title={ttsEnabled ? 'Voix Aria activée' : 'Voix Aria désactivée'}
          >
            {ttsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {!endedAt && (
            <button
              onClick={endSession}
              disabled={endingSession}
              className="text-xs text-white/55 hover:text-white transition px-2 py-1 rounded border border-white/10"
            >
              {endingSession ? '…' : 'Clôturer'}
            </button>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full space-y-4">
          {messages.length === 0 && (
            <p className="text-center text-white/55 italic">Aria est là quand tu veux. Écris ton premier mot.</p>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} content={m.content} />
          ))}
          {streamingText && <Bubble role="assistant" content={streamingText} streaming />}
          {endedAt && (
            <div className="text-center text-xs text-white/40 italic pt-4 border-t border-white/5">
              Conversation clôturée le {new Date(endedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          )}
        </div>

        {!endedAt && (
          <div className="px-6 py-4 border-t border-white/5 backdrop-blur-md bg-black/20">
            <div className="max-w-3xl mx-auto flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={meta.placeholder || 'Écris à Aria…'}
                rows={2}
                maxLength={8000}
                className="flex-1 bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-sm focus:border-violet-400/40 focus:outline-none resize-none"
              />
              <button
                onClick={send}
                disabled={sending || !input.trim()}
                className="w-12 h-12 rounded-full bg-violet-500 hover:bg-violet-400 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0"
                aria-label="Envoyer"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 text-center mt-2">⌘+Entrée pour envoyer</p>
          </div>
        )}
      </main>
    </>
  )
}

function Bubble({ role, content, streaming }: { role: string; content: string; streaming?: boolean }) {
  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] glass rounded-2xl px-4 py-3 bg-white/[0.06] text-sm whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start gap-2">
      <div className="w-8 h-8 rounded-full bg-violet-500/15 text-violet-200 flex items-center justify-center text-xs shrink-0 mt-1">
        ✨
      </div>
      <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed text-white/90">
        {content}
        {streaming && <span className="inline-block w-2 h-3.5 bg-violet-300 ml-1 animate-pulse align-text-bottom" />}
      </div>
    </div>
  )
}
