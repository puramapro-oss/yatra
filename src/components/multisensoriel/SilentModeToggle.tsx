'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Volume2, VolumeX } from 'lucide-react'

/**
 * SilentModeToggle — bouton flottant "Silence total" (brief V3 §11).
 * Désactive d'un coup : sons binaural, parallax gyroscope, vibrations haptiques, animations lourdes.
 * Visible uniquement dans /dashboard/* pour ne pas polluer les pages publiques.
 * Persiste dans localStorage + sync DB via API.
 */
export function SilentModeToggle() {
  const pathname = usePathname()
  const [silentMode, setSilentMode] = useState(false)
  const [visible, setVisible] = useState(false)

  // Affiche uniquement dans le dashboard
  useEffect(() => {
    setVisible(pathname?.startsWith('/dashboard') ?? false)
  }, [pathname])

  // Charge l'état initial depuis localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('yatra-silent-mode')
    if (stored === '1') {
      setSilentMode(true)
      document.documentElement.setAttribute('data-silent-mode', '1')
    }
  }, [])

  async function toggle() {
    const next = !silentMode
    setSilentMode(next)

    // Persiste localStorage immédiat
    if (typeof window !== 'undefined') {
      localStorage.setItem('yatra-silent-mode', next ? '1' : '0')
      if (next) {
        document.documentElement.setAttribute('data-silent-mode', '1')
      } else {
        document.documentElement.removeAttribute('data-silent-mode')
      }
    }

    // Sync DB en background (best-effort, pas bloquant)
    try {
      await fetch('/api/ambient/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ silent_mode: next }),
      })
    } catch {
      // Ignore silently — localStorage suffit en mode offline
    }
  }

  if (!visible) return null

  return (
    <button
      onClick={toggle}
      className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full backdrop-blur-xl transition-all duration-200 flex items-center justify-center shadow-lg md:bottom-6 md:right-6"
      style={{
        background: silentMode
          ? 'rgba(239, 68, 68, 0.2)'
          : 'rgba(255, 255, 255, 0.08)',
        border: silentMode
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.1)',
      }}
      aria-label={silentMode ? 'Désactiver le mode silence' : 'Activer le mode silence total'}
      title={silentMode ? 'Mode silence actif (tap pour réactiver tout)' : 'Silence total (désactive sons, animations, vibrations)'}
    >
      {silentMode ? (
        <VolumeX size={20} className="text-red-400" />
      ) : (
        <Volume2 size={20} className="text-white/70" />
      )}
    </button>
  )
}
