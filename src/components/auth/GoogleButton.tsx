'use client'

import { Loader2 } from 'lucide-react'
import { useState } from 'react'

export function GoogleButton({
  onClick,
  disabled,
  label = 'Continuer avec Google',
}: {
  onClick: () => Promise<void> | void
  disabled?: boolean
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (loading || disabled) return
    setLoading(true)
    try {
      await onClick()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || loading}
      aria-label={label}
      className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 font-medium py-3 rounded-xl hover:bg-white/95 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.13 4.13 0 0 1-1.79 2.71v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62Z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 0 0 9 18Z"/>
          <path fill="#FBBC05" d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.34Z"/>
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 9 0 9 9 0 0 0 .96 4.96L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58Z"/>
        </svg>
      )}
      <span>{label}</span>
    </button>
  )
}
