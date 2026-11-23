'use client'

import { useEffect, useRef, useState } from 'react'
import type { AlertConfig, AlertsData } from '@/lib/vacances/alertes-types'

const REQUEST_TIMEOUT_MS = 15_000

function uniqueConfigs(configs: AlertConfig[]): AlertConfig[] {
  const seen = new Set<string>()
  return configs.filter((config) => {
    if (seen.has(config.id)) return false
    seen.add(config.id)
    return true
  })
}

export function useAlertes(initialData: AlertsData, initialError: string | null) {
  const [configs, setConfigs] = useState(() => uniqueConfigs(initialData.configs))
  const [notifications, setNotifications] = useState(initialData.notifications)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(initialError)
  const [message, setMessage] = useState('')
  const activeOperation = useRef<string | null>(null)
  const controllers = useRef(new Set<AbortController>())
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const activeControllers = controllers.current
    return () => {
      mounted.current = false
      for (const controller of activeControllers) controller.abort()
      activeControllers.clear()
    }
  }, [])

  async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController()
    controllers.current.add(controller)
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(url, { ...options, cache: 'no-store', signal: controller.signal })
      if (response.status === 401) throw new Error('Ta session a expiré. Reconnecte-toi, puis réessaie.')
      const data: unknown = await response.json()
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Réponse inattendue. Actualise les alertes pour réessayer.')
      }
      if (!response.ok) {
        const detail = 'error' in data && typeof data.error === 'string' ? data.error : null
        throw new Error(detail ?? 'Cette opération est momentanément indisponible. Réessaie.')
      }
      return data as T
    } catch (cause) {
      if (controller.signal.aborted) {
        throw new Error('La réponse tarde. Actualise les alertes avant de réessayer.')
      }
      if (cause instanceof SyntaxError) {
        throw new Error('Réponse inattendue. Actualise les alertes pour réessayer.')
      }
      if (cause instanceof TypeError) {
        throw new Error('La connexion a été interrompue. Actualise pour vérifier tes alertes.')
      }
      throw cause
    } finally {
      clearTimeout(timeout)
      controllers.current.delete(controller)
    }
  }

  function begin(operation: string): boolean {
    if (activeOperation.current) return false
    activeOperation.current = operation
    setPending(operation)
    setError(null)
    setMessage('')
    return true
  }

  function finish() {
    activeOperation.current = null
    if (mounted.current) setPending(null)
  }

  function reportError(cause: unknown) {
    if (mounted.current) setError(cause instanceof Error ? cause.message : 'Impossible de terminer cette opération. Réessaie.')
  }

  async function addConfig(depart: string, destination: string, budget: number | null): Promise<boolean> {
    if (!begin('add')) return false
    try {
      const data = await requestJson<{ config: AlertConfig; existing?: boolean }>('/api/vacances/alertes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aeroport_depart: depart.trim(), destination_souhaitee: destination.trim(), budget_max_eur: budget }),
      })
      if (!data.config || typeof data.config.id !== 'string') throw new Error('Alerte non confirmée. Actualise avant de réessayer.')
      if (!mounted.current) return false
      setConfigs((previous) => uniqueConfigs([data.config, ...previous]))
      setMessage(data.existing ? 'Cette alerte est déjà enregistrée.' : 'Alerte enregistrée. Les prochains relevés rechercheront des pistes correspondant à tes critères.')
      return true
    } catch (cause) {
      reportError(cause)
      return false
    } finally {
      finish()
    }
  }

  async function removeConfig(id: string) {
    if (!begin(`delete:${id}`)) return
    try {
      const data = await requestJson<{ ok: boolean }>(`/api/vacances/alertes/${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (data.ok !== true) throw new Error('Suppression non confirmée. Actualise avant de réessayer.')
      if (!mounted.current) return
      setConfigs((previous) => previous.filter((config) => config.id !== id))
      setNotifications((previous) => previous.filter((notification) => notification.config_id !== id))
      setMessage('Alerte supprimée.')
    } catch (cause) {
      reportError(cause)
    } finally {
      finish()
    }
  }

  async function refresh() {
    if (!begin('refresh')) return
    try {
      const data = await requestJson<AlertsData>('/api/vacances/alertes')
      if (!Array.isArray(data.configs) || !Array.isArray(data.notifications)) throw new Error('Données incomplètes. Réessaie dans un instant.')
      if (!mounted.current) return
      setConfigs(uniqueConfigs(data.configs))
      setNotifications(data.notifications)
      setLoadError(null)
      setMessage('Alertes actualisées. Les prix restent à confirmer auprès du vendeur.')
    } catch (cause) {
      reportError(cause)
    } finally {
      finish()
    }
  }

  return { configs, notifications, pending, error, loadError, message, addConfig, removeConfig, refresh }
}
