# YATRA — Progress (live state)

**Dernière mise à jour** : 2026-04-25 (P4 livré)
**Phase courante** : P4 ✅ TERMINÉE (deploy `4dc673c`)
**Phase suivante** : P5 — Radar Aides & Droits Auto + Tavily 24/7

## P4 — livré
- ✅ Wallet sub-PURAMA event-sourcing : RPC atomiques `credit_wallet_v1` (FOR UPDATE lock + INSERT wallet_transactions + UPDATE wallets agrégat) et `request_withdrawal_v1` (vérif solde + 3 inserts en 1 transaction)
- ✅ Validation IBAN mod-97 ISO 13616 100% locale (FR + 30+ pays : DE, ES, BE, IT, NL, PT, …)
- ✅ Multiplicateur ancienneté ×1 → ×2 (cap 12 mois) appliqué automatiquement sur le gain Vida Credits dans `/api/vida/trip/end`
- ✅ 4 API wallet : balance + ledger paginé + demande retrait + historique retraits
- ✅ Anti-fraude retraits : ≥ 5 € + ≥ 3 trips clean validés + 1 seul retrait pending à la fois
- ✅ UI `/dashboard/wallet` : hero balance gradient aurora + multiplicateur ancienneté visible + 3 sources de gains (trajets/parrainages/concours) + ledger 30 derniers mouvements + retraits avec status
- ✅ `WithdrawModal` : validation IBAN live (mod-97) + presets montants + display 4 derniers chiffres + storage sécurisé (jamais l'IBAN complet, juste last4)
- ✅ Dashboard KPI Wallet → cliquable → `/dashboard/wallet`, KPI Score → `/dashboard/profile`
- ✅ Smoke 7 routes wallet : 200 status, 307 dashboard wallet→login, 401 APIs sans auth

## Décisions clés P4
- Sub-wallet interne (pas Treezor) : Treezor sera activé en P11 post-SASU. Architecture event-sourcing compatible plug-and-play.
- RPC atomiques Postgres > triggers : zéro risque de récursion + atomicité garantie + rollback automatique
- IBAN stocké : seuls les 4 derniers chiffres (`bank_iban_last4`). Conformité RGPD + bon UX.
- Anti-multi-account light pré-Treezor : ≥ 3 trips `completed` + 1 retrait pending max. Trust Score complet en P11.
- Retraits status `pending_admin` (validation manuelle 48 h) jusqu'à intégration EME Treezor automatisée.

## P3 — livré
- ✅ Moteur Zéro-Coût : combinator multi-modal (cheapest / cleanest / apaisant / fastest)
- ✅ Routing : OSRM demo gratuit + Mapbox auto-upgrade (token optionnel)
- ✅ Cache routes 7j table `route_cache` (sha256 from-to-profile)
- ✅ GPS live : `navigator.geolocation.watchPosition` + KPI temps réel + anti-bruit < 3m/1s
- ✅ Anti-fraude heuristique : vitesse moyenne/max + téléportation + accélérations brutales + désaccord détecté/déclaré → score 0-100, flag à 60+
- ✅ 6 API routes `/api/vida/trip/*` + `/api/vida/geocode` Nominatim
- ✅ 4 pages UI : /trajet (suggestions), /trajet/active (live), /trajet/[id] (récap), /trajets (historique)
- ✅ Crédit wallet automatique (vida_credits) si non flagged + clean mode
- ✅ Fil de Vie événements `first_clean_trip` / `trip_flagged` (irreversible)
- ✅ 5 partenaires FR seed (SNCF Connect, RATP, BlaBlaCar, Vélib, Vélo'v) status='planned'
- ✅ Smoke 9 routes : 200 / 200 status / 307→login dashboard / 401 trip APIs (auth required)

## Décisions clés P3
- OSRM public demo (router.project-osrm.org) par défaut — gratuit, sans token, suffisant MVP
- Mapbox upgrade transparent si `NEXT_PUBLIC_MAPBOX_TOKEN` ajouté (cache fait gagner 95% des appels)
- Geocoding Nominatim OSM (User-Agent obligatoire conforme Usage Policy)
- ML TF.js anti-fraude → P7 mobile (sensors natifs accéléromètre/gyroscope), heuristique web suffisante
- Trip flagged ≥ 60 → 0 crédit wallet, mais trip enregistré (transparence)
- Géométrie GeoJSON LineString décimée à 200 points max (poids JSONB)

## P2 — livré
- ✅ Onboarding 5 écrans (30 s)
- ✅ Moment WOW : gain mensuel + CO₂ + aides + première action 30 s
- ✅ /dashboard/profile : rang, Score breakdown, ADN radar Recharts, multiplicateur ancienneté, Fil de Vie, Univers Personnel cross-apps
- ✅ 4 API routes /api/vida/* (onboarding, wow-moment, fil-de-vie, score)
- ✅ Dashboard guard : redirect /onboarding si !onboarding_completed
- ✅ Quality gates : tsc 0 + build 0 + grep TODO/console.log/any/Lorem = 0
- ✅ Smoke test routes : / 200 + /onboarding 307→/login + /dashboard/profile 307→/login + /api/vida/* 401 (auth)

## Décisions clés P2
- Barème Vida Credits : marche 0,10€ · vélo 0,15€ · trottinette 0,10€ · transport public 0,05€ · covoit 0,20€ · train 0,05€ par km
- CO₂ évité : ADEME 2024 (vélo 0,193 kg/km vs voiture solo)
- Score d'Humanité : 5 axes pondérés sur 10 (trajets 3 + missions 2 + entraide 2 + régularité 1.5 + ancienneté 1.5)
- Rangs : Explorateur (<3) → Gardien (3-5.5) → Régénérateur (5.5-8) → Légende (≥8)
- Estimation aides P2 : conservative 8 (FR) + 4 (grande ville) ou 2 (autres). P5 fera vraie veille Tavily.


## Live URLs

- Production : https://yatra.purama.dev (200 OK)
- API status : https://yatra.purama.dev/api/status → `{"status":"ok","app":"YATRA"}`
- Vercel inspector : https://vercel.com/puramapro-oss-projects/yatra
- Repo : https://github.com/puramapro-oss/yatra
- Commit : `de9b0eb` feat(P1)

## Routes déployées (smoke test ✅)

| Route | Code | Notes |
|-------|------|-------|
| `/` | 200 | Accueil app + cinematic 3s + nature background |
| `/login` | 200 | Email + Google OAuth |
| `/signup` | 200 | Email + Google + code parrainage |
| `/forgot-password` | 200 | Lien reset email |
| `/reset-password` | 200 | Update password |
| `/privacy` | 200 | RGPD complet |
| `/terms` | 200 | CGU pricing 9.99/8.99/71.93/4.99 anti-churn |
| `/legal` | 200 | Mentions SASU PURAMA Frasne ZFRR |
| `/offline` | 200 | PWA offline fallback |
| `/dashboard` | 307 → /login | Middleware auth OK |
| `/api/status` | 200 | Health endpoint |
| `/manifest.webmanifest` | 200 | PWA manifest |
| `/sitemap.xml` | 200 | SEO sitemap dynamique |
| `/robots.txt` | 200 | SEO |

## Backend / VPS

- Schéma `yatra` exposé via PostgREST (`PGRST_DB_SCHEMAS` mis à jour, container `supabase-rest` recreate force)
- Schéma `kosha` créé vide pour ne pas bloquer PostgREST (KOSHA P1 le complétera)
- 15 tables YATRA + RLS + triggers + 15 achievements seed
- Auto-create profile + wallet + referral_code via trigger sur auth.users insert
- Google OAuth déjà activé sur VPS (vérifié, scope `*.purama.dev/**`)

## Stack & versions

- Next.js **16.2.4** (Turbopack par défaut) ⚠️ middleware deprecated → migrer vers `proxy` plus tard
- React **19.2.4**
- Tailwind **4** (CSS @theme dans globals.css, pas de tailwind.config.js)
- TypeScript strict
- @supabase/ssr (createBrowserClient cookies PKCE, fix appris ERRORS.md)
- Stripe API `2026-04-22.dahlia`

## Quality gates P1

| Gate | État |
|------|------|
| G1 tsc 0 erreur | ✅ |
| G2 build 0 warning | ✅ |
| G3 manuel boutons cliqués | ⏳ tester en human review |
| G4 responsive 375px | ✅ par design |
| G5 loading/error/empty | ✅ ErrorBoundary + sonner |
| G6 nav A→Z | ✅ |
| G7 régression zéro | N/A 1ère phase |
| G8 0 TODO/console.log/any/Lorem | ✅ grep 0 résultat |

## Décisions architecturales appliquées

1. Pricing 1 plan Premium 9.99€/m (8.99€ M1) ou 71.93€/an (5.99 équiv) + 4.99 anti-churn à vie
2. Split CA **50/10/10/30** (BRIEF §6) via Treezor — `lib/constants.ts:REVENUE_SPLIT`
3. Schéma DB **yatra** snake_case isolé, compte unifié auth.users (cross-apps)
4. IA = **Aria** (jamais Claude) — `lib/aria.ts`
5. Modèles : Sonnet 4.6 main / Haiku 4.5 fast / Opus 4.7 pro via env
6. 29 langues prévues (next-intl installé, à activer P2+)
7. Super admin OR : `matiss.frasne@gmail.com` || `tissma@purama.dev`
8. Rang collectif : Explorateur → Gardien → Régénérateur → Légende
9. 6 modes ambiance multisensoriels prêts pour P8
10. PWA installable + offline + manifest + sw

## À fournir avant phases suivantes

| Avant | Var | Source |
|-------|-----|--------|
| P3 | `NEXT_PUBLIC_MAPBOX_TOKEN` | mapbox.com (placeholder en attente) |
| P4 | `TREEZOR_API_KEY` + `TREEZOR_BASE_URL` | sandbox.treezor.com (post-SASU pour prod) |
| P13 | `EXPO_TOKEN` (déjà dans .env.secrets) | OK |

## Notes techniques pour P2

- `useAuth` hook déjà skip TOKEN_REFRESHED + profileIdRef (pattern SUTRA appris)
- DashboardHello est un Server Component qui SSR profile + wallet → rapide
- onboarding_completed à false par défaut → P2 ajoutera redirect si pas onboardé
- intro_seen utilisé par CinematicIntro (1 fois max)
- Aurora background animation respect prefers-reduced-motion
