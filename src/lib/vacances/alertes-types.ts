export type AlertConfig = {
  id: string
  user_id?: string
  aeroport_depart: string
  destination_souhaitee: string
  budget_max_eur: number | null
  actif: boolean
  created_at?: string
}

export type AlertDeal = {
  id: string
  titre: string
  url: string
  extrait: string | null
  prix_detecte_eur: number | null
  destination_matched: string | null
  published_date: string | null
  created_at: string
}

export type AlertNotification = {
  id: string
  config_id: string
  created_at: string
  deal: AlertDeal | null
}

export type AlertsData = { configs: AlertConfig[]; notifications: AlertNotification[] }
