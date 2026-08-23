'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Mic, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// Type declarations for Web Speech API
interface SpeechRecognitionResultItem {
  transcript: string
  confidence: number
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionResultItem
  isFinal: boolean
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
  length: number
}

interface SpeechRecognitionEventData {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventData) => void) | null
  onerror: ((event: Event) => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

type SearchResult = {
  type: 'trajet' | 'budget_inverse' | 'radar_gratuit' | 'aides' | 'surprise' | 'ambigu'
  destination?: string
  budget_eur?: number
  jours?: number
  rayon_km?: number
  duree?: '2h' | 'demi_journee' | 'weekend'
  confidence: number
}

export function NLUSearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [listening, setListening] = useState(false)
  const [hasSpeechAPI] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  )

  async function handleSearch() {
    const trimmed = query.trim()
    if (!trimmed || searching) return
    setSearching(true)

    try {
      const res = await fetch('/api/yatra/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      })

      if (res.status === 429) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Limite atteinte')
        setSearching(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error ?? 'Erreur')
        setSearching(false)
        return
      }

      const result: SearchResult = await res.json()

      // Redirection selon type détecté
      if (result.type === 'trajet' && result.destination) {
        const params = new URLSearchParams()
        if (result.destination) params.set('to', result.destination)
        router.push(`/dashboard/trajet?${params.toString()}`)
      } else if (result.type === 'budget_inverse' && result.budget_eur && result.jours) {
        const params = new URLSearchParams()
        params.set('budget', result.budget_eur.toString())
        params.set('jours', result.jours.toString())
        router.push(`/dashboard/vacances/budget?${params.toString()}`)
      } else if (result.type === 'radar_gratuit') {
        router.push('/dashboard/gratuit')
      } else if (result.type === 'aides') {
        router.push('/dashboard/aides')
      } else if (result.type === 'surprise') {
        const params = new URLSearchParams()
        if (result.rayon_km) params.set('rayon', result.rayon_km.toString())
        if (result.budget_eur != null) params.set('budget', result.budget_eur.toString())
        if (result.duree) params.set('duree', result.duree)
        router.push(`/dashboard/surprise?${params.toString()}`)
      } else {
        // Ambigu ou confiance faible → affiche les options
        toast.info('Je n\'ai pas tout compris. Choisis où aller ci-dessous.')
        setSearching(false)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setSearching(false)
    }
  }

  function handleVoiceInput() {
    if (!hasSpeechAPI || listening) return
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) return

      const recognition = new SpeechRecognition()
      recognition.lang = 'fr-FR'
      recognition.continuous = false
      recognition.interimResults = false

      recognition.onstart = () => setListening(true)
      recognition.onend = () => setListening(false)

      recognition.onresult = (event: SpeechRecognitionEventData) => {
        const transcript = event.results?.[0]?.[0]?.transcript ?? ''
        if (transcript) {
          setQuery(transcript)
          setListening(false)
        }
      }

      recognition.onerror = () => {
        setListening(false)
        toast.error('Impossible de capter la voix')
      }

      recognition.start()
    } catch {
      toast.error('Micro non disponible')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <div className="glass rounded-3xl p-6 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
      <div className="flex items-center gap-2 mb-3">
        <Search size={20} className="text-emerald-300" />
        <h2 className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Dis exactement ce que tu cherches
        </h2>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Je veux aller à Lyon demain · 500€ pour 5 jours · Musées gratuits · Aides transport..."
            maxLength={500}
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl py-3 px-4 pr-12 text-sm focus:border-emerald-400/40 focus:outline-none placeholder:text-white/35"
          />
          {hasSpeechAPI && (
            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={listening || searching}
              className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition ${
                listening ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/5 text-white/40 hover:bg-white/10'
              } disabled:opacity-50`}
              aria-label="Recherche vocale"
            >
              <Mic size={16} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-medium text-sm transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {searching ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span className="hidden sm:inline">Recherche…</span>
            </>
          ) : (
            <>
              <Search size={16} />
              <span className="hidden sm:inline">Chercher</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-white/40 mt-3">
        YATRA comprend ta demande en langage naturel et te dirige au bon endroit.
      </p>
    </div>
  )
}
