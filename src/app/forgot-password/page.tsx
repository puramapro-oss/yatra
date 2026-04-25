'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const { error } = await resetPassword(email.trim())
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    setSent(true)
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 mb-6 transition"
          >
            <ArrowLeft size={16} /> Connexion
          </Link>

          <div className="glass rounded-3xl p-8 sm:p-10 space-y-6">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="text-emerald-400" size={32} />
                </div>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                  Email envoyé
                </h1>
                <p className="text-sm text-white/65 leading-relaxed">
                  Si un compte existe avec <strong className="text-white">{email}</strong>, tu vas recevoir un lien pour
                  réinitialiser ton mot de passe d&apos;ici quelques minutes.
                </p>
                <p className="text-xs text-white/40">
                  Pense à vérifier tes spams. Toujours rien dans 5 min ? Recommence.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Mot de passe oublié
                  </h1>
                  <p className="text-sm text-white/55">On t&apos;envoie un lien pour le réinitialiser.</p>
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

                  <button
                    type="submit"
                    disabled={submitting || !email}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Envoi…
                      </>
                    ) : (
                      'Envoyer le lien'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
