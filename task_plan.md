# YATRA — Task Plan (P1 → P13)

| Phase | Statut | Notes |
|-------|:------:|-------|
| **P1 — Setup + Auth + Background multisensoriel** | ✅ | Live `yatra.purama.dev` |
| **P2 — VIDA CORE + ADN Mobilité + Onboarding 30s** | ✅ | Onboarding 5 écrans + Moment WOW |
| **P3 — Moteur Zéro-Coût + GPS Tracking + Anti-fraude** | ✅ | OSRM gratuit · Mapbox auto-upgrade · 5 partenaires FR seed |
| **P4 — Wallet sub-PURAMA + Retraits IBAN + Cap 12m** | ✅ | RPC atomiques · IBAN mod-97 · Treezor en P11+ post-SASU |
| **P5 — Radar Aides & Droits Auto + Tavily 24/7** | ✅ | 30 aides FR seedées · CRON quotidien 6h via vercel.json · Score 0-100 multi-signaux |
| P6 — Radar Gratuit + Achat Groupé |  |  |
| P7 — Cashback + Voyages Humanitaires (VIDA Assoc) |  |  |
| P8 — 6 Modes Ambiance + Three.js + Web Audio |  |  |
| P9 — IA Aria Conscience + 7 Modes Spéciaux |  | Anthropic key OK |
| P10 — RA Sensorielle + Hors Réseau + Famille |  |  |
| P11 — Sécurité Vivante + Challenges + 4 Rangs |  |  |
| P12 — Influenceurs + Pub interne + Jeux Concours |  |  |
| P13 — Espace Pilote + Tests + Mobile EAS + Stores |  |  |

## P1 — Détail (terminé 2026-04-25)

- [x] P1.1 Init Next.js 16 + React 19 + Tailwind 4 + deps
- [x] P1.2 Schéma SQL `yatra` + RLS + triggers + 15 achievements seed
- [x] P1.3 Auth flow complet (email + Google OAuth via @supabase/ssr cookies PKCE)
- [x] P1.4 Background multisensoriel (NatureBackground + Cinematic 3s)
- [x] P1.5 Pages publiques (home, login, signup, forgot, reset, privacy, terms, legal, offline, 404, error)
- [x] P1.6 PWA (manifest + sw.js + icons 192/512/SVG/Apple/favicon)
- [x] P1.7 API routes (/api/status + /api/og Satori)
- [x] P1.8 Build/tsc OK + grep TODO/console/any/Lorem = 0
- [x] P1.9 GitHub repo (puramapro-oss/yatra) + Vercel deploy + domain

## P2 — Détail (terminé 2026-04-25)

- [x] P2.1 Types `vida.ts` + `lib/wow.ts` (barème YATRA + CO₂ ADEME) + `lib/score-humanite.ts`
- [x] P2.2 API `/api/vida/onboarding` (Zod), `/api/vida/wow-moment`, `/api/vida/fil-de-vie` (GET/POST), `/api/vida/score`
- [x] P2.3 Onboarding 5 écrans (Name → Habitudes → Préférences → Permissions → Moment WOW + Confetti + AnimatedCounter)
- [x] P2.4 Page `/dashboard/profile` (rang, Score breakdown, ADN radar Recharts, ancienneté ×, Fil de Vie, Univers Personnel cross-apps)
- [x] P2.5 Dashboard guard onboarding + rang badge header + lien profil
- [x] P2.6 Build/tsc OK + grep 0 + commit + push + deploy + smoke test

## P3 — Détail (terminé 2026-04-25)

