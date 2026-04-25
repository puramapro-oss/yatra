# YATRA — Handoff P1 → P2

## ✅ P1 LIVRÉ — 2026-04-25

**Production** : https://yatra.purama.dev (200 OK confirmed via curl)
**Status** : https://yatra.purama.dev/api/status → `{"status":"ok","app":"YATRA","version":"0.1.0","build":"de9b0eb","region":"iad1"}`
**Repo** : https://github.com/puramapro-oss/yatra
**Vercel** : https://vercel.com/puramapro-oss-projects/yatra

## 📋 Rapport — YATRA P1 (3h estimé / réalisé)

**FAIT** :
- ✅ Next.js 16 + React 19 + Tailwind 4 + TS strict
- ✅ Supabase self-hosted yatra schema 15 tables RLS triggers achievements
- ✅ Auth email + Google OAuth (PKCE cookies via @supabase/ssr)
- ✅ Background multisensoriel + cinematic intro 3s
- ✅ Pages: accueil app + login + signup + forgot/reset + privacy/terms/legal + offline + 404 + error
- ✅ PWA installable (manifest + sw + icons)
- ✅ Sitemap + robots
- ✅ API status + OG Satori 1200×630
- ✅ GitHub repo + Vercel deploy + domain `yatra.purama.dev`
- ✅ Quality gates : tsc 0 / build 0 / grep TODO/console/any/Lorem = 0
- ✅ 14 routes 200 OK / dashboard 307 → /login (middleware fonctionne)

**RESTE P1** : rien — phase 100 % terminée

**BUGS rencontrés + fix** :
- ❌ `uuid_generate_v4()` cachée par `SET search_path` → ✅ remplacé par `gen_random_uuid()`
- ❌ Stripe apiVersion `2025-09-30.clover` obsolète → ✅ `2026-04-22.dahlia`
- ❌ `docker compose restart rest` ne recharge pas env vars → ✅ `docker compose up -d --force-recreate rest`
- ❌ `kosha` schema absent (KOSHA pas init) bloquait PostgREST → ✅ `CREATE SCHEMA IF NOT EXISTS kosha` (pré-init)
- ❌ Permission denied schema yatra → ✅ GRANT USAGE + ALL TABLES + ALTER DEFAULT PRIVILEGES
- ❌ GitHub PAT obsolète → ✅ `gh` CLI authentifié (déjà loggé puramapro-oss)
- ❌ Push refusé (Stripe live key dans CLAUDE-2.md ligne 40) → ✅ ajouté CLAUDE-2.md+BRIEF.md à .gitignore + git rm --cached + amend

**DEPLOY** :
- URL : https://yatra.purama.dev
- Commit : `de9b0eb`
- Deploy ID : `dpl_DYrscSCiX8Vdow9PmQMR828zUmGh`
- Region : iad1
- 19 env vars Vercel production (toutes Encrypted)

**NEXT** : P2 — VIDA CORE + ADN Mobilité + Onboarding 30s
- Tables : `vida_core_profile`, `fil_de_vie`, `adn_mobilite`, `score_humanite_history` (déjà créées P1.2)
- Pages : `/onboarding` (5 écrans, 30s) + révélation Moment WOW
- API : `/api/vida/onboarding`, `/api/vida/wow-moment`, `/api/vida/fil-de-vie`
- Composants : UniversPersonnel, FilDeVie timeline, ADNMobiliteRadar (Recharts), MomentWowReveal confettis

**LEARNINGS** (à push dans `~/purama/LEARNINGS.md`) :
| 2026-04-25 | YATRA | Pattern SET search_path cache extensions schema → préférer gen_random_uuid() | -30min debug |
| 2026-04-25 | YATRA | Stripe apiVersion bouge tous les 6 mois — laisser TS révéler la version cible | sécurise le typage |
| 2026-04-25 | YATRA | docker compose restart vs up -d --force-recreate : restart NE recharge PAS les env vars du .env | crucial pour PGRST_DB_SCHEMAS |
| 2026-04-25 | YATRA | GitHub secret scanning bloque les pushes contenant des Stripe live keys → ajouter CLAUDE-2.md à .gitignore en P1 | évite blocage déploiement |
| 2026-04-25 | YATRA | Vercel free token ne peut pas scope=Personal Account → utiliser `puramapro-oss-projects` (team) | sinon error |

## Pour relancer P2

```
Continue YATRA → P2 (VIDA CORE + ADN Mobilité + Onboarding 30s + Moment WOW).
Lis task_plan.md, progress.md, handoff.md, ERRORS.md, PATTERNS.md.
Tables P2 déjà créées en P1.2.
```
