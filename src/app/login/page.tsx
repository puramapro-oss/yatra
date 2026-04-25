'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Lock, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { GoogleButton } from '@/components/auth/GoogleButton'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const { signInWithEmail, signInWithGoogle, user, loading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) router.replace(next)
  }, [user, loading, next, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const { error } = await signInWithEmail(email.trim(), password)
    setSubmitting(false)
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'Identifiants incorrects.' : error.message)
      return
    }
    toast.success('Bon retour ! 🌿')
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
                Bon retour
              </h1>
              <p className="text-sm text-white/55">Connecte-toi pour continuer ton voyage YATRA.</p>
            </div>

            <GoogleButton onClick={handleGoogle} disabled={submitting} label="Continuer avec Google" />

            <div className="flex items-center gap-3 text-xs text-white/40">
              <div className="flex-1 h-px bg-white/10" />
              <span>ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Connexion…
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="flex items-center justify-between text-xs text-white/55">
              <Link href="/forgot-password" className="hover:text-white transition">
                Mot de passe oublié ?
              </Link>
              <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition">
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh flex items-center justify-center text-white/50"><Loader2 className="animate-spin" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
