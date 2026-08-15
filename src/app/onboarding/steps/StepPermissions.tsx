'use client'

import { useTranslations } from 'next-intl'
import { Bell, MapPin, Activity } from 'lucide-react'

type PermissionState = {
  location: boolean
  notifications: boolean
  motion_sensors: boolean
}

export function StepPermissions({
  permissions,
  setPermissions,
}: {
  permissions: PermissionState
  setPermissions: (p: PermissionState) => void
}) {
  const t = useTranslations('onboarding')
  async function toggleNotifications() {
    if (permissions.notifications) {
      setPermissions({ ...permissions, notifications: false })
      return
    }
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermissions({ ...permissions, notifications: false })
      return
    }
    const result = await Notification.requestPermission()
    setPermissions({ ...permissions, notifications: result === 'granted' })
  }

  async function toggleLocation() {
    if (permissions.location) {
      setPermissions({ ...permissions, location: false })
      return
    }
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPermissions({ ...permissions, location: false })
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => setPermissions({ ...permissions, location: true }),
      () => setPermissions({ ...permissions, location: false }),
      { timeout: 8000 },
    )
  }

  function toggleMotion() {
    setPermissions({ ...permissions, motion_sensors: !permissions.motion_sensors })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400/80">
          {t('progress', { step: 4, total: 5 })}
        </p>
        <h1
          className="text-3xl md:text-4xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {t('step4.title')}
        </h1>
        <p className="text-sm text-white/55">
          {t('step4.subtitle')}
        </p>
      </div>

      <div className="space-y-3">
        <PermissionCard
          icon={<MapPin size={20} />}
          title={t('step4.location.title')}
          description={t('step4.location.description')}
          enabled={permissions.location}
          onToggle={toggleLocation}
        />
        <PermissionCard
          icon={<Bell size={20} />}
          title={t('step4.notifications.title')}
          description={t('step4.notifications.description')}
          enabled={permissions.notifications}
          onToggle={toggleNotifications}
        />
        <PermissionCard
          icon={<Activity size={20} />}
          title={t('step4.motion.title')}
          description={t('step4.motion.description')}
          enabled={permissions.motion_sensors}
          onToggle={toggleMotion}
        />
      </div>

      <p className="text-xs text-white/35 text-center">
        {t('step4.footer')}
      </p>
    </div>
  )
}

function PermissionCard({
  icon,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left glass rounded-2xl p-4 flex items-start gap-3 transition border ${
        enabled ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-white/10 hover:bg-white/[0.06]'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          enabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/5 text-white/55'
        }`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-white/55 leading-snug mt-0.5">{description}</p>
      </div>
      <span
        className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${
          enabled ? 'bg-emerald-500' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-4' : ''
          }`}
        />
      </span>
    </button>
  )
}
