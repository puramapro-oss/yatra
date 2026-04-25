'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Lock, User as UserIcon, Loader2, ArrowLeft, Gift } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { GoogleButton } from '@/components/auth/GoogleButton'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialReferral = searchParams.get('ref') || ''
  const next = searchParams.get('next') || '/dashboard'
  const { signUpWithEmail, signInWithGoogle, user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [referralCode, setReferralCode] = useState(initialReferral)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [user, loading, next, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      toast.error('8 caractères minimum.')
      return
    }
    setSubmitting(true)
    const { error } = await signUpWithEmail(email.trim(), password, fullName.trim(), referralCode.trim().toUpperCase() || undefined)
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Compte créé ! 🌿')
    router.replace(next)
  }

  async function handleGoogle() {
    setSubmitting(true)
    const { error } = await signInWithGoogle(next)
    if (error) {
      toast.error(error.message)
      setSubmitting(false)
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 mb-6 transition"
          >
            <ArrowLeft size={16} /> Retour
          </Link>

          <div className="glass rounded-3xl p-8 sm:p-10 space-y-6">
            <div className="text-center space-y-2">
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Rejoindre YATRA
              </h1>
              <p className="text-sm text-white/55">2 semaines d&apos;essai gratuit, annulation 2 clics.</p>
            </div>

            <GoogleButton onClick={handleGoogle} disabled={submitting} label="Continuer avec Google" />

            <div className="flex items-center gap-3 text-xs text-white/40">
              <div className="flex-1 h-px bg-white/10" />
              <span>ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-xs font-medium text-white/65 mb-1.5 block">Prénom & nom</span>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Camille Martin"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-white/65 mb-1.5 block">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="toi@exemple.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-white/65 mb-1.5 block">Mot de passe</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="8 caractères minimum"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-white/65 mb-1.5 block">
                  Code de parrainage <span className="text-white/35">(optionnel)</span>
                </span>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="ABCD1234"
                    maxLength={12}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition uppercase tracking-wider"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting || !email || !password || !fullName}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Création…
                  </>
                ) : (
                  'Créer mon compte'
                )}
              </button>

              <p className="text-xs text-white/40 text-center pt-1">
                En continuant, tu acceptes les{' '}
                <Link href="/terms" className="underline hover:text-white">CGU</Link>
                {' '}et la{' '}
                <Link href="/privacy" className="underline hover:text-white">Politique de confidentialité</Link>.
              </p>
            </form>

            <div className="text-center text-xs text-white/55">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-white/50"><Loader2 className="animate-spin" /></div>}>
      <SignupForm />
    </Suspense>
  )
}
