# YATRA — HANDOFF FINAL

**Date** : 2026-04-25
**Statut** : ✅ TERMINÉ — P1 → P13 livrées et déployées
**Live** : https://yatra.purama.dev (build `915f974` · region iad1 · status `ok`)

---

## 1. État complet du projet

### 1.1 Phases livrées (13/13)

| Phase | Commit | Livrables |
|---|---|---|
| **P1** Structure + Auth + DB | `de9b0eb` | Next.js 16 + React 19 + Tailwind 4 · 15 tables · email + Google OAuth (PKCE) · PWA installable · sitemap + robots · API status + OG Satori · 14 routes 200 OK |
| **P2** VIDA CORE + ADN Mobilité | `2670307` | onboarding 30s 5 écrans · Moment WOW reveal · Fil de Vie timeline · ADN Mobilité radar · score d'humanité |
| **P3** Trips + Score d'Humanité | `2670307` | trip start/end RPC atomique · multiplicateur ancienneté · achievements 15 · streak quotidien |
| **P4** Wallet + Stripe + Withdraw | `2670307` | wallet ledger · withdraw IBAN min 5 € · Stripe webhook 6 events · invoices FA-2026-XXXXXX |
| **P5** Aides éligibles + IA Aria pré | `2670307` | aides DB seedées · matching profile · cron aides-research 6h · contact + faq + aide |
| **P6** Radar gratuit + Achat groupé | `d9b7727` | groupes covoiturage · radar 50 km · split smart |
| **P7** Cashback éthique + Voyages humanitaires | `1102a57` | cashback marchands éthiques · VIDA Asso voyages humanitaires · don retenue source |
| **P8** Ambiance | `52bef57` | 6 modes Three.js + Web Audio binaural Schumann 7.83 Hz · StereoPanner lazy AudioContext · sendBeacon visibility pause |
| **P9** Aria conscience IA | `e264b3f` | identité stricte anti-jailbreak · 7 modes spéciaux · stream SSE · Haiku auto-summary · cri sans conseil · TTS browser · boussole 3 angles |
| **P10** RA radar caméra + Famille + Hors-réseau | `b89cfb6` | radar caméra · 1 user 1 famille MVP · alphabet 32 sans ambiguïté · cron RGPD cleanup-aria · SW whitelist API safe |
| **P11** Sécurité Vivante + Challenges Stake + 4 Rangs | `b8c6281` | Trust Score 0-100 · 6 challenges curés · 4 rangs avantages × multiplicateurs · sécurité communautaire 7 cats |
| **P12** Ambassadeur + Concours + Pub interne | `b9285db` | 8 paliers Bronze→Éternel (10→25 %) · /go/[slug] cookie 30j · CRONs hebdo + mensuel · 5 pools · cross-promo Purama 6 seedés |
| **P13** Espace Pilote + UAT P6-P12 + Mobile Expo | `915f974` | 4 pages admin (KPIs · users · contests · pools) · 19 tests UAT lecture seule · mobile/ scaffold Expo 52 EAS-ready |

### 1.2 Métriques finales

```
Backend       13 migrations · 80+ tables · 25+ RPC atomiques · RLS toutes tables · 3 schemas (yatra, kosha, public)
Web           73 routes (16 ActionCards · 4 admin · 60 API) · PWA installable + offline · Service Worker v2
Auth          email + Google OAuth · @supabase/ssr cookies PKCE · session 30j
Mobile        Expo 52 scaffold prêt EAS build · adapter SecureStore · bundle dev.purama.yatra
CI/CD         Vercel auto-deploy main · UAT weekly cron Sunday 03:00 UTC · Resend alert si rouge
Crons Vercel  4 actifs (aides 6h · cleanup-aria dim 4h · contests-weekly dim 23:59 · contests-monthly 28-31 23:59)
Tests         23 UAT P1-P5 (full.spec.ts) + 19 UAT P6-P12 (p6-p12.spec.ts) = 42 serial
Quality       tsc 0 · build 0 warning · grep TODO/console/any/Lorem 0
```

