'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { NatureBackground } from '@/components/multisensoriel/NatureBackground'
import { toast } from 'sonner'

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export function NotificationList({ notifications: initial }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initial)

  async function markAsRead(id: string) {
    try {
      const r = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
      if (!r.ok) throw new Error('Erreur')
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      toast.success('Notification marquée comme lue')
    } catch {
      toast.error('Erreur')
    }
  }

  return (
    <>
      <NatureBackground />
      <main className="relative z-card min-h-dvh">
        <header className="px-6 py-5 max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition flex items-center gap-1.5">
            <ArrowLeft size={18} />
            <span className="text-sm">Retour</span>
          </Link>
          <h1 className="ml-2 text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Notifications
          </h1>
        </header>

        <div className="px-6 pb-16 max-w-2xl mx-auto space-y-3">
          {notifications.length === 0 && (
            <div className="glass rounded-3xl p-8 text-center text-white/50">
              Aucune notification pour le moment.
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`glass rounded-2xl p-4 flex items-start gap-3 ${n.read ? 'opacity-60' : ''}`}
            >
              <div className="flex-1">
                <div className="font-medium text-sm">{n.title}</div>
                {n.body && <div className="text-xs text-white/60 mt-1">{n.body}</div>}
                <div className="text-[10px] text-white/40 mt-2">
                  {new Date(n.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                {n.type === 'group_threshold_reached' && n.data?.group_id !== undefined && (
                  <Link
                    href={`/dashboard/groupes/${String(n.data.group_id)}`}
                    className="inline-block mt-2 text-xs text-emerald-300 hover:underline"
                  >
                    Voir le pool →
                  </Link>
                )}
              </div>
              {!n.read && (
                <button
                  onClick={() => markAsRead(n.id)}
                  className="p-2 rounded-lg hover:bg-white/10 transition"
                  aria-label="Marquer comme lu"
                >
                  <Check size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
