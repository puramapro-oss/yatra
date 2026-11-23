import type { AlertConfig, AlertDeal, AlertsData } from '../../src/lib/vacances/alertes-types'

const tokyo: AlertConfig = {
  id: 'config-tokyo', aeroport_depart: 'Genève', destination_souhaitee: 'Tokyo', budget_max_eur: 500, actif: true,
}
const rome: AlertConfig = {
  id: 'config-rome', aeroport_depart: 'Paris', destination_souhaitee: 'Rome', budget_max_eur: 300, actif: true,
}
const source: AlertDeal = {
  id: 'deal-tokyo', titre: 'Genève vers Tokyo : une piste publiée',
  url: 'https://example.com/tokyo?utm_source=test&fare=499', extrait: 'Tarif mentionné à vérifier auprès du vendeur.',
  prix_detecte_eur: 499, destination_matched: 'Tokyo', published_date: '2026-11-20T23:30:00Z', created_at: '2026-11-22T09:05:00Z',
}
const unsafe: AlertDeal = { ...source, id: 'deal-unsafe', titre: 'Lien non utilisable', url: 'javascript:alert(1)', prix_detecte_eur: null, published_date: null }
const credentials: AlertDeal = { ...source, id: 'deal-credentials', titre: 'Source avec identifiants', url: 'https://user:password@example.com/rome' }

export const alertsFixture: AlertsData = {
  configs: [tokyo, tokyo, rome],
  notifications: [
    { id: 'notification-1', config_id: tokyo.id, created_at: source.created_at, deal: source },
    { id: 'notification-2', config_id: rome.id, created_at: source.created_at, deal: { ...source, id: 'deal-tokyo-legacy', url: 'https://example.com/tokyo?fare=499&fbclid=legacy' } },
    { id: 'notification-3', config_id: rome.id, created_at: source.created_at, deal: unsafe },
    { id: 'notification-4', config_id: rome.id, created_at: source.created_at, deal: credentials },
    { id: 'notification-null', config_id: rome.id, created_at: source.created_at, deal: null },
  ],
}
