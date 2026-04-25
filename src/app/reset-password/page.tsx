'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('8 caractères minimum.')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Mot de passe mis à jour 🌿')
    router.push('/dashboard')
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh flex items-center justify-center p-6">
        <div className="glass rounded-3xl p-8 sm:p-10 w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Nouveau mot de passe
            </h1>
            <p className="text-sm text-white/55">Choisis un mot de passe d&apos;au moins 8 caractères.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-medium text-white/65 mb-1.5 block">Nouveau mot de passe</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={18} />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm placeholder:text-white/30 focus:border-emerald-400/60 focus:bg-white/8 outline-none transition"
                />
              </div>
            </label>

            <button type="submit" disabled={submitting || !password} className="btn-primary w-full disabled:opacity-50">
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Enregistrement…
                </>
              ) : (
                'Enregistrer'
              )}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
