# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full.spec.ts >> Final >> Aucune erreur console critique sur dashboard
- Location: tests/uat/full.spec.ts:497:7

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "pageerror: Minified React error #418; visit https://react.dev/errors/418?args[]=text&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.",
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]: "Y"
        - generic [ref=e6]: YATRA
      - generic [ref=e7]:
        - link "Mon profil" [ref=e8] [cursor=pointer]:
          - /url: /dashboard/profile
          - generic [ref=e9]: 🌱
          - generic [ref=e10]: Explorateur
        - button "Se déconnecter" [ref=e11]:
          - img [ref=e12]
          - generic [ref=e15]: Déconnexion
    - generic [ref=e16]:
      - generic [ref=e17]:
        - paragraph [ref=e18]: Bonsoir Camille 🌙
        - heading "Bienvenue dans YATRA, Camille" [level=1] [ref=e19]
        - paragraph [ref=e20]: Tu viens d'ouvrir un espace où chaque pas, chaque trajet propre, chaque droit activé te rapporte.
      - generic [ref=e21]:
        - link "Wallet 0,77 € 0,77 € gagnés au total" [ref=e22] [cursor=pointer]:
          - /url: /dashboard/wallet
          - img [ref=e24]
          - generic [ref=e27]:
            - paragraph [ref=e28]: Wallet
            - paragraph [ref=e29]: 0,77 €
            - paragraph [ref=e30]: 0,77 € gagnés au total
        - generic [ref=e31]:
          - img [ref=e33]
          - generic [ref=e36]:
            - paragraph [ref=e37]: Vida Credits
            - paragraph [ref=e38]: "0.00"
            - paragraph [ref=e39]: Cumulés sur trajets propres
        - link "Score d'Humanité 0.1 / 10 Niveau d'éveil 1" [ref=e40] [cursor=pointer]:
          - /url: /dashboard/profile
          - img [ref=e42]
          - generic [ref=e48]:
            - paragraph [ref=e49]: Score d'Humanité
            - paragraph [ref=e50]: 0.1 / 10
            - paragraph [ref=e51]: Niveau d'éveil 1
      - generic [ref=e52]:
        - button "Démarrer mon premier trajet On calcule la combinaison la moins chère + la plus propre + la plus apaisante en 3 sec." [ref=e53]:
          - generic [ref=e54]:
            - img [ref=e56]
            - generic [ref=e59]:
              - heading "Démarrer mon premier trajet" [level=3] [ref=e61]
              - paragraph [ref=e62]: On calcule la combinaison la moins chère + la plus propre + la plus apaisante en 3 sec.
        - button "Mes trajets Historique, gains cumulés, CO₂ évité. Toute ta progression mobilité propre." [ref=e63]:
          - generic [ref=e64]:
            - img [ref=e66]
            - generic [ref=e69]:
              - heading "Mes trajets" [level=3] [ref=e71]
              - paragraph [ref=e72]: Historique, gains cumulés, CO₂ évité. Toute ta progression mobilité propre.
        - 'button "Mes droits & aides Radar permanent : aides transport, énergie, logement matchées sur ton profil." [ref=e73]':
          - generic [ref=e74]:
            - img [ref=e76]
            - generic [ref=e79]:
              - heading "Mes droits & aides" [level=3] [ref=e81]
              - paragraph [ref=e82]: "Radar permanent : aides transport, énergie, logement matchées sur ton profil."
      - generic [ref=e83]:
        - heading "Ton compte" [level=2] [ref=e84]
        - generic [ref=e85]:
          - generic [ref=e86]:
            - generic [ref=e87]: Email
            - text: uat-1777135378302-6252@yatra-uat.purama.test
          - generic [ref=e88]:
            - generic [ref=e89]: Plan
            - text: Découverte
          - generic [ref=e90]:
            - generic [ref=e91]: Ancienneté
            - text: 0 mois
          - generic [ref=e92]:
            - generic [ref=e93]: Ville
            - text: Paris
  - region "Notifications alt+T"
  - alert [ref=e94]
  - generic [ref=e97]:
    - img [ref=e98]
    - generic [ref=e100]:
      - paragraph [ref=e101]: On utilise un minimum de cookies — uniquement pour te garder connecté(e) et améliorer ton expérience. Aucun tracking publicitaire, jamais.
      - generic [ref=e102]:
        - button "Accepter" [ref=e103] [cursor=pointer]
        - button "Refuser" [ref=e104] [cursor=pointer]