### 1.3 Migrations Supabase (`supabase/migrations/`)

```
p2_rls_fix.sql                         (P2 RLS profiles + onboarding)
p3_trips.sql                           (trips + achievements + streaks)
p4_wallet.sql                          (wallet + transactions + withdrawals + invoices + RPC)
p5_aides.sql + p5_aides_fix.sql        (aides catalogue + matching)
p6_gratuit_groups.sql                  (groups covoiturage + radar)
p7_cashback_humanitaire.sql            (cashback merchants + voyages humanitaires)
p8_ambient.sql                         (ambient_sessions + recommandation)
p9_aria.sql                            (aria_conversations + aria_messages + summary)
p10_family_radar.sql                   (families + radar GPS + cleanup CRON)
p11_security_challenges.sql            (trust_scores + challenges_stake + safety_reports + 5 RPCs)
p12_ambassadeur_contests.sql           (ambassadeur_profiles + contests_results + pool_balances + 6 RPCs)
p12_ambassadeur_fix.sql                (DROP CASCADE legacy P1 + recreate empty)
```

---

## 2. Actions Tissma post-SASU (TOUTES)

Ces actions requièrent physiquement Tissma (KBIS, CNI Onfido, comptes Apple/Google, signatures). Claude Code ne peut pas les faire seul.

### 2.1 Création SASU PURAMA + Asso PURAMA (BLOQUANT pour le reste)

| Action | Lien | Coût | Délai | Statut |
|---|---|---|---|---|
| Statuts SASU PURAMA — 8 Rue Chapelle 25560 Frasne (ZFRR) | Pappers/Legalstart/expert-comptable | 250-500 € | 7-14j | ⏳ |
| Dépôt capital social SASU (≥1 €) | Banque pro Qonto/Shine/Revolut Business | 0-15 €/mois | 24-72h | ⏳ |
| Immatriculation SASU au RCS Besançon | INPI guichet unique | 60 € | 5-10j | ⏳ |
| KBIS SASU | INPI | 0 € | inclus | ⏳ |
| SIRET + N° TVA intracommunautaire FR | INSEE auto post-RCS | 0 € | 7-15j | ⏳ |
| Statuts Association PURAMA (Solenne DORNIER président) | Service-public.fr déclaration | 0 € | 5-7j | ⏳ |
| RNA + JO publication | Service-public.fr | 44 € | 5j | ⏳ |
| Compte bancaire Asso (séparé SASU) | Crédit Mutuel/Crédit Agricole | 0-10 €/mois | 7j | ⏳ |
| Demande agrément ZFRR Frasne (0 % IS 5 ans) | DGFiP Doubs (formulaire 2065-SD) | 0 € | 30-60j | ⏳ |

### 2.2 Apple Developer Program (iOS App Store)

| Action | Coût | Délai | Note |
|---|---|---|---|
| Créer Apple ID Pro `dev@purama.dev` (à éviter `@gmail` perso pour pro) | 0 € | 10 min | Récup auth via TOTP |
| Apple Developer Program Enrollment SASU | 99 €/an | 24-48h | Requiert KBIS + DUNS Number SASU |
| Demander DUNS Number SASU (gratuit via Apple) | 0 € | 5-10j | Apple intègre la demande au formulaire |
| Récupérer **APPLE_TEAM_ID** (10 caractères) | 0 € | inclus | À reporter dans `mobile/eas.json` + .env |
| Créer App ID `dev.purama.yatra` dans Certificates portal | 0 € | 5 min | Capabilities : Push, Universal Links, HealthKit (V2) |
| Créer App Store Connect listing YATRA | 0 € | 30 min | Title, screenshots 6.7"+5.5", description FR/EN, keywords |
| Récupérer **APP_STORE_CONNECT_KEY_ID** + **ISSUER_ID** + **.p8 file** | 0 € | 10 min | Pour EAS submit non-interactif |
| Créer compte démo App Review (`demo@purama.dev` + password) | 0 € | 5 min | Required par Apple Review |
| Privacy policy URL + Support URL | 0 € | déjà OK | `/privacy` + `/contact` live |

