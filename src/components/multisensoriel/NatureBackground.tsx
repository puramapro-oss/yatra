'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * NatureBackground — fond multisensoriel YATRA.
 * Couches : aurora animée + grain noise + parallax 3D au gyroscope mobile.
 * Vidéo HLS optionnelle (forêt + rivière) — se charge en idle pour ne pas bloquer LCP.
 */
export function NatureBackground({ withVideo = false }: { withVideo?: boolean }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let ticking = false
    function onOrientation(e: DeviceOrientationEvent) {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const x = (e.gamma || 0) / 30
        const y = (e.beta || 0) / 30
        setTilt({ x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) })
        ticking = false
      })
    }
    window.addEventListener('deviceorientation', onOrientation)
    return () => window.removeEventListener('deviceorientation', onOrientation)
  }, [])

  useEffect(() => {
    if (!withVideo) return
    if (typeof window === 'undefined') return
    const idle = (cb: () => void) => {
      const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
      if (ric) ric(cb)
      else setTimeout(cb, 1500)
    }
    idle(() => setVideoReady(true))
  }, [withVideo])

  return (
    <div className="fixed inset-0 z-base pointer-events-none" aria-hidden>
      {/* Couche 1 : couleur de base */}
      <div className="absolute inset-0 bg-[#0A0A0F]" />

      {/* Couche 2 : vidéo nature optionnelle (lazy) */}
      {withVideo && videoReady && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-15"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"
        >
          <source src="https://cdn.pexels.com/video/2330708/2330708-hd_1280_720_30fps.mp4" type="video/mp4" />
        </video>
      )}

      {/* Couche 3 : aurora animée avec parallax tilt */}
      <div
        className="aurora"
        style={{
          transform: `translate3d(${tilt.x * 12}px, ${tilt.y * 12}px, 0) scale(1.05)`,
          transition: 'transform 200ms ease-out',
        }}
      />

      {/* Couche 4 : grille subtile */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />

      {/* Couche 5 : grain noise */}
      <div className="noise-overlay" />
    </div>
  )
}
