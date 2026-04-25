'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (typeof window !== 'undefined') console.error('[YATRA error.tsx]', error)
  }, [error])

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <div className="glass max-w-md w-full p-8 rounded-2xl text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="text-amber-400" size={32} />
        </div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Oups, ça a planté 🌿
        </h1>
        <p className="text-white/60">
          Pas grave. Réessaie — si le souci persiste, écris-nous depuis le bouton aide.
        </p>
        <button onClick={reset} className="btn-primary mx-auto">
          <RefreshCcw size={16} /> Réessayer
        </button>
        {error.digest && <p className="text-xs text-white/30 mt-3">Réf : {error.digest}</p>}
      </div>
    </main>
  )
}
