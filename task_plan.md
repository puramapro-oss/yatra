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
