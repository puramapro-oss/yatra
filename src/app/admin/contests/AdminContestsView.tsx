'use client'

import { useState } from 'react'
import { Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

type Result = {
  id: string
  type: string
  period_start: string
  period_end: string
  total_pool_eur: number
  total_distributed_eur: number
  winners: Array<{ user_id: string; rank: number; amount_eur: number }>
  status: string
  metadata: Record<string, unknown>
  created_at: string
}

export function AdminContestsView({ results }: { results: Result[] }) {
  const [triggeringWeekly, setTriggeringWeekly] = useState(false)
  const [triggeringMonthly, setTriggeringMonthly] = useState(false)
  const [secret, setSecret] = useState('')

  async function trigger(kind: 'weekly' | 'monthly') {
    if (!secret) {
      toast.error('Coller CRON_SECRET pour authentifier')
      return
    }
    if (kind === 'weekly') setTriggeringWeekly(true)
    else setTriggeringMonthly(true)
    try {
      const r = await fetch(`/api/cron/contests-${kind}`, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error ?? 'Erreur')
      toast.success(`${kind} : ${data?.status ?? 'ok'}`)
      setTimeout(() => window.location.reload(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur')
    } finally {
      if (kind === 'weekly') setTriggeringWeekly(false)
      else setTriggeringMonthly(false)
    }
  }

  return (
    <>
      <section className="glass rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold" style={{ fontFamily: 'var(--font-display)' }}>Trigger manuel</h2>
        <input
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="CRON_SECRET (Bearer auth)"
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm font-mono"
        />
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => trigger('weekly')}
            disabled={triggeringWeekly}
            className="btn-primary justify-center"
          >
            {triggeringWeekly ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Weekly performance
          </button>
          <button
            onClick={() => trigger('monthly')}
            disabled={triggeringMonthly}
            className="btn-primary justify-center"
          >
            {triggeringMonthly ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            Monthly lottery
          </button>
        </div>
        <p className="text-xs text-white/45">
          Idempotency : UNIQUE (type, period_start, period_end). Re-trigger = no-op si la période a déjà été process.
        </p>
      </section>

      <section className="glass rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.04] text-white/55 text-xs uppercase tracking-wider">
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Période</th>
              <th className="text-right p-3">Pool</th>
              <th className="text-right p-3">Distribué</th>
              <th className="text-right p-3">Winners</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {results.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-white/45 text-sm">Aucun concours encore.</td>
              </tr>
            ) : (
              results.map((r) => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="p-3 text-xs">{r.type}</td>
                  <td className="p-3 text-xs">{r.period_start} → {r.period_end}</td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(Number(r.total_pool_eur))}</td>
                  <td className="p-3 text-right tabular-nums">{formatPrice(Number(r.total_distributed_eur))}</td>
                  <td className="p-3 text-right">{(r.winners ?? []).length}</td>
                  <td className="p-3 text-xs">{r.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </>
  )
}
