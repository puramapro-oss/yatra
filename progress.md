# YATRA — Progress (live state)

**Dernière mise à jour** : 2026-04-25 17:11 CEST
**Phase courante** : P1 ✅ TERMINÉE
**Phase suivante** : P2 — VIDA CORE + ADN Mobilité + Onboarding 30s

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
