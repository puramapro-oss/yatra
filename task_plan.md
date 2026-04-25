# YATRA — Task Plan (P1 → P13)

| Phase | Statut | Notes |
|-------|:------:|-------|
| **P1 — Setup + Auth + Background multisensoriel** | ✅ | Live `yatra.purama.dev` |
| **P2 — VIDA CORE + ADN Mobilité + Onboarding 30s** | ✅ | Onboarding 5 écrans + Moment WOW |
| **P3 — Moteur Zéro-Coût + GPS Tracking + Anti-fraude** | ✅ | OSRM gratuit · Mapbox auto-upgrade · 5 partenaires FR seed |
| **P4 — Wallet sub-PURAMA + Retraits IBAN + Cap 12m** | ✅ | RPC atomiques · IBAN mod-97 · Treezor en P11+ post-SASU |
| **P5 — Radar Aides & Droits Auto + Tavily 24/7** | ✅ | 30 aides FR seedées · CRON quotidien 6h via vercel.json · Score 0-100 multi-signaux |
| **P6 — Radar Gratuit + Achat Groupé** | ✅ | 12 events FR seedés · RPC group_join_v1 atomique · matching ville Haversine |
| **P7 — Cashback + Voyages Humanitaires (VIDA Assoc)** | ✅ | 8 partenaires éthiques + 6 missions FR · RPC credit_cashback_v1 · webhook HMAC · cron UAT hebdo Resend |
| **P8 — 6 Modes Ambiance + Three.js + Web Audio** | ✅ | 6 modes seedés (forest 432Hz, ocean 174Hz Schumann, mountain 396Hz, desert 528Hz, aurora 639Hz, cosmos 963Hz) · BinauralEngine StereoPanner crossfade · scenes R3F lazy chunks · sendBeacon telemetry |
| **P9 — IA Aria Conscience + 7 Modes Spéciaux** | ✅ | 7 system prompts identité stricte · 30 questions FR seedées · stream SSE Claude Sonnet 4.6 · rate limit 50/jour gratuit · auto-summary Haiku · TTS browser SpeechSynthesis · streak quotidien |
| **P10 — RA Sensorielle + Hors Réseau + Famille** | ✅ | Camera + boussole DeviceOrientationEvent + bearing-FOV pins · families RPC join_family_v1 atomique · SW v2 stale-while-revalidate API · cron RGPD weekly cleanup-aria 180j (validé live) |
| **P11 — Sécurité Vivante + Challenges Stake + 4 Rangs avantages** | ✅ | Trust Score 0-100 · 6 challenge templates (no-car/walk/velo/transport/gratitude/meditation) · 4 rangs ×1/×1.2/×1.5/×2 · safety reports communautaires GPS clusters 50m · 8 API + 3 UI + profile enrichi |
| **P12 — Programme Ambassadeur + Pub interne + Jeux Concours** | ✅ | 8 paliers tier (Bronze→Éternel 10%→25%) · /go/[slug] tracking 30j HttpOnly · 11 API + 3 UI + CrossPromoBanner · CRONs auto contests-weekly dim 23:59 + monthly 28-31 23:59 · 5 pools + 6 cross-promos seed · 16 ActionCards |
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

## UAT P1→P5 — exécuté 2026-04-25 — 23/23 ✅

- [x] Suite Playwright `tests/uat/full.spec.ts` : 23 tests serial (3 P1 + 2 P2 + 5 P3 + 5 P4 + 7 P5 + 1 final)
- [x] User UAT créé/supprimé via globalSetup/globalTeardown
- [x] GPS data réaliste vélo + voiture pour tests fraud detection
- [x] Tavily fetch en réel via Bearer CRON_SECRET → 200 + total_inserted
- [x] Bugs trouvés et fix : RLS `score_humanite_history` INSERT manquant, `.or` aides API plante sur slug non-UUID, hydration mismatch `getGreeting()`
- [x] 14 screenshots capturés (`tests/uat/output/`)

