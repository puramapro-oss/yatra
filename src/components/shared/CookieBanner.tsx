'use client'

import { useEffect, useState } from 'react'
import { Cookie } from 'lucide-react'

const KEY = 'yatra-cookie-choice'

export function CookieBanner() {
  const [choice, setChoice] = useState<'accept' | 'decline' | null>('accept')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem(KEY) as 'accept' | 'decline' | null
    if (stored) setChoice(stored)
    else setChoice(null)
  }, [])

  if (choice !== null) return null

  function decide(value: 'accept' | 'decline') {
    setChoice(value)
    if (typeof window !== 'undefined') localStorage.setItem(KEY, value)
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-toast">
      <div className="glass rounded-2xl p-4 sm:p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <Cookie className="text-amber-400 shrink-0 mt-1" size={20} />
          <div className="flex-1">
            <p className="text-sm leading-relaxed">
              On utilise un minimum de cookies — uniquement pour te garder connecté(e) et améliorer ton expérience.
              Aucun tracking publicitaire, jamais.
            </p>
            <div className="flex gap-2 mt-3">
              <button onClick={() => decide('accept')} className="btn-primary text-xs px-4 py-2">
                Accepter
              </button>
              <button onClick={() => decide('decline')} className="btn-ghost text-xs px-4 py-2">
                Refuser
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
