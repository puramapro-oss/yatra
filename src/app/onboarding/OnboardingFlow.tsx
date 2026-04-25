'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { ArrowRight, ArrowLeft, Loader2 } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { StepName } from './steps/StepName'
import { StepHabitudes } from './steps/StepHabitudes'
import { StepPreferences } from './steps/StepPreferences'
import { StepPermissions } from './steps/StepPermissions'
import { StepWow } from './steps/StepWow'
import type {
  HabitudesMobilite,
  PreferencesSensorielles,
  ProfilOnboarding,
  MomentWow,
} from '@/types/vida'

const TOTAL_STEPS = 5

const defaultHabitudes: HabitudesMobilite = {
  mode_dominant: 'velo',
  km_propre_semaine: 30,
  km_carbone_semaine: 0,
  modes_secondaires: ['marche', 'transport_public'],
}

const defaultPreferences: PreferencesSensorielles = {
  ambiance_preferee: 'foret',
  binaural_enabled: true,
  haptique_enabled: true,
  voix_aria: 'douce',
}

export function OnboardingFlow({
  defaultName,
  defaultVille,
}: {
  defaultName: string
  defaultVille: string
}) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState<1 | -1>(1)
  const [submitting, setSubmitting] = useState(false)
  const [wow, setWow] = useState<MomentWow | null>(null)

  const [name, setName] = useState(defaultName)
  const [ville, setVille] = useState(defaultVille)
  const [habitudes, setHabitudes] = useState<HabitudesMobilite>(defaultHabitudes)
  const [preferences, setPreferences] = useState<PreferencesSensorielles>(defaultPreferences)
  const [permissions, setPermissions] = useState({
    location: false,
    notifications: false,
    motion_sensors: false,
  })

  function next() {
    setDirection(1)
    setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))
  }

  function back() {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  async function loadWowAndShow() {
    setSubmitting(true)
    try {
      const r = await fetch('/api/vida/wow-moment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ville,
          pays: 'FR',
          habitudes,
        }),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur calcul Moment WOW')
      }
      const data = (await r.json()) as MomentWow
      setWow(data)
      setDirection(1)
      setStep(TOTAL_STEPS - 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec du calcul')
    } finally {
      setSubmitting(false)
    }
  }

  async function finalize() {
    setSubmitting(true)
    const profil: ProfilOnboarding = {
      full_name: name.trim(),
      ville_principale: ville.trim(),
      pays_principal: 'FR',
      habitudes,
      preferences,
      permissions,
    }
    try {
      const r = await fetch('/api/vida/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profil),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur enregistrement onboarding')
      }
      toast.success('Bienvenue dans YATRA 🌿')
      router.replace('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Échec')
      setSubmitting(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh flex flex-col">
        <OnboardingProgress step={step} total={TOTAL_STEPS} />

        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-md">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                initial={{ opacity: 0, x: direction * 30, filter: 'blur(8px)' }}
                animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, x: direction * -30, filter: 'blur(8px)' }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                {step === 0 && <StepName name={name} setName={setName} />}
                {step === 1 && (
                  <StepHabitudes
                    name={name}
                    ville={ville}
                    setVille={setVille}
                    habitudes={habitudes}
                    setHabitudes={setHabitudes}
                  />
                )}
                {step === 2 && <StepPreferences preferences={preferences} setPreferences={setPreferences} />}
                {step === 3 && <StepPermissions permissions={permissions} setPermissions={setPermissions} />}
                {step === 4 && wow && <StepWow wow={wow} name={name} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer nav */}
        <footer className="px-6 pb-8 pt-2 flex items-center justify-between max-w-md mx-auto w-full">
          <button
            onClick={back}
            disabled={step === 0 || submitting || step === TOTAL_STEPS - 1}
            className="flex items-center gap-2 text-sm text-white/55 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ArrowLeft size={16} /> Retour
          </button>

          {step < 3 && (
            <button
              onClick={next}
              disabled={
                submitting ||
                (step === 0 && name.trim().length < 2) ||
                (step === 1 && (ville.trim().length < 2 || habitudes.km_propre_semaine + habitudes.km_carbone_semaine === 0))
              }
              className="btn-primary"
            >
              Continuer <ArrowRight size={16} />
            </button>
          )}

          {step === 3 && (
            <button onClick={loadWowAndShow} disabled={submitting} className="btn-primary">
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Calcul…
                </>
              ) : (
                <>
                  Voir mon Moment WOW <ArrowRight size={16} />
                </>
              )}
            </button>
          )}

          {step === 4 && (
            <button onClick={finalize} disabled={submitting} className="btn-primary">
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Activation…
                </>
              ) : (
                <>
                  Activer mon compte <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </footer>
      </main>
    </>
  )
}