## P6 — Détail (terminé 2026-04-25)

- [x] P6.1 Migration : `gratuit_events` (12 FR seed officiels : Louvre/Orsay/Beaubourg 1er dimanche, Petit Palais, MAC Lyon, MUCEM, Croix-Rouge, Restos du Cœur, Halles Civiques, Tête d'Or, Fête de la Musique, Patrimoine) + `group_purchases` (savings_percent generated column) + `group_purchase_members` + RPC `group_join_v1` atomique (FOR UPDATE + ON CONFLICT) + RLS
- [x] P6.2 `lib/gratuit-matcher.ts` : ranking ville exact (60pts) + région (25) + national (10) + distance Haversine (15/8/3)
- [x] P6.3 4 API : GET `/api/gratuit` (events ranked), GET `/api/groups` (pools open + memberships), POST `/api/groups/create` (creator + auto-join), POST `/api/groups/[id]/join` (RPC atomique avec auto-unlock_code)
- [x] P6.4 UI : `/dashboard/gratuit` (cards events + bouton "M'y rendre" → /trajet), `/dashboard/groupes` (liste + progress bars), `/dashboard/groupes/[id]` (hero + join + UnlockBanner avec code copy), `/dashboard/groupes/create` (form 5/10/25 participants)
- [x] P6.5 Dashboard : 2 nouvelles cards (Radar gratuit, Achats groupés) — total 5 actions
- [x] P6.6 Build/tsc OK + grep 0 + commit + push + deploy + smoke 7 routes

## CI — Cron UAT hebdo (activé 2026-04-25)

- [x] `.github/workflows/uat-weekly.yml` : Sunday 03:00 UTC + workflow_dispatch
- [x] 6 secrets GH poussés : SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, CRON_SECRET, RESEND_API_KEY, ALERT_EMAIL=matiss.frasne@gmail.com
- [x] Steps : checkout → npm ci → playwright install → run UAT → upload report+output (14j) → Resend alert si rouge → exit 1
- [x] Run de validation manuel `24936142818` — workflow registered + actif

## P7 — Détail (terminé 2026-04-25)

- [x] P7.1 Migration `p7_cashback_humanitaire.sql` : `cashback_partners` (8 seed FR éthiques : Greenweez, La Fourche, BlaBlaCar Daily, Citiz, Enercoop, ilek, Fairphone, Veja) + `cashback_clicks` (tracking_id unique + ip_hash SHA-256) + `cashback_transactions` (event-source immuable) + `humanitarian_missions` (6 seed VIDA Assoc : reforestation Cévennes, maraude Paris hiver, jardins Marseille, alpha Lyon, vendanges Bordeaux, classes vertes Pyrénées) + `humanitarian_applications` + RLS toutes tables
- [x] P7.2 RPC `credit_cashback_v1` (SECURITY DEFINER, FOR UPDATE lock, INSERT wallet_transactions + UPDATE wallets agrégat)
- [x] P7.3 `lib/cashback.ts` : creditCashback wrapper RPC + verifyWebhookSignature HMAC SHA-256 timingSafeEqual + computeUserShare avec cap max_cashback_eur
- [x] P7.4 `lib/humanitarian-matcher.ts` : score 0-100 (cause/intérêts 35 + accessibilité 20 + âge 15 + timing 15 + spots 15) avec mapping situations→causes
- [x] P7.5 5 API : GET `/api/cashback` (top partners + filter category) + POST `/api/cashback/click/[partnerId]` (tracking + redirect URL signée) + POST `/api/cashback/webhook` (HMAC verify + idempotency converted + crédit atomique) + GET `/api/humanitarian` (matchées) + GET `/api/humanitarian/[id]` + POST/DELETE `/api/humanitarian/[id]/apply` (motivation min 50 chars + UNIQUE user/mission)
- [x] P7.6 UI : `/dashboard/cashback` (KPI hero earned + filtres catégorie + cards éthique score + ledger 10 derniers + état 4 statuts pending/confirmed/paid/cancelled), `/dashboard/humanitaire` (cards score + filter cause + reasons top 2), `/dashboard/humanitaire/[id]` (hero + form motivation + status badge + DELETE retrait)
- [x] P7.7 Dashboard : 2 nouvelles cards (Cashback éthique, Voyages humanitaires) — total **7 actions**
- [x] P7.8 Env var `CASHBACK_WEBHOOK_SECRET` ajoutée prod via Vercel CLI + redeploy
- [x] P7.9 Build/tsc OK + grep 0 + commit `1102a57` + push + deploy + smoke 7 routes (307/307/401/401/405/401/401)

## P8 — Détail (terminé 2026-04-25)

- [x] P8.1 Migration `p8_ambient.sql` : `ambient_modes` (6 seed : forest 432Hz/4Hz theta, ocean 174Hz/7.83Hz Schumann theta, mountain 396Hz/8Hz alpha, desert 528Hz/6Hz theta, aurora 639Hz/10Hz alpha, cosmos 963Hz/4Hz theta) + `user_ambient_preferences` (last_mode + default_volume + binaural_enabled + total_minutes_listened) + `ambient_sessions` (telemetry trip_id + duration + binaural_played) + RLS toutes tables
- [x] P8.2 `lib/ambient.ts` : timeOfDayNow + recommendMode (trip_mode 60pts + tod 40pts) avec catalogue typed
- [x] P8.3 `lib/binaural.ts` : BinauralEngine class — AudioContext lazy + 2 OscillatorNode sine + StereoPanner pan -1/+1 + masterGain crossfade 600ms + dispose cleanup proper
- [x] P8.4 6 scenes R3F + drei : ForestScene (Stars + 600 particles fall), OceanScene (PlaneGeometry 96×96 wave shader sin/cos), MountainScene (4 cones + 800 snow particles), DesertScene (sun pulse + heat shimmer plane), AuroraScene (3 ribbons additive blend planes), CosmosScene (Stars 4000 + galaxy rotation + nebula sphere BackSide)
- [x] P8.5 `AmbientCanvas` wrapper : 6 lazy imports (chunks séparés) + visibilitychange pause + pixelRatio cap min(devicePixelRatio, 1.5) + suspense fallback null
- [x] P8.6 3 API : GET `/api/ambient` (modes + prefs Promise.all) + POST `/api/ambient/preferences` (Zod partial upsert onConflict user_id) + POST `/api/ambient/session` (start) + PATCH (end avec sendBeacon-friendly + cumul total_minutes_listened)
- [x] P8.7 UI : `/dashboard/ambiance` (gallery glass cards gradient primary/secondary + recommended hero selon time-of-day) + `/[slug]` (canvas plein écran + UI overlay backdrop-blur + play/pause + volume slider + binaural toggle + temps écoulé live + sendBeacon end-session sur unmount)
- [x] P8.8 Dashboard : 1 nouvelle card "Modes Ambiance" — total **8 actions**
- [x] P8.9 Build/tsc OK + grep 0 + commit `52bef57` + push + deploy + smoke 7 routes (307×3 dashboard + 401×3 API + 405 GET session)

## P9 — Détail (terminé 2026-04-25)

- [x] P9.1 Migration `p9_aria.sql` : `aria_conversations` (mode + sentiment + summary + message_count + total_tokens) + `aria_messages` (role check user/assistant/system + input/output_tokens + model) + `aria_daily_questions` (30 seed FR : présence, vérité, intuition, gratitude, lien, transformation) + `aria_user_state` (current_mood + current_intention + daily_streak + last_seen_question_id + last_active_date) + RLS toutes tables + index conversation_id+created_at
- [x] P9.2 `lib/aria.ts` : 7 system prompts (coach_trajet, meditation, journal, cri_du_coeur, boussole, gratitude, question_profonde) avec IDENTITÉ ABSOLUE (jamais Claude/Anthropic → "Je suis Aria, ta présence YATRA") + tone strict (tutoiement, douce, jamais juge, 1-2 emojis max, pas de listes) + ce-que-tu-ne-fais-jamais (pas conseil médical/juridique/financier, 3114 si détresse vitale) + maxTokens par mode (méditation 1500, boussole 800, journal 500) + truncateMessages keepLast 12 + pickDailyQuestionIndex (rotation déterministe `dayOfYear % count`)
- [x] P9.3 5 API : POST `/api/aria/start` (Zod mode + create conv + bump daily_streak J0/J+1 reset si gap >1j + total_conversations) + POST `/api/aria/message` (rate limit 50 user msg/24h pour plan free, illimité Premium/lifetime · stream SSE Claude Sonnet 4.6 · persist user msg pre-stream + assistant msg post-stream avec input/output_tokens · update conversation message_count + total_tokens) + GET `/api/aria/daily-question` (rotation `pickDailyQuestionIndex` + upsert last_seen_question_id+at) + GET `/api/aria/conversations/[id]` (full thread filter ≠ system) + PATCH (end + auto-summary via askClaudeJSON Haiku model fast → {summary, sentiment} avec validation isValidSentiment) + GET `/api/aria/state` (state + last_conv + messages_today count)
- [x] P9.4 UI : `/dashboard/aria` (hero salutation firstName + streak + total_conversations · question du jour gradient violet card · 7 mode buttons grid 2-cols emoji+tagline+loader · dernière conv avec sentiment emoji 🍃⚡✨🌀🦋 + summary italic + lien) + `/[id]` (chat full-height flex-col · header backdrop-blur emoji+title+TTS toggle Volume2/X+Clôturer · bubbles user droite glass + assistant gauche avec avatar ✨ + tail-pulse streaming · textarea Cmd+Enter · footer disclaimer 3114 + ⌘+Enter)
- [x] P9.5 Browser SpeechSynthesis fr-FR : detect voix Amelie/Audrey/Julie féminine, fallback toute fr · cancel sur unmount · rate 0.95 + pitch 1.05
- [x] P9.6 Dashboard : 1 nouvelle card "Aria · ta présence" — total **9 actions**
- [x] P9.7 Build/tsc OK + grep 0 + commit `e264b3f` + push + deploy + smoke 7 routes (307×2 dashboard + 401×5 API)

## P10 — Détail (terminé 2026-04-25)

- [x] P10.1 Migration `p10_family_radar.sql` : `families` (owner_id, invite_code 6 chars UNIQUE, max_members 6, invite_expires_at) + `family_members` (UNIQUE family+user + UNIQUE user_id MVP = max 1 famille par user) + RPC `join_family_v1` atomique (FOR UPDATE families + checks family_not_found/invite_expired/already_in_family/family_full + insert) + RPC `cleanup_aria_old_v1` (DELETE conversations.ended_at < now()-180d cascade messages, retourne counts) + RLS (member-read families, owner-update/delete, self-leave family_members) + auto-add owner trigger AFTER INSERT
- [x] P10.2 `lib/geo.ts` : ajout `computeBearing` (formule trigonométrique standard atan2 sin/cos lat/lon) + `cardinalDirection` (8-points N/NE/E/SE/S/SO/O/NO) + `angleDiff` signé [-180..+180] (utile AR projection)
- [x] P10.3 `lib/family.ts` : `generateInviteCode` 6 chars depuis ALPHABET 32 sans I/O/0/1 (anti-ambiguïté visuelle, ~10^9 combos) + `isValidInviteCode` regex + `formatFamilyName` trim/dedup/cap 80
- [x] P10.4 8 API : GET/POST `/api/family` (POST retry 3x sur collision invite_code · GET cumul km clean Haversine + score moyen membres) + POST `/api/family/join` (RPC + erreurs typées 404/410/409) + POST `/api/family/leave` (dissout famille si owner unique seul, refuse si owner avec autres membres) + GET `/api/radar/nearest?lat&lon&radius_km` (Haversine filter + bearing + cardinal, max 20 pins, sources gratuit_events + transport_partners) + GET/POST `/api/cron/cleanup-aria` (auth Bearer CRON_SECRET OU header x-vercel-cron='1', RPC service_role, retourne counts)
- [x] P10.5 UI `/dashboard/famille` : split état "no family" (créer + rejoindre par code) vs "in family" (hero gradient avec cumul km + score moyen + invite code mono 0.3em + bouton copy navigator.clipboard + members list owner badge 👑)
- [x] P10.6 UI `/dashboard/radar` : dual-tab Liste/Caméra · `geolocation.watchPosition` enableHighAccuracy + maximumAge 5s · `DeviceOrientationEvent` avec fallback `webkitCompassHeading` (Safari iOS) ou `360 - alpha` · `getUserMedia({video: facingMode: 'environment'})` cleanup tracks sur unmount · cards bearing-positioned avec FOV ±60° (pins hors champ filtrés en mode caméra) · Navigation icon rotated par `angleDiff` en mode liste
- [x] P10.7 `OfflineBanner` global dans layout.tsx : `navigator.onLine` watch + listeners online/offline · fixed top z-200 amber/15 backdrop-blur · WifiOff icon
- [x] P10.8 Service Worker v2 (`public/sw.js`) : Network-First HTML (navigation requests) + Stale-While-Revalidate API safe (whitelist 7 endpoints `/api/aides|cashback|humanitarian|gratuit|groups|ambient|family` TTL 1h via header `sw-cached-at`) + Cache-First static (Next.js _next/static + assets) + offline fallback `/offline` page + skipWaiting + clients.claim · 3 caches versionnés `yatra-v2-pages|api|static`
- [x] P10.9 vercel.json : ajout cron weekly `/api/cron/cleanup-aria` schedule `0 4 * * 0` (dimanche 04:00 UTC) — **validé live** : Bearer CRON_SECRET → 200 + threshold ISO + counts (0 conversations à supprimer car aucune n'a >180j encore)
- [x] P10.10 Dashboard : 2 nouvelles cards (Famille + Radar AR) — total **11 actions**
- [x] P10.11 Build/tsc OK + grep 0 + commit `b89cfb6` + push + deploy + smoke 8 routes (307×2 dashboard + 401×6 API + 200 cleanup-aria avec Bearer)

## P11 — Détail (terminé 2026-04-25)

- [x] P11.1 Migration `p11_security_challenges.sql` : `trust_scores` (score 0-100 default 50, agrégat compteurs proofs/audits/reports) + `trust_events` (ledger append-only 11 event types · delta -50..+50) + `challenges_stake` (template_slug, duration 7/30/90, stake 5-200€, status active/completed/failed/frozen, trust_score_at_start) + `challenge_days` (UNIQUE challenge+day_index + UNIQUE challenge+day_date, fraud_score) + `challenge_payouts` (UNIQUE challenge_id, outcome won/lost) + `safety_reports` (7 catégories, 3 sévérités, expires_at 30j, lat/lon NUMERIC(10,6)) + RLS (member-read self, safety_reports authenticated_read+self_write/update) + 4 RPC atomiques `start_challenge_stake_v1` (Trust >=30 + max 1 actif + INSERT N challenge_days préremplis) / `submit_challenge_proof_v1` (FOR UPDATE + fraud_score reject >=60 + bump compteur) / `complete_challenge_v1` (won/lost + insert wallet_transactions atomique si won + trust_event + update trust_scores agrégat) / `report_safety_v1` (anti-spam 5/h + Trust >=20) + RPC `record_trust_event_v1` (event + agrégat compteurs typés)
- [x] P11.2 `lib/trust.ts` : trustLevel 4 paliers (verifie<40, fiable 40-65, reconnu 65-85, pilier ≥85) + recordTrustEvent service-role wrapper · TRUST_DELTAS map · 3 thresholds (STAKE 30, REPORT 20, CASH 40) | `lib/rangs.ts` : RANG_MULTIPLIERS ×1/×1.2/×1.5/×2 + RANG_AVANTAGES (challenge_max_stake_eur 25/50/100/200 + 4-5 features par rang) + nextRang seuil progression | `lib/challenges.ts` : 6 templates curés (no-car-7d, walk-30d, velo-90d, transport-public-30d, gratitude-7d, meditation-30d) avec validation paramètres (stake_min/max + required_modes) + computeProgress (extrapolation linéaire on_track) | `lib/safety.ts` : 7 catégories + 3 sévérités + clusterReports (radius 50m + barycentre + max severity + dedupe categories)
- [x] P11.3 `/api/vida/trip/end` : multiplicateur rang appliqué en plus ancienneté (gain_credits = base × multi_anciennete × multi_rang) · recordTrustEvent proof_ok/proof_failed sur chaque trip · response étend multiplier_anciennete + multiplier_rang + multiplier_total + rang. `/api/wallet/withdraw` : nouveau gate Trust >=40 retourne 403 avec score actuel + threshold (anti-multi-account renforcé pré-Treezor)
- [x] P11.4 8 API : GET `/api/challenges/catalog` (force-static, 6 templates) + GET/POST `/api/challenges/stake` (POST cap mise selon rang + reward bonifié × multiplicateur · GET liste challenges 50 + payouts 20) + GET `/api/challenges/stake/[id]` (challenge + days + payout + computeProgress) + POST `/api/challenges/stake/[id]/proof` (validation par template proof_type — trip_clean check status/declared_mode/distance/date · photo_code requires code · self_declared note libre · fraud_score auto remonte) + POST `/api/challenges/stake/[id]/complete` (RPC, erreurs too_early/already_complete) + POST `/api/safety/report` (Zod + RPC + 429 too_many + 403 trust_too_low) + GET `/api/safety/zones?lat&lon&radius_km` (bbox filter + clusterReports + max 500 reports) + GET `/api/trust` (state + 10 derniers events + level computed)
- [x] P11.5 UI `/dashboard/challenges` (hero Trust Score + cap rang/multi · challenge actif inline avec progress bar + lien continuer · catalogue 6 templates filtrés selon stakeCap rang · form mise avec range min/max + hints) + `/dashboard/challenges/[id]` (hero mise/récompense + progress on_track + days_remaining · payout banner si terminé · bouton clôturer si end_date passé · form preuve adapté proof_type — UUID trip OU code OU note libre · timeline grid 7-10 cols cases ✅/❌/aujourd'hui/à venir avec Check/X icons) + `/dashboard/safety` (geolocation getCurrentPosition + zones autour 5km clusters severity-colored badges count · form 7 catégories grid 2-cols + 3 severities buttons + textarea + submit · liste mes signalements 20 derniers avec category emoji + severity badge + expires)
- [x] P11.5bis Profile enrichi : Trust Score card glass (score /100 + barre progressive emerald→violet + label level + compteurs proofs OK/rejects + hint thresholds 30/40) + Avantages rang card (multiplier_label gradient + 4 features ✓ + prochain rang restants) + Multiplicateur total combiné = ancienneté × rang
- [x] P11.6 Dashboard : 2 nouvelles cards (Challenges Stake icon Shield + Sécurité Vivante icon ShieldAlert) — total **13 actions**
- [x] P11.7 Build/tsc OK + grep 0 (placeholder = HTML attrs uniquement) + commit `b8c6281` + push + deploy `yatra-h123jdqmm` + alias `yatra.purama.dev` + smoke 10 routes (307×4 dashboard + 200 catalog + 401×3 API + 405×2 GET sur POST-only)