- [x] P3.1 Migration SQL `transport_partners` + `trips` + `gps_tracks` + `route_cache` + RLS + 5 partenaires FR seed (SNCF, RATP, BlaBlaCar, Vélib, Vélo'v)
- [x] P3.2 `lib/geo.ts` (haversineKm isomorphe) + `lib/routing.ts` server-only (OSRM demo + Mapbox auto-upgrade + cache 7j) + `lib/zero-cost.ts` (combinator multi-modal) + `lib/anti-fraud.ts` (heuristique vitesse/téléportation/accélération) + `lib/geocoding.ts` (Nominatim)
- [x] P3.3 6 API routes : `/api/vida/trip/route` (calcul combinaisons), `/start` (créer trip), `/end` (analyse fraude + crédit wallet + fil_de_vie), `/[id]` (détail), `/api/vida/trips` (liste), `/api/vida/geocode` (Nominatim)
- [x] P3.4 Pages UI : `/dashboard/trajet` (recherche from/to + 3-5 cards combinaisons), `/trajet/active` (live GPS watchPosition + KPI live), `/trajet/[id]` (récap + flagged banner), `/trajets` (historique avec totaux)
- [x] P3.5 Dashboard : bouton "Démarrer mon trajet" actif (ex-disabled P3) + carte Mes trajets
- [x] P3.6 Build/tsc OK + grep 0 + commit + push + deploy + smoke 9 routes

## P4 — Détail (terminé 2026-04-25)

- [x] P4.1 Migration SQL `credit_wallet_v1` + `request_withdrawal_v1` (RPC atomiques avec FOR UPDATE lock + GRANT EXECUTE authenticated) + index perfs
- [x] P4.2 `lib/wallet.ts` (wrappers RPC creditWallet/requestWithdrawal) + `lib/iban.ts` (validation mod-97 ISO 13616, 30+ pays supportés)
- [x] P4.3 `/api/vida/trip/end` mis à jour : applique multiplicateur ancienneté (×1→×2 cap 12m) sur gain + RPC atomique au lieu d'UPDATE direct + log admin si crédit échoue
- [x] P4.4 4 API wallet : GET `/api/wallet` (balance + 10 dernières + retraits pending), `/transactions` (paginé), `/withdrawals` (liste), POST `/withdraw` (validation IBAN + 3 trips clean min + 1 retrait pending max)
- [x] P4.5 UI `/dashboard/wallet` (balance hero gradient + multiplicateur + 3 sources gains + ledger 30 + retraits) + `WithdrawModal` (validation IBAN live + presets + anti-fraude visuel)
- [x] P4.6 Dashboard : KPI Wallet et Score d'Humanité cliquables (Link)
- [x] P4.7 Build/tsc OK + grep 0 + commit + push + deploy + smoke 7 routes wallet

## P5 — Détail (terminé 2026-04-25)

- [x] P5.1 Migration SQL : étend `aides` (slug unique full constraint, category, transport_modes_eligible, source_type, source_url, body_jsonb, popularity_score) + tables `aides_subscriptions` + `aides_user_match` + RLS + 30 aides FR seedées (sources officielles uniquement service-public.fr/gouv.fr/ameli.fr)
- [x] P5.2 `lib/tavily.ts` (search + extract) + `lib/aides-matcher.ts` (score 0-100 : région 24pts + situation 28pts + transport 24pts + âge 12pts + profil 12pts)
- [x] P5.3 5 API : GET `/api/aides` (top match selon profil user), GET `/api/aides/[id]`, POST `/api/aides/[id]/follow` + DELETE, POST `/api/admin/aides-research` (super-admin trigger), GET+POST `/api/cron/aides-research` (Bearer CRON_SECRET)
- [x] P5.4 Vercel Cron via `vercel.json` (`0 6 * * *` quotidien) + génération CRON_SECRET random + ajout via Vercel CLI prod (no leading/trailing whitespace)
- [x] P5.5 UI `/dashboard/aides` (hero KPI potentiel + filtres 7 catégories scroll horizontal + cards score badge + reasons top 3) + `/dashboard/aides/[id]` (hero + bouton "Faire ma demande officielle" + follow/applied/dismissed avec confirmation modal)
- [x] P5.6 Dashboard : 3ème card "Mes droits & aides" actif (P5 → page liste)
- [x] P5.7 Build/tsc OK + grep 0 + commit + push + deploy + smoke 6 routes
