'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'yatra-intro-seen'

/**
 * CinematicIntro — séquence 3s d'ouverture YATRA.
 * Skip possible (Esc, click, ou bouton). Ne s'affiche qu'une fois (localStorage).
 */
export function CinematicIntro() {
  const [visible, setVisible] = useState(false)
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem(STORAGE_KEY)
    if (seen) return
    setVisible(true)

    const t1 = setTimeout(() => setStage(1), 60)
    const t2 = setTimeout(() => setStage(2), 1100)
    const t3 = setTimeout(() => setStage(3), 2100)
    const t4 = setTimeout(() => skip(), 3000)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function skip() {
    setVisible(false)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, '1')
  }

  useEffect(() => {
    if (!visible) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Intro YATRA"
      onClick={skip}
      className="fixed inset-0 z-modal flex items-center justify-center bg-black cursor-pointer"
      style={{ animation: 'fadeOut 0.6s ease 2.7s forwards' }}
    >
      <style>{`
        @keyframes fadeOut { from { opacity: 1 } to { opacity: 0; visibility: hidden } }
        @keyframes ringPulse { 0% { transform: scale(0.6); opacity: 0 } 60% { opacity: 1 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes wordIn { from { opacity: 0; transform: translateY(20px); filter: blur(8px) } to { opacity: 1; transform: translateY(0); filter: blur(0) } }
      `}</style>

      {/* Aurora subtle */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(34,197,94,0.25) 0%, rgba(6,182,212,0.15) 30%, transparent 70%)',
        }}
      />

      <div className="relative text-center px-6">
        {/* Cercle pulse */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          <div
            className="absolute inset-0 rounded-full border-2 border-emerald-400/60"
            style={{ animation: 'ringPulse 2.4s ease-out infinite' }}
          />
          <div
            className="absolute inset-3 rounded-full border-2 border-cyan-400/40"
            style={{ animation: 'ringPulse 2.4s ease-out 0.6s infinite' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
              Y
            </span>
          </div>
        </div>

        {/* Texte 3 stages */}
        <div className="space-y-3 min-h-[120px]">
          {stage >= 1 && (
            <p
              className="text-2xl md:text-4xl font-bold text-white"
              style={{ animation: 'wordIn 0.8s var(--ease-spring)', fontFamily: 'var(--font-display)' }}
            >
              Tu te déplaces proprement
            </p>
          )}
          {stage >= 2 && (
            <p
              className="text-xl md:text-3xl font-semibold gradient-text-aurora"
              style={{ animation: 'wordIn 0.8s var(--ease-spring)', fontFamily: 'var(--font-display)' }}
            >
              Tu es payé
            </p>
          )}
          {stage >= 3 && (
            <p
              className="text-base md:text-lg text-white/60 mt-4"
              style={{ animation: 'wordIn 0.8s var(--ease-spring)' }}
            >
              Bienvenue dans YATRA
            </p>
          )}
        </div>

        {/* Skip */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            skip()
          }}
          className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-xs text-white/40 hover:text-white/80 transition"
        >
          Passer →
        </button>
      </div>
    </div>
  )
}
