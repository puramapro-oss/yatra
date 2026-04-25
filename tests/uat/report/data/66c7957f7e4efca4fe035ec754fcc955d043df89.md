# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full.spec.ts >> P5 — Aides + Tavily >> UI /dashboard/aides/[slug] : détail + bouton officiel
- Location: tests/uat/full.spec.ts:428:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a[href*="service-public.fr"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('a[href*="service-public.fr"]').first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e5]
      - heading "404" [level=1] [ref=e8]
      - paragraph [ref=e9]: Cette destination n'existe pas — ou plus.
      - link "Retour à l'accueil" [ref=e10] [cursor=pointer]:
        - /url: /
  - region "Notifications alt+T"
  - alert [ref=e11]
  - generic [ref=e14]:
    - img [ref=e15]
    - generic [ref=e17]:
      - paragraph [ref=e18]: On utilise un minimum de cookies — uniquement pour te garder connecté(e) et améliorer ton expérience. Aucun tracking publicitaire, jamais.
      - generic [ref=e19]:
        - button "Accepter" [ref=e20] [cursor=pointer]
        - button "Refuser" [ref=e21] [cursor=pointer]
```

# Test source

```ts
  335 |   test('POST /withdraw bloqué si < 3 trips clean', async ({ page }) => {
  336 |     await loginIfNeeded(page)
  337 |     const cookies = await page.context().cookies()
  338 |     const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  339 | 
  340 |     // IBAN fictif valide algorithm wise: FR1420041010050500013M02606 (exemple test mod-97 valide)
  341 |     const r = await page.request.post(`${BASE}/api/wallet/withdraw`, {
  342 |       headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
  343 |       data: { amount: 5, iban: 'FR1420041010050500013M02606', holder_name: 'UAT User' },
  344 |     })
  345 |     // user de test n'a qu'1 trip clean → 403
  346 |     expect([403, 400]).toContain(r.status())
  347 |     const err = await r.json()
  348 |     expect(err.error).toMatch(/trajet|propre|3|clean/i)
  349 |   })
  350 | 
  351 |   test('UI /dashboard/wallet affiche balance hero + sources', async ({ page }) => {
  352 |     await loginIfNeeded(page)
  353 |     await page.goto(`${BASE}/dashboard/wallet`, { waitUntil: 'networkidle' })
  354 |     const txt = await page.textContent('body')
  355 |     expect(txt).toMatch(/wallet|solde|€|trajets/i)
  356 |     await page.screenshot({ path: 'tests/uat/output/p4-wallet.png', fullPage: true })
  357 |   })
  358 | 
  359 |   test('Multiplicateur ancienneté = 1.0 pour user neuf (0 mois)', async () => {
  360 |     const { data: profile } = await adminSupabase
  361 |       .from('profiles')
  362 |       .select('anciennete_months')
  363 |       .eq('id', user.id)
  364 |       .maybeSingle()
  365 |     // Pour un user neuf, anciennete_months = 0 → ×1
  366 |     expect(Number(profile?.anciennete_months ?? 0)).toBeLessThanOrEqual(1)
  367 |   })
  368 | })
  369 | 
  370 | // ╔══════════════════════════════════════════════════════════════╗
  371 | // ║ P5 — Aides + Tavily + détection ville                        ║
  372 | // ╚══════════════════════════════════════════════════════════════╝
  373 | test.describe('P5 — Aides + Tavily', () => {
  374 |   test('GET /api/aides retourne aides matchées (≥ 5) avec score', async ({ page }) => {
  375 |     await loginIfNeeded(page)
  376 |     const cookies = await page.context().cookies()
  377 |     const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  378 | 
  379 |     const r = await page.request.get(`${BASE}/api/aides?limit=30`, {
  380 |       headers: { Cookie: cookieHeader },
  381 |     })
  382 |     expect(r.ok()).toBeTruthy()
  383 |     const data = await r.json()
  384 |     expect(Array.isArray(data.aides)).toBeTruthy()
  385 |     expect(data.aides.length).toBeGreaterThanOrEqual(5)
  386 | 
  387 |     // Vérif région détectée Paris → IDF
  388 |     expect(data.profile_used.region).toBe('IDF')
  389 | 
  390 |     // Toutes les aides ont un score
  391 |     for (const a of data.aides) {
  392 |       expect(typeof a._score).toBe('number')
  393 |       expect(a._score).toBeGreaterThanOrEqual(20)
  394 |       expect(Array.isArray(a._reasons)).toBeTruthy()
  395 |     }
  396 | 
  397 |     // Au moins 1 aide IDF (Navigo, Vélib, ChèqueMobilité)
  398 |     const idfAides = data.aides.filter((a: { region: string | null }) => a.region === 'IDF')
  399 |     expect(idfAides.length).toBeGreaterThan(0)
  400 |   })
  401 | 
  402 |   test('GET /api/aides?category=transport filtre bien', async ({ page }) => {
  403 |     await loginIfNeeded(page)
  404 |     const cookies = await page.context().cookies()
  405 |     const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ')
  406 | 
  407 |     const r = await page.request.get(`${BASE}/api/aides?category=transport&limit=50`, {
  408 |       headers: { Cookie: cookieHeader },
  409 |     })
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
> 435 |     await expect(officialLink).toBeVisible()
      |                                ^ Error: expect(locator).toBeVisible() failed
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
  510 |     expect(significant).toEqual([])
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