'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Copy, Loader2, LogOut, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'

type Family = {
  id: string
  owner_id: string
  name: string
  invite_code: string
  max_members: number
  created_at: string
}

type ProfileLite = {
  full_name: string | null
  score_humanite: number | null
  anciennete_months: number | null
}

type MemberRow = {
  user_id: string
  role: string
  joined_at: string
  profiles: ProfileLite | ProfileLite[]
}

export function FamilleView({
  family,
  members,
  cumul,
  myUserId,
  myRole,
}: {
  family: Family | null
  members: MemberRow[]
  cumul: { km_clean: number; score_avg: number } | null
  myUserId: string
  myRole: string | null
}) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [familyName, setFamilyName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  async function createFamily() {
    if (familyName.trim().length < 2) return
    setCreating(true)
    try {
      const r = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: familyName.trim() }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Famille créée 🎉')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setCreating(false)
    }
  }

  async function joinFamily() {
    const code = inviteCode.trim().toUpperCase()
    if (code.length !== 6) {
      toast.error('Le code doit faire 6 caractères')
      return
    }
    setJoining(true)
    try {
      const r = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_code: code }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success('Bienvenue dans la famille 🌿')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setJoining(false)
    }
  }

  async function leaveFamily() {
    const confirmMsg =
      myRole === 'owner' && members.length === 1
        ? 'Tu es propriétaire et seul membre. La famille sera dissoute. Confirmer ?'
        : 'Quitter cette famille ?'
    if (!confirm(confirmMsg)) return
    setLeaving(true)
    try {
      const r = await fetch('/api/family/leave', { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success(data?.family_dissolved ? 'Famille dissoute' : 'Tu as quitté la famille')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
      setLeaving(false)
    }
  }

  function copyCode() {
    if (!family) return
    navigator.clipboard?.writeText(family.invite_code).then(
      () => toast.success('Code copié ✨'),
      () => toast.error('Impossible de copier'),
    )
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Dashboard</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Famille
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-3xl mx-auto space-y-6">
          {!family ? (
            <>
              <section className="glass rounded-3xl p-6 space-y-3 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                    <Users size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                      Voyager ensemble
                    </h2>
                    <p className="text-sm text-white/65 mt-1">
                      Crée ou rejoins une famille (2 à 6 personnes) pour partager les km clean, le Score d'Humanité et les missions communes.
                    </p>
                  </div>
                </div>
              </section>

              <section className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Créer une famille</h3>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Ex. Tribu Dornier"
                  maxLength={80}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm focus:border-emerald-400/40 focus:outline-none"
                />
                <button
                  onClick={createFamily}
                  disabled={creating || familyName.trim().length < 2}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Créer ma famille
                </button>
              </section>

              <section className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Rejoindre par code</h3>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF"
                  maxLength={6}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-base tracking-[0.4em] text-center font-mono uppercase focus:border-emerald-400/40 focus:outline-none"
                />
                <button
                  onClick={joinFamily}
                  disabled={joining || inviteCode.trim().length !== 6}
                  className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? <Loader2 size={16} className="animate-spin" /> : null}
                  Rejoindre
                </button>
              </section>
            </>
          ) : (
            <>
              {/* Hero famille */}
              <section className="glass rounded-3xl p-6 space-y-4 bg-gradient-to-br from-emerald-500/10 to-violet-500/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/45">Famille</p>
                    <h2 className="text-2xl font-bold mt-0.5 gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                      {family.name}
                    </h2>
                    <p className="text-xs text-white/55 mt-1">
                      {members.length} / {family.max_members} membres · Créée le {new Date(family.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <button
                    onClick={leaveFamily}
                    disabled={leaving}
                    className="text-xs text-white/55 hover:text-red-300 transition flex items-center gap-1 px-2 py-1 rounded border border-white/10"
                  >
                    {leaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    Quitter
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                    <p className="text-xs uppercase tracking-wider text-white/45">Km clean cumulés</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      {cumul?.km_clean.toFixed(1) ?? '0.0'} km
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/5 p-3">
                    <p className="text-xs uppercase tracking-wider text-white/45">Score Humanité moyen</p>
                    <p className="text-2xl font-bold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
                      {cumul?.score_avg.toFixed(1) ?? '0.0'} / 10
                    </p>
                  </div>
                </div>
              </section>

              {/* Code invite */}
              <section className="glass rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/45">Code d'invitation</p>
                    <p className="text-3xl font-bold tracking-[0.3em] mt-1 font-mono" style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                      {family.invite_code}
                    </p>
                  </div>
                  <button
                    onClick={copyCode}
                    className="w-10 h-10 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-center transition"
                    aria-label="Copier le code"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-white/45">Partage ce code à tes proches. Ils pourront rejoindre depuis cette même page.</p>
              </section>

              {/* Membres */}
              <section className="glass rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Membres</h3>
                <ul className="divide-y divide-white/5">
                  {members.map((m) => {
                    const isMe = m.user_id === myUserId
                    const p = (Array.isArray(m.profiles) ? m.profiles[0] : m.profiles) as ProfileLite | undefined
                    return (
                      <li key={m.user_id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {p?.full_name ?? '—'}
                            {isMe && <span className="ml-2 text-xs text-emerald-300">· toi</span>}
                          </p>
                          <p className="text-xs text-white/45">
                            {m.role === 'owner' && '👑 Propriétaire · '}
                            Score {Number(p?.score_humanite ?? 0).toFixed(1)} / 10
                            {p?.anciennete_months != null && ` · ${p.anciennete_months} mois`}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            </>
          )}
        </div>
      </main>
    </>
  )
}
