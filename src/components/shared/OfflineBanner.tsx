'use client'

import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setOffline(!navigator.onLine)
    const onOnline = () => setOffline(false)
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  if (!offline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] backdrop-blur-md bg-amber-500/15 border-b border-amber-400/30 px-4 py-2 text-center text-sm text-amber-100 flex items-center justify-center gap-2">
      <WifiOff size={14} /> Mode hors-ligne — les pages déjà visitées restent disponibles.
    </div>
  )
}