```

# Test source

```ts
  410 |     const data = await r.json()
  411 |     expect(data.aides.every((a: { category: string }) => a.category === 'transport')).toBeTruthy()
  412 |   })
  413 | 
  414 |   test('UI /dashboard/aides : KPI + filtres + cards', async ({ page }) => {
  415 |     await loginIfNeeded(page)
  416 |     await page.goto(`${BASE}/dashboard/aides`, { waitUntil: 'networkidle' })
  417 |     await page.waitForTimeout(1000)
  418 |     const txt = await page.textContent('body')
  419 |     expect(txt).toMatch(/aide|détecté|potentiel|transport/i)
  420 |     await page.screenshot({ path: 'tests/uat/output/p5-aides-list.png', fullPage: true })
  421 | 
  422 |     // Cliquer sur un filtre catégorie
  423 |     await page.getByRole('button', { name: /transport/i }).first().click().catch(() => null)
  424 |     await page.waitForTimeout(300)
  425 |     await page.screenshot({ path: 'tests/uat/output/p5-aides-transport.png', fullPage: true })
  426 |   })
  427 | 
  428 |   test('UI /dashboard/aides/[slug] : détail + bouton officiel', async ({ page }) => {
  429 |     await loginIfNeeded(page)
  430 |     await page.goto(`${BASE}/dashboard/aides/bonus-velo-2026`, { waitUntil: 'networkidle' })
  431 |     const txt = await page.textContent('body')
  432 |     expect(txt).toMatch(/bonus|vélo|400|prime/i)
  433 |     // Bouton externe officiel
  434 |     const officialLink = page.locator('a[href*="service-public.fr"]').first()
  435 |     await expect(officialLink).toBeVisible()
  436 |     await page.screenshot({ path: 'tests/uat/output/p5-aide-detail.png', fullPage: true })
  437 |   })
  438 | 
  439 |   test('Follow + applied flow', async ({ page }) => {
  440 |     await loginIfNeeded(page)
  441 |     const cookies = await page.context().cookies()
  442 |     const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  443 | 
  444 |     const r1 = await page.request.post(`${BASE}/api/aides/bonus-velo-2026/follow`, {
  445 |       headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  446 |       data: { status: 'following' },
  447 |     })
  448 |     expect(r1.ok()).toBeTruthy()
  449 | 
  450 |     const r2 = await page.request.post(`${BASE}/api/aides/bonus-velo-2026/follow`, {
  451 |       headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  452 |       data: { status: 'applied' },
  453 |     })
  454 |     expect(r2.ok()).toBeTruthy()
  455 | 
  456 |     // Vérif fil_de_vie a aide_followed et aide_applied
  457 |     const { data: events } = await adminSupabase
  458 |       .from('fil_de_vie')
  459 |       .select('event_type')
  460 |       .eq('user_id', user.id)
  461 |       .in('event_type', ['aide_followed', 'aide_applied'])
  462 |     expect((events ?? []).length).toBeGreaterThanOrEqual(2)
  463 | 
  464 |     // Cleanup
  465 |     await page.request.delete(`${BASE}/api/aides/bonus-velo-2026/follow`, {
  466 |       headers: { Cookie: cookieHeader },
  467 |     })
  468 |   })
  469 | 
  470 |   test('CRON Tavily fetch en réel avec Bearer CRON_SECRET', async ({ request }) => {
  471 |     const cronSecret = process.env.CRON_SECRET
  472 |     if (!cronSecret) {
  473 |       test.skip()
  474 |       return
  475 |     }
  476 |     const r = await request.post(`${BASE}/api/cron/aides-research`, {
  477 |       headers: { Authorization: `Bearer ${cronSecret}` },
  478 |     })
  479 |     expect(r.ok()).toBeTruthy()
  480 |     const data = await r.json()
  481 |     expect(data.ok).toBe(true)
  482 |     expect(typeof data.total_inserted).toBe('number')
  483 |     expect(Array.isArray(data.by_query)).toBeTruthy()
  484 |     expect(data.by_query.length).toBe(5)
  485 |   })
  486 | 
  487 |   test('CRON Tavily refuse sans Bearer', async ({ request }) => {
  488 |     const r = await request.post(`${BASE}/api/cron/aides-research`)
  489 |     expect(r.status()).toBe(401)
  490 |   })
  491 | })
  492 | 
  493 | // ╔══════════════════════════════════════════════════════════════╗
  494 | // ║ Final — console errors check                                ║
  495 | // ╚══════════════════════════════════════════════════════════════╝
  496 | test.describe('Final', () => {
  497 |   test('Aucune erreur console critique sur dashboard', async ({ page }) => {
  498 |     consoleErrors = []
  499 |     await loginIfNeeded(page)
  500 |     await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' })
  501 |     await page.waitForTimeout(2000)
  502 | 
  503 |     // Filtre les erreurs cosmétiques (favicon 404, react devtools, network noise transient)
  504 |     const significant = consoleErrors.filter((e) =>
  505 |       !/favicon|devtools|google-analytics|posthog|sentry|net::ERR_BLOCKED|hydration text content/i.test(e),
  506 |     )
  507 |     if (significant.length > 0) {
  508 |       console.log('⚠ Erreurs console restantes:', significant.slice(0, 5))
  509 |     }
> 510 |     expect(significant).toEqual([])
      |                         ^ Error: expect(received).toEqual(expected) // deep equality
  511 |   })
  512 | })
  513 | 
  514 | // Helper : login dans page si pas déjà loggé (pour tests indépendants)
  515 | async function loginIfNeeded(page: Page) {
  516 |   await page.goto(`${BASE}/dashboard`).catch(() => null)
  517 |   if (page.url().includes('/login')) {
  518 |     await page.fill('input[type="email"]', user.email)
  519 |     await page.fill('input[type="password"]', user.password)
  520 |     await page.click('button[type="submit"]')
  521 |     await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15000 })
  522 |   }
  523 | }
  524 | 
```