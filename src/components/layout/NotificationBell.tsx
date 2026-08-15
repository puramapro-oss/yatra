'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'

export function NotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    async function fetchUnread() {
      try {
        const r = await fetch('/api/notifications')
        if (!r.ok) return
        const data = await r.json()
        setUnread(data.unread ?? 0)
      } catch {
        // silent
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60000) // poll every minute
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/dashboard/notifications"
      className="relative p-2 rounded-xl hover:bg-white/5 transition"
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unread > 0 && (
        <span className="absolute top-1 right-1 bg-emerald-400 text-black text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
