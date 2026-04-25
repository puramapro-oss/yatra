'use client'

import { useEffect, useState } from 'react'
import { Smartphone, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTutorial, setShowIOSTutorial] = useState(false)
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.innerWidth > 1024) return
    if (window.matchMedia('(display-mode: standalone)').matches) return
    if ((window.navigator as { standalone?: boolean }).standalone === true) return

    const dismissed = localStorage.getItem('yatra-pwa-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 86_400_000) return

    const visits = parseInt(localStorage.getItem('yatra-visits') || '0', 10) + 1
    localStorage.setItem('yatra-visits', visits.toString())
    if (visits < 2) return

    const ua = navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    if (ios) {
      setShow(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function install() {
    if (isIOS) {
      setShowIOSTutorial(true)
      return
    }
    if (deferred) {
      await deferred.prompt()
      const result = await deferred.userChoice
      if (result.outcome === 'accepted') dismiss()
    }
  }

  function dismiss() {
    setShow(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('yatra-pwa-dismissed', Date.now().toString())
    }
  }

  if (!show) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-toast" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="glass border-b border-white/10 px-4 py-3 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <Smartphone size={20} className="text-emerald-400" />
          <div>
            <p className="text-sm font-medium">Installer YATRA</p>
            <p className="text-xs text-white/50">Accès rapide, mode hors-ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={install} className="btn-primary text-xs px-3 py-1.5">
            Installer
          </button>
          <button onClick={dismiss} aria-label="Fermer" className="text-white/40 hover:text-white/80 p-1">
            <X size={16} />
          </button>
        </div>
      </div>
      {showIOSTutorial && (
        <div className="glass border-b border-white/10 px-4 py-3 max-w-2xl mx-auto text-xs text-white/70 space-y-1">
          <p>📱 Sur iPhone/iPad :</p>
          <p>1. Appuie sur <strong className="text-white">Partager ⬆</strong></p>
          <p>2. <strong className="text-white">"Sur l&apos;écran d&apos;accueil"</strong></p>
          <p>3. <strong className="text-white">Ajouter</strong></p>
        </div>
      )}
    </div>
  )
}
