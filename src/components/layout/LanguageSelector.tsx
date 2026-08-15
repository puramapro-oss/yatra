'use client'

import { useLocale } from 'next-intl'
import { useState, useTransition } from 'react'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
] as const

export function LanguageSelector() {
  const currentLocale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const currentLanguage = LANGUAGES.find((lang) => lang.code === currentLocale) || LANGUAGES[0]

  const handleLanguageChange = (newLocale: string) => {
    startTransition(() => {
      // Set cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      // Refresh to apply new locale
      window.location.reload()
    })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-white/70" />
        <span className="text-sm font-medium text-white/90">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 z-50 min-w-[200px] rounded-xl bg-[#14141C] border border-white/10 shadow-2xl overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  handleLanguageChange(lang.code)
                  setIsOpen(false)
                }}
                disabled={isPending}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                  ${lang.code === currentLocale
                    ? 'bg-primary/20 text-primary'
                    : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                  }
                  disabled:opacity-50
                `}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
                {lang.code === currentLocale && (
                  <span className="ml-auto text-xs text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