### 2.3 Google Play Console (Android)

| Action | Coût | Délai | Note |
|---|---|---|---|
| Créer compte Google Play Console SASU | 25 $ (one-shot) | 24-48h | Identité vérifiée |
| Créer Service Account GCP avec rôle `Service Account User` | 0 € | 10 min | Pour EAS submit non-interactif |
| Télécharger `google-service-account.json` | 0 € | 5 min | À placer dans `mobile/google-service-account.json` (gitignored) |
| Activer Google Play Android Developer API | 0 € | 5 min | Console GCP > APIs & Services |
| Inviter le service account dans Play Console (Release Manager) | 0 € | 5 min | Settings > API access > Grant access |
| Créer App listing YATRA + Internal testing track | 0 € | 30 min | Screenshots phone+tablet, description, content rating |

### 2.4 Stripe — passage en mode SASU prod

| Action | Coût | Délai | Note |
|---|---|---|---|
| Renseigner SIRET + KBIS dans Stripe dashboard (compte existant déjà live) | 0 € | 15 min | Bascule du compte perso vers entité SASU |
| Confirmer adresse pro 8 Rue Chapelle 25560 Frasne | 0 € | inclus | KYB Stripe |
| Activer Stripe Tax (si CA > 10 K €) | 0,5 % du CA | 24h | Auto-calcul TVA pays UE |
| Activer Stripe Connect (Embedded) — déjà configuré côté code | 0,25 €/transfer | inclus | AccountSession serveur (pas de ca_…) |
| Activer Stripe Climate (1 % CA optionnel) | 1 % opt-in | inclus | Aligné mission Asso |

### 2.5 Treezor — sandbox post-KBIS (pré-Card)

| Action | Coût | Délai | Note |
|---|---|---|---|
| Demande compte sandbox Treezor (KBIS SASU + KYC dirigeant Tissma) | 0 € | 7-14j | Voir `.claude/docs/stripe-karma.md` §27 |
| Récupérer **TREEZOR_CLIENT_ID** + **TREEZOR_CLIENT_SECRET** sandbox | 0 € | inclus | À ajouter dans Vercel env (preview only) |
| Tests E2E KYC Onfido + onboarding Wallet Treezor | 0 € | 1-2j | Pas en prod tant que pas validé sandbox |
| Bascule prod Treezor (post-test sandbox + signature contrat) | 1500-3000 € setup | 30-45j | Frais EME ACPR |

### 2.6 DNS + Mail

| Action | Coût | Délai | Note |
|---|---|---|---|
| `yatra.purama.dev` CNAME Vercel — **DÉJÀ FAIT** ✅ | 0 € | — | A record `cname.vercel-dns.com` |
| Mail pro `contact@purama.dev` + `dev@purama.dev` (Resend domain verified) | 0 € | inclus | Domaine `purama.dev` déjà chez Resend |
| `tissma@purama.dev` super-admin alias | 0 € | 5 min | DNS MX ou Resend forward |
| SPF + DKIM + DMARC sur `purama.dev` | 0 € | 1h propag | Resend assistant |

### 2.7 Monitoring + Backups

| Action | Coût | Délai | Note |
|---|---|---|---|
| Sentry projet `yatra` (org `purama` déjà en place) | 0 € (free tier) | 10 min | DSN à pousser dans Vercel env si Sentry SDK activé |
| BetterStack monitor `https://yatra.purama.dev/api/status` 30s | 0 € (free tier 5 monitors) | 10 min | Alert SMS + email Tissma |
| PostHog projet `yatra` EU cloud | 0 € (free 1M events/mois) | 10 min | NEXT_PUBLIC_POSTHOG_KEY déjà partagé Purama |
| Backup Postgres VPS — déjà configuré côté Hostinger | 0 € | — | docker exec supabase-db pg_dump cron |
| Cron backup S3 weekly (recommandé) | 1-3 €/mois | 1h setup | À ajouter via n8n |

### 2.8 RGPD + Légal (déjà 95 % en place)

