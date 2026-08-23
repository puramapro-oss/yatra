'use client'

import CookieConsentBanner from '@/lib/legal/components/CookieConsentBanner'
import type { CookieConsent } from '@/lib/legal/hooks/useCookieConsent'

/**
 * Synchronise le choix en base (si connecté) en plus du localStorage géré par
 * `useCookieConsent` — preuve de consentement indépendante du navigateur.
 * Remplace l'ancien `components/shared/CookieBanner.tsx` (2 choix seulement,
 * pas de synchronisation DB) — cf CONFORMITE.md gap #1.
 */
export default function CookieConsentBannerClient() {
  function handleConsent(consent: CookieConsent) {
    fetch('/api/legal/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesure: consent.mesure, marketing: consent.marketing }),
    }).catch(() => {})
  }

  return (
    <CookieConsentBanner
      appName="YATRA"
      politiqueHref="/politique-confidentialite"
      onConsent={handleConsent}
    />
  )
}
