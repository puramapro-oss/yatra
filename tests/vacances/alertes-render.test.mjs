import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { loadTypedModule } from './module-harness.mjs'

const { alertsFixture } = loadTypedModule('tests/vacances/alertes-ui-fixtures.ts')
const { AlertesView } = loadTypedModule('src/app/dashboard/vacances/alertes/AlertesView.tsx', {
  '@/components/multisensoriel/NatureBackground': { NatureBackground: () => null },
})
const render = (data = alertsFixture, initialError = null) => renderToStaticMarkup(React.createElement(AlertesView, {
  initialConfigs: data.configs, initialNotifications: data.notifications, initialError,
}))

test('rendu réel : déduplication par URL canonique et liens dangereux exclus', () => {
  const html = render()
  assert.equal((html.match(/href="https:\/\/example.com\/tokyo\?fare=499"/g) ?? []).length, 1)
  assert.equal((html.match(/>Genève vers Tokyo : une piste publiée<\/h3>/g) ?? []).length, 1)
  assert.doesNotMatch(html, /href="(?:javascript:|https:\/\/user:password)/)
  assert.doesNotMatch(html, /utm_source=|fbclid=/)
  assert.equal((html.match(/aria-label="Supprimer l’alerte Genève vers Tokyo"/g) ?? []).length, 1)
})

test('rendu réel : prix mentionné, date de source et repérage distincts', () => {
  const html = render()
  assert.match(html, /Prix mentionné/)
  assert.match(html, /Prix non précisé dans la source/)
  assert.match(html, /21 nov\. 2026/)
  assert.match(html, /22 nov\. 2026, 10:05/)
  assert.match(html, /heure de Paris/)
  assert.match(html, /Disponibilité, dates, bagages, taxes et frais à confirmer/)
})

test('rendu réel : trois champs ont un label associé', () => {
  const html = render()
  const ids = [...html.matchAll(/<label[^>]*for="([^"]+)"/g)].map((match) => match[1])
  assert.equal(ids.length, 3)
  assert.equal(new Set(ids).size, 3)
  for (const id of ids) {
    assert.ok(html.includes(`id="${id}"`))
  }
})

test('rendu réel : erreur initiale visible sans faux état de lecture réussie', () => {
  const html = render({ configs: [], notifications: [] }, 'Lecture impossible. Réessaie.')
  assert.match(html, /role="alert"[^>]*>Lecture impossible/)
  assert.doesNotMatch(html, /Aucune piste affichée pour le moment/)
})

test('retrait d’une configuration : source toujours présente pour une autre configuration', () => {
  const html = render({ configs: alertsFixture.configs.filter((c) => c.id !== 'config-tokyo'), notifications: alertsFixture.notifications.filter((n) => n.config_id !== 'config-tokyo') })
  assert.equal((html.match(/href="https:\/\/example.com\/tokyo\?fare=499"/g) ?? []).length, 1)
})