| Action | Statut |
|---|---|
| `/mentions-legales` (SASU + Frasne + ZFRR) | ✅ live, à mettre à jour avec SIRET dès immat |
| `/politique-confidentialite` (DPO + RGPD) | ✅ live |
| `/cgv` + `/cgu` | ✅ live |
| Déclaration CNIL DPO | facultatif si <250 employés — ✅ structure prête |
| Cookie banner | ✅ live |
| Article 293 B (franchise TVA) sur factures | ✅ tant que CA SASU < 36 800 € HT |

---

## 3. Checklist deploy production réelle

### 3.1 Pré-deploy (avant chaque release prod)

- [ ] `npm run typecheck` → 0 erreur (actuellement ✅)
- [ ] `npm run build` → 0 warning (actuellement ✅)
- [ ] `grep -rn "TODO\|FIXME\|console\.log\|placeholder\|Lorem\|: any" src/` → 0 (actuellement ✅)
- [ ] `npx playwright test tests/uat/full.spec.ts` → 23/23 ✅
- [ ] `npx playwright test tests/uat/p6-p12.spec.ts` → 19/19 ✅
- [ ] `git status` propre (pas de WIP non commit)
- [ ] `git pull origin main` à jour

### 3.2 Deploy Web (Vercel)

```bash
# Auto-deploy : git push origin main → Vercel build + alias yatra.purama.dev
git push origin main

# Manuel forcé :
vercel --prod --token $VERCEL_TOKEN --yes
vercel alias set <NEW_DEPLOY_URL> yatra.purama.dev --token $VERCEL_TOKEN
```

### 3.3 Smoke post-deploy (5 min)

```bash
# Statut
curl -s https://yatra.purama.dev/api/status | jq
# → {"status":"ok","build":"<sha>","region":"iad1"}

# Routes critiques
for route in / /login /signup /onboarding /dashboard /pricing /privacy /terms; do
  echo -n "$route → "
  curl -s -o /dev/null -w "%{http_code}\n" https://yatra.purama.dev$route
done
# Attendu : 200 200 200 307→login 307→login 200 200 200

# /go/[slug] redirect ambassadeur
curl -s -o /dev/null -w "%{http_code}\n" https://yatra.purama.dev/go/test-final
# → 302

# API publique
curl -s https://yatra.purama.dev/api/challenges/catalog | jq '.length'
# → 6
```

### 3.4 Vérifs Vercel cron

```bash
# Lister crons actifs (4 attendus)
vercel inspect <DEPLOY_ID> --token $VERCEL_TOKEN | grep -A 10 "crons"

# Tester trigger manuel weekly
curl -X POST https://yatra.purama.dev/api/cron/contests-weekly \
  -H "Authorization: Bearer $CRON_SECRET"
```

### 3.5 Mobile (EAS) — quand Apple+Google OK

```bash
cd mobile
# Login EAS (1× par machine)
eas login --token $EXPO_TOKEN

# Premier build iOS (sandbox interne)
eas build --platform ios --profile preview

# Build production iOS + soumission App Store
eas build --platform ios --profile production
eas submit --platform ios --latest

# Build + submit Android
eas build --platform android --profile production
eas submit --platform android --latest

# OTA update (sans review)
eas update --branch production --message "Hotfix X"
```

### 3.6 Rollback immédiat (si incident prod)

```bash
# Lister 10 derniers deploys
vercel ls yatra --token $VERCEL_TOKEN | head -15

# Rollback alias vers deploy stable précédent
vercel alias set <PREVIOUS_DEPLOY_URL> yatra.purama.dev --token $VERCEL_TOKEN

# Si bug DB : revert migration
sshpass -p "$VPS_SSH_PASSWORD" ssh root@72.62.191.111 \
  "docker exec -i supabase-db psql -U postgres -d postgres" < supabase/migrations/<rollback>.sql
```

### 3.7 Activation Treezor + Stripe Connect (post-SASU)

