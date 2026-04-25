'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, RotateCcw, Sparkles, Compass, Users,
  Trophy, Clock, Shield, Banknote,
} from 'lucide-react'
import { formatPrice, formatRelativeDate, ancienneteMultiplier } from '@/lib/utils'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { WithdrawModal } from '@/components/wallet/WithdrawModal'

type Tx = {
  id: string
  type: 'credit' | 'debit' | 'withdrawal' | 'refund'
  amount: number
  balance_after: number | null
  source: string
  description: string | null
  status: string | null
  created_at: string
}

type Withdrawal = {
  id: string
  amount: number
  status: string
  bank_iban_last4: string | null
  requested_at: string
  completed_at: string | null
}

type WalletData =
  | {
      balance: number
      vida_credits: number
      total_earned: number
      total_withdrawn: number
      total_from_trajets: number
      total_from_referrals: number
      total_from_contests: number
      bank_iban_last4: string | null
      bank_holder_name: string | null
    }
  | null

export function WalletView({
  email,
  fullName,
  ancienneteMonths,
  wallet,
  transactions,
  withdrawals,
  cleanTrips,
}: {
  email: string
  fullName: string | null
  ancienneteMonths: number
  wallet: WalletData
  transactions: Tx[]
  withdrawals: Withdrawal[]
  cleanTrips: number
}) {
  const router = useRouter()
  const [showWithdraw, setShowWithdraw] = useState(false)

  const balance = Number(wallet?.balance ?? 0)
  const totalEarned = Number(wallet?.total_earned ?? 0)
  const totalWithdrawn = Number(wallet?.total_withdrawn ?? 0)
  const fromTrajets = Number(wallet?.total_from_trajets ?? 0)
  const fromReferrals = Number(wallet?.total_from_referrals ?? 0)
  const fromContests = Number(wallet?.total_from_contests ?? 0)
  const multiplier = ancienneteMultiplier(Math.min(ancienneteMonths, 12))

  const canWithdraw = balance >= 5 && cleanTrips >= 3
  const pendingWdTotal = withdrawals
    .filter((w) => ['pending', 'pending_admin', 'processing'].includes(w.status))
    .reduce((s, w) => s + Number(w.amount), 0)

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-4xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label="Retour"
            className="text-white/60 hover:text-white transition flex items-center gap-1.5"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Mon Wallet
          </h1>
          <span className="ml-auto text-xs text-white/40 hidden sm:inline">{fullName ?? email}</span>
        </header>

        <div className="px-6 pb-16 max-w-4xl mx-auto space-y-6">
          {/* Balance hero */}
          <section className="glass rounded-3xl p-6 sm:p-8 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-xs uppercase tracking-wider text-white/40">Solde retirable</p>
              <p className="text-5xl sm:text-6xl font-bold gradient-text-aurora" style={{ fontFamily: 'var(--font-display)' }}>
                {formatPrice(balance)}
              </p>
              {pendingWdTotal > 0 && (
                <p className="text-xs text-amber-300/80 mt-2">
                  {formatPrice(pendingWdTotal)} en cours de traitement
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <Mini
                icon={<Sparkles size={14} />}
                label="Vida Credits"
                value={formatPrice(Number(wallet?.vida_credits ?? 0))}
                color="cyan"
              />
              <Mini
                icon={<RotateCcw size={14} />}
                label="Multiplicateur"
                value={`×${multiplier.toFixed(2)}`}
                hint={ancienneteMonths < 12 ? `Cap à 12 mois (${ancienneteMonths} actuels)` : 'Cap atteint'}
                color="violet"
              />
              <Mini
                icon={<Banknote size={14} />}
                label="Total gagné"
                value={formatPrice(totalEarned)}
                color="emerald"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setShowWithdraw(true)}
                disabled={!canWithdraw}
                className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight size={18} /> Retirer en banque
              </button>
              <button
                type="button"
                onClick={() => router.push('/dashboard/trajet')}
                className="px-4 py-3 rounded-xl border border-white/10 hover:border-emerald-400/30 hover:bg-white/5 transition text-sm font-semibold flex items-center gap-2 justify-center flex-1"
              >
                <Compass size={16} /> Gagner plus de crédits
              </button>
            </div>

            {!canWithdraw && (
              <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 text-xs text-white/55 flex items-start gap-2">
                <Shield size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  {balance < 5 && <p>Solde minimum retrait : {formatPrice(5)} (actuel : {formatPrice(balance)})</p>}
                  {cleanTrips < 3 && (
                    <p>
                      {3 - cleanTrips} trajet{3 - cleanTrips > 1 ? 's' : ''} propre
                      {3 - cleanTrips > 1 ? 's' : ''} encore avant ton premier retrait (anti-fraude).
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Sources de gains */}
          <section className="grid sm:grid-cols-3 gap-3">
            <SourceCard icon={<Compass size={16} />} label="Trajets propres" value={fromTrajets} color="emerald" />
            <SourceCard icon={<Users size={16} />} label="Parrainages" value={fromReferrals} color="cyan" />
            <SourceCard icon={<Trophy size={16} />} label="Concours & Tirages" value={fromContests} color="violet" />
          </section>

          {/* Historique transactions */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-white/80 px-1 flex items-center gap-2">
              <Clock size={14} /> Historique récent
            </h2>
            {transactions.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center text-sm text-white/55">
                Aucun mouvement pour l&apos;instant. Commence par un trajet propre 🚲
              </div>
            ) : (
              <ul className="glass rounded-2xl divide-y divide-white/5">
                {transactions.map((t) => (
                  <TxRow key={t.id} tx={t} />
                ))}
              </ul>
            )}
          </section>

          {/* Retraits */}
          {withdrawals.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white/80 px-1 flex items-center gap-2">
                <ArrowUpRight size={14} /> Retraits
              </h2>
              <ul className="glass rounded-2xl divide-y divide-white/5">
                {withdrawals.map((w) => (
                  <WithdrawalRow key={w.id} wd={w} />
                ))}
              </ul>
              <p className="text-[11px] text-white/35 px-1">
                Pré-Treezor : retraits validés manuellement par l&apos;équipe sous 48 h ouvrées.
              </p>
            </section>
          )}

          <div className="text-center text-xs text-white/30 pt-4">
            Total déjà retiré : {formatPrice(totalWithdrawn)}
          </div>
        </div>
      </main>

      {showWithdraw && (
        <WithdrawModal
          maxAmount={balance}
          defaultHolder={wallet?.bank_holder_name ?? fullName ?? ''}
          lastUsedIbanLast4={wallet?.bank_iban_last4 ?? null}
          onClose={() => setShowWithdraw(false)}
          onSuccess={() => {
            setShowWithdraw(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function Mini({
  icon,
  label,
  value,
  hint,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint?: string
  color: 'emerald' | 'cyan' | 'violet'
}) {
  const cls = {
    emerald: 'text-emerald-300 bg-emerald-500/10',
    cyan: 'text-cyan-300 bg-cyan-500/10',
    violet: 'text-violet-300 bg-violet-500/10',
  }[color]
  return (
    <div className="bg-white/3 border border-white/8 rounded-xl p-3">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center ${cls}`}>{icon}</div>
      <p className="text-[10px] uppercase tracking-wider text-white/40 mt-2">{label}</p>
      <p className="text-base font-semibold mt-0.5" style={{ fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
      {hint && <p className="text-[10px] text-white/40 mt-0.5">{hint}</p>}
    </div>
  )
}

function SourceCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'emerald' | 'cyan' | 'violet'
}) {
  const cls = {
    emerald: 'text-emerald-300',
    cyan: 'text-cyan-300',
    violet: 'text-violet-300',
  }[color]
  return (
    <div className="glass rounded-2xl p-4">
      <div className={`flex items-center gap-2 ${cls}`}>{icon} <span className="text-xs uppercase tracking-wider text-white/55">{label}</span></div>
      <p className="text-2xl font-bold mt-2" style={{ fontFamily: 'var(--font-display)' }}>
        {formatPrice(value)}
      </p>
    </div>
  )
}

function TxRow({ tx }: { tx: Tx }) {
  const isCredit = tx.type === 'credit' || tx.type === 'refund'
  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight
  const color = isCredit ? 'text-emerald-400' : 'text-rose-400'
  const sign = isCredit ? '+' : '−'

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight">
          {tx.description ?? labelForSource(tx.source)}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          {formatRelativeDate(tx.created_at)}
          {tx.status && tx.status !== 'completed' && (
            <span className="ml-2 px-1 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[9px] uppercase">
              {labelForStatus(tx.status)}
            </span>
          )}
        </p>
      </div>
      <div className={`text-right ${color}`}>
        <p className="text-sm font-semibold">
          {sign}
          {formatPrice(Math.abs(Number(tx.amount)))}
        </p>
        {tx.balance_after !== null && (
          <p className="text-[10px] text-white/35">→ {formatPrice(Number(tx.balance_after))}</p>
        )}
      </div>
    </li>
  )
}

function WithdrawalRow({ wd }: { wd: Withdrawal }) {
  const colors: Record<string, string> = {
    pending: 'text-white/60 bg-white/5 border-white/10',
    pending_admin: 'text-amber-300 bg-amber-400/10 border-amber-400/30',
    processing: 'text-cyan-300 bg-cyan-400/10 border-cyan-400/30',
    completed: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/30',
    failed: 'text-rose-300 bg-rose-400/10 border-rose-400/30',
  }
  const cls = colors[wd.status] ?? colors.pending

  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-white/55">
        <Banknote size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          IBAN ****{wd.bank_iban_last4 ?? '----'}
        </p>
        <p className="text-[11px] text-white/40 mt-0.5">
          Demandé {formatRelativeDate(wd.requested_at)}
          {wd.completed_at && ` · Versé ${formatRelativeDate(wd.completed_at)}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold">{formatPrice(Number(wd.amount))}</p>
        <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${cls}`}>
          {labelForStatus(wd.status)}
        </span>
      </div>
    </li>
  )
}

function labelForSource(s: string): string {
  switch (s) {
    case 'trip_clean': return 'Trajet propre'
    case 'referral': return 'Parrainage'
    case 'contest': return 'Concours'
    case 'lottery': return 'Tirage au sort'
    case 'redistribution': return 'Redistribution'
    case 'withdrawal': return 'Retrait IBAN'
    case 'manual_admin': return 'Crédit admin'
    case 'mission': return 'Mission'
    default: return s
  }
}

function labelForStatus(s: string): string {
  switch (s) {
    case 'pending': return 'En attente'
    case 'pending_admin': return 'À valider'
    case 'processing': return 'En cours'
    case 'completed': return 'Terminé'
    case 'failed': return 'Échec'
    default: return s
  }
}
