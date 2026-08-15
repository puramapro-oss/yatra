'use client'

import { useTranslations } from 'next-intl'

export function StepName({ name, setName }: { name: string; setName: (v: string) => void }) {
  const t = useTranslations('onboarding')

  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
          {t('progress', { step: 1, total: 5 })}
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('step1.title')}
        </h1>
        <p className="text-sm text-white/55">
          {t('step1.subtitle')}
        </p>
      </div>

      <div className="glass rounded-2xl p-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder={t('step1.placeholder')}
          className="w-full bg-transparent text-center text-2xl font-semibold py-4 outline-none placeholder:text-white/25"
          style={{ fontFamily: 'var(--font-display)' }}
        />
      </div>

      <p className="text-xs text-white/35">
        {t('step1.hint')}
      </p>
    </div>
  )
}