- [ ] KBIS SASU reçu
- [ ] Tissma KYC Onfido validé
- [ ] Treezor sandbox client_id + secret reçus
- [ ] Vercel env `TREEZOR_CLIENT_ID` + `TREEZOR_CLIENT_SECRET` ajoutés via CLI
- [ ] Test flow `/api/treezor/onboard` sandbox
- [ ] Tests E2E carte virtuelle sandbox
- [ ] Bascule prod Treezor signée
- [ ] `TREEZOR_ENV=production` dans Vercel
- [ ] First user activation Card

---

## 4. URLs + IDs (référence permanente)

### 4.1 Production live

| Ressource | URL / ID |
|---|---|
| App live | https://yatra.purama.dev |
| Status endpoint | https://yatra.purama.dev/api/status |
| GitHub repo | https://github.com/puramapro-oss/yatra |
| Vercel project | https://vercel.com/puramapro-oss-projects/yatra |
| Vercel project ID | `prj_tfhRBY14x94K4a3WKPxyhZPQ5RgT` |
| Vercel team ID | `team_dGuJ4PqnSU1uaAHa26kkmKKk` |
| Vercel team slug | `puramapro-oss-projects` |
| Build SHA actuel | `915f974` |
| Region | `iad1` (Washington DC) |

### 4.2 Supabase self-hosted

| Ressource | URL / ID |
|---|---|
| Supabase URL (PostgREST + Auth + Realtime) | https://auth.purama.dev |
| Postgres host | `72.62.191.111` |
| Postgres port | `5432` |
| Postgres user | `postgres` |
| Postgres database | `postgres` |
| Schemas YATRA | `yatra`, `kosha`, `public` |
| Auth callback OAuth | https://auth.purama.dev/auth/v1/callback |
| Allow list redirect | `https://*.purama.dev/**` (GOTRUE_URI_ALLOW_LIST) |
| VPS SSH | `root@72.62.191.111` (Hostinger) |
| VPS provider | Hostinger VPS KVM 4 |

### 4.3 Stripe

| Ressource | Note |
|---|---|
| Mode | LIVE (compte personnel jusqu'à bascule SASU) |
| Compte | `acct_…` (à reporter post-bascule SASU) |
| Webhook endpoint prod | https://yatra.purama.dev/api/stripe/webhook |
| Events activés | checkout.session.completed, customer.subscription.{created,updated,deleted}, invoice.payment_{succeeded,failed}, charge.refunded |
| Whsec | dans Vercel env `STRIPE_WEBHOOK_SECRET` (Encrypted) |
| Stripe Connect | Embedded Components (AccountSession serveur, **PAS** de `STRIPE_CONNECT_CLIENT_ID`) |

### 4.4 Treezor (à venir post-SASU)

| Ressource | URL / ID |
|---|---|
| Sandbox URL | https://sandbox.treezor.com (à confirmer) |
| Production URL | https://treezor.com/api |
| Client ID sandbox | À renseigner dans Vercel env (preview) |
| Client Secret sandbox | À renseigner dans Vercel env (preview) |
| KYC provider | Onfido (intégration Treezor native) |
| Documentation | https://docs.treezor.com |

### 4.5 Vercel env vars actives (24 production, encrypted)

```
NEXT_PUBLIC_APP_NAME              YATRA
NEXT_PUBLIC_APP_SLUG              yatra
NEXT_PUBLIC_APP_SCHEMA            yatra
NEXT_PUBLIC_SITE_URL              https://yatra.purama.dev
NEXT_PUBLIC_DEFAULT_LOCALE        fr
NEXT_PUBLIC_SUPABASE_URL          (auth.purama.dev)
NEXT_PUBLIC_SUPABASE_ANON_KEY     (anon JWT)
SUPABASE_SERVICE_ROLE_KEY         (service role JWT)
POSTGRES_PASSWORD                 (VPS Postgres)
ANTHROPIC_API_KEY                 (Claude)
ANTHROPIC_MODEL_MAIN              claude-sonnet-4-6
ANTHROPIC_MODEL_FAST              claude-haiku-4-5-20251001
ANTHROPIC_MODEL_PRO               claude-opus-4-7
OPENAI_API_KEY                    (fallback)
STRIPE_SECRET_KEY                 (sk_live_…)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_live_…)
GOOGLE_CLIENT_ID                  (OAuth Google)
GOOGLE_CLIENT_SECRET              (OAuth Google)
RESEND_API_KEY                    (re_…)
TAVILY_API_KEY                    (tvly-dev-…)
INSEE_API_KEY                     (Sirene API)
PAPPERS_API_KEY                   (agrégateur juridique)
CRON_SECRET                       (Bearer auth crons)
CASHBACK_WEBHOOK_SECRET           (P7 cashback merchants)
```

### 4.6 Mobile bundle

| Ressource | Valeur |
|---|---|
| Bundle iOS | `dev.purama.yatra` |
| Package Android | `dev.purama.yatra` |
| Universal Links domain | `yatra.purama.dev` |
| AppStore Connect ID | À remplir post-Apple Developer |
| Google Play package | `dev.purama.yatra` |
| EAS project | À créer via `eas init` post-EXPO_TOKEN config |

### 4.7 Monitoring + Analytics (à activer post-deploy stable)

| Service | URL | Statut |
|---|---|---|
| Sentry | https://purama.sentry.io/projects/yatra | ⏳ projet à créer |
| PostHog | https://eu.posthog.com (project YATRA) | ⏳ project key déjà partagé Purama |
| BetterStack | https://uptime.betterstack.com | ⏳ monitor à créer |
| Vercel Analytics | https://vercel.com/puramapro-oss-projects/yatra/analytics | ✅ auto-actif |

### 4.8 Crons Vercel actifs (4)

```
GET  /api/cron/aides-research      0 6 * * *           daily 06:00 UTC
GET  /api/cron/cleanup-aria        0 4 * * 0           Sunday 04:00 UTC (RGPD purge Aria conversations)
POST /api/cron/contests-weekly     59 23 * * 0         Sunday 23:59 UTC (top 10 score 6 % CA)
POST /api/cron/contests-monthly    59 23 28-31 * *     last days 23:59 UTC (10 random pondéré 4 % CA)
```

### 4.9 GitHub Actions

| Workflow | Trigger | Action |
|---|---|---|
| `uat-weekly.yml` | `0 3 * * 0` (Sunday 03:00 UTC) | Run Playwright UAT P1-P5 + P6-P12 contre prod, alert Resend si rouge |

### 4.10 Commits clés (P1 → P13)

```
915f974 docs(P13): handoff final P12→P13 — YATRA TERMINÉ
ce93e76 feat(P13): Espace Pilote + UAT P6-P12 + Mobile Expo scaffold
3dca55e docs(P12): handoff + 11 décisions clés
b9285db fix(P12): bypass middleware on /go/[slug]
1dfe69a feat(P12): Programme Ambassadeur + Concours + Pool Balances
b8c6281 feat(P11): Sécurité Vivante + Challenges Stake + 4 Rangs
b89cfb6 feat(P10): RA radar caméra + Famille + Hors-réseau
e264b3f feat(P9):  Aria conscience IA + 7 modes spéciaux
52bef57 feat(P8):  6 modes ambiance — Three.js + Web Audio binaural
1102a57 feat(P7):  cashback éthique + voyages humanitaires VIDA Assoc
d9b7727 feat(P6):  radar gratuit + achat groupé
2670307 feat(P2-P5): VIDA CORE + Trips + Wallet + Aides
de9b0eb feat(P1):  Structure + Auth + DB + PWA
```

---

## 5. Reprendre le travail (1 commande)

```bash
cd ~/purama/yatra && claude --dangerously-skip-permissions
```

Au prochain démarrage Claude Code lit dans l'ordre :
1. `task_plan.md` (toutes phases ✅)
2. `progress.md` (état exact 374 lignes)
3. `handoff.md` (rapport P1)
4. **`HANDOFF-FINAL.md` (ce fichier — la référence absolue)**
5. `ERRORS.md` + `PATTERNS.md` (apprentissages)

Aucune phase de dev ne reste — uniquement les actions Tissma listées en §2.

---

**🌱 YATRA est née. Elle attend juste son immatriculation pour devenir adulte.**
