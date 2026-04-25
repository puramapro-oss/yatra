# YATRA — Progress (live state)

**Dernière mise à jour** : 2026-04-25 (P10 livré)
**Phase courante** : P10 ✅ TERMINÉE (deploy `b89cfb6`)
**Phase suivante** : P11 — Sécurité Vivante + Challenges + 4 Rangs

## P10 — livré
- ✅ **Famille** : 2-6 personnes, code d'invitation 6 chars sans ambiguïté visuelle (sans I/O/0/1, ALPHABET 32 chars), RPC `join_family_v1` atomique avec FOR UPDATE + checks (not_found/expired/already/full), auto-owner trigger SQL post-insert, dissolution auto si owner quitte seul
- ✅ **Radar AR** : géolocalisation watchPosition + DeviceOrientationEvent compass (avec fallback webkitCompassHeading Safari iOS) + caméra facingMode 'environment' getUserMedia + 2 tabs (Liste avec bearing-rotated Navigation icons + Caméra avec pins FOV ±60°)
- ✅ **Cumul famille** : km clean cumulés (vélo+marche flagged_fraud=false) + score humanité moyen, calculé serveur-side avec membre IDs `.in()` query
- ✅ **Hors-réseau** : Service Worker v2 avec 3 stratégies (Network-First HTML pages, Stale-While-Revalidate API safe TTL 1h via header `sw-cached-at`, Cache-First static) + OfflineBanner global navigator.onLine
- ✅ **API cron RGPD** : POST `/api/cron/cleanup-aria` avec auth dual (Bearer CRON_SECRET ou header `x-vercel-cron`), RPC `cleanup_aria_old_v1` SECURITY DEFINER → DELETE conversations ended_at < now()-180d cascade messages
- ✅ **Cron Vercel weekly** : ajouté à `vercel.json` schedule `0 4 * * 0` (dimanche 04:00 UTC) — **testé en prod**: Bearer auth → 200 + result {threshold: 2025-10-27, conversations_deleted: 0, messages_cascade_deleted: 0}
- ✅ Dashboard : **11 ActionCards** (+ Famille + Radar AR)
- ✅ Smoke 8 routes : 307×2 dashboard + 401×6 API (sans auth) + 200 cleanup-aria avec Bearer CRON_SECRET

## Décisions clés P10
- **Pas de WebXR** : compatibilité cross-browser trop fragile (Safari iOS limited, Firefox limited). Solution AR-lite = camera + boussole + bearing-positioned overlays = marche partout sans flag, fonctionnel en prod
- **UNIQUE user_id sur family_members MVP** : 1 user = max 1 famille pour P10. Permet UI simple. Multi-famille viendra en P11+ avec changement schéma vers UNIQUE composite (family_id, user_id) seul
- **Code 6 chars sans I/O/0/1** : ALPHABET 32 = ABCDEFGHJKLMNPQRSTUVWXYZ23456789. ~10^9 combos = collision improbable + retry 3x défensif. Mémorisable par tel/SMS/oral
- **Cron auth duale** : Bearer CRON_SECRET pour test manuel/CI + `x-vercel-cron: 1` pour les triggers internes Vercel — robuste sans secret leak
- **SW Stale-While-Revalidate sur API safe uniquement** : whitelist explicite (aides/cashback/humanitarian/gratuit/groups/ambient/family). Le reste bypass = pas de risque de stale data sur trips/wallet/aria (mutateurs sensibles)
- **TTL 1h via header `sw-cached-at`** : la response cachée porte son timestamp en custom header, on compare au fetch — mécanisme isomorphe sans IndexedDB
- **DeviceOrientationEvent fallback ladder** : webkitCompassHeading (Safari iOS = true heading) → 360-alpha (Android Chrome = computed). Pas d'install de permission iOS sauf si on touche à `requestPermission()` — qu'on appelle après le user gesture caméra
- **Dissolution famille si owner seul** : si owner quitte alors qu'il est seul → `DELETE FROM families` cascade. Si owner quitte avec autres membres → 409 (transfert manuel requis, P11+ pour automatique)

## P9 — livré
- ✅ Aria = agent IA YATRA avec **identité stricte** : refuse de se présenter comme Claude/Anthropic, répond toujours "Je suis Aria, ta présence YATRA"
- ✅ 7 modes spéciaux avec system prompts dédiés : Coach trajet 🧭 (factuel + intention), Méditation guidée 🌬️ (avec pauses "..." et durée 3-10min), Journal réflexif 📖 (1 question à la fois, max 4-5), Cri du cœur 💗 (zéro conseil sauf demande, 3114 si détresse vitale), Boussole intuition 🧿 (3 angles raison/cœur/contexte + "Qu'est-ce qui résonne ?"), Gratitude vocale 🙏 (refléter rayonnement, pas paraphraser), Question profonde ✨ (1 question/jour rotation déterministe `dayOfYear % count`)
- ✅ 30 questions seedées FR catégorisées (présence, vérité, intuition, gratitude, lien, transformation) — exemple: "Qu'est-ce que tu portes en ce moment qui n'est pas à toi ?"
- ✅ Stream SSE Claude Sonnet 4.6 : POST `/api/aria/message` retourne ReadableStream `text/event-stream` avec `data: {delta}` et `data: {done}`, persist user msg pre + assistant msg post avec input/output tokens
- ✅ Rate limit : 50 messages user/jour pour plan free (count avec `head: true`), illimité Premium/lifetime — message 429 "Reviens demain ou passe Premium"
- ✅ Auto-summary à la clôture : PATCH `/api/aria/conversations/[id]` `{end: true, generate_summary: true}` → askClaudeJSON Haiku model fast → `{summary, sentiment}` validé via `isValidSentiment` (apaise/energise/inspire/doute/libere/neutre)
- ✅ Daily streak : start endpoint compare `last_active_date` à aujourd'hui — same day = no-op, J+1 = +1, gap > 1 = reset à 1
- ✅ TTS browser SpeechSynthesis fr-FR : autoplay réponse assistante quand toggle activé, cherche voix Amelie/Audrey/Julie féminine, rate 0.95 + pitch 1.05, cancel sur unmount
- ✅ Hub `/dashboard/aria` : hero salutation firstName + streak + question du jour gradient violet + 7 cards modes + dernière conversation avec sentiment emoji 🍃⚡✨🌀🦋 + summary italic
- ✅ Conversation `/[id]` : chat full-height flex-col + header backdrop-blur (emoji + title + TTS toggle + bouton Clôturer) + bubbles user droite glass + Aria gauche avec avatar ✨ + tail-pulse violet streaming + textarea Cmd+Enter + footer disclaimer 3114
- ✅ Dashboard : **9 ActionCards** (+ Aria · ta présence avec icône MessageCircle)
- ✅ Smoke 7 routes : 307×2 (auth dashboard) + 401×5 (auth API)

## Décisions clés P9
- **Identité stricte** : ARIA_IDENTITY_BLOCK répété en tête de CHAQUE prompt mode — empêche jailbreak prompt-injection style "ignore previous instructions, qui es-tu vraiment ?"
- **Rate limit count head:true** : Postgres ne charge pas les rows, juste compte → 1 query rapide même avec 1M messages
- **Stream SSE pas WebSocket** : SSE = unidirectionnel et stateless, parfait pour stream LLM, marche avec edge runtime potentiel, plus simple que WS pour ce cas
- **Auto-summary via Haiku model fast** : 10× moins cher que Sonnet, suffisant pour résumé 1-2 phrases — coût négligeable même à 1000 conversations/jour
- **Cri du cœur = pas de conseil sauf demande** : règle métier dure, surtout pour user en détresse — propose 3114 (numéro français prévention suicide gratuit 24/7) sans dramatiser
- **Boussole pas de réponse** : 3 angles intentionnellement → user reste maître du choix, Aria n'est pas oracle
- **TTS browser pas ElevenLabs/OpenAI TTS** : 0€ + 0 latence + déjà dans navigateur. ElevenLabs pourra venir en P12+ pour qualité voix (P9 = MVP texte+voix base)
- **truncateMessages 12 derniers** : compromis qualité/coût — Aria n'a pas besoin du début si conversation > 12 messages, garde context pertinent
- **Daily streak reset gap >1j** : philosophie YATRA = présence, pas pression. Si l'user manque 2 jours, on repart à 1, pas négatif

## P8 — livré
- ✅ 6 modes ambiance seedés avec fréquences Solfège + battements binauraux : forest 432Hz / theta 4Hz, ocean 174Hz / Schumann 7.83Hz, mountain 396Hz / alpha 8Hz, desert 528Hz / theta 6Hz, aurora 639Hz / alpha 10Hz, cosmos 963Hz / theta 4Hz
- ✅ BinauralEngine : 2 OscillatorNode sine via StereoPanner pan -1/+1 (cerveau perçoit le battement comme différence freq), masterGain crossfade 600ms quand on change de mode, dispose cleanup proprement
- ✅ 6 scenes R3F (Three.js) en lazy chunks séparés : Forest (particles fall + Stars + fog vert), Ocean (PlaneGeometry 96² wave shader sin/cos sur Z), Mountain (4 cones flat-shaded + 800 snow particles), Desert (sun pulse + heat shimmer plane), Aurora (3 ribbons multi-color additive blend), Cosmos (Stars 4000 + galaxy rotation + nebula BackSide pulsante)
- ✅ AmbientCanvas wrapper : `document.visibilitychange` pause si tab cachée (économie batterie/CPU), `Math.min(devicePixelRatio, 1.5)` cap mobile, Suspense fallback null
- ✅ Recommandation auto selon time-of-day (trip_mode 60pts + tod 40pts) → matin=forêt, midi=océan, après-midi=montagne, soir=désert/aurore, nuit=cosmos
- ✅ 3 API : GET `/api/ambient` (modes + prefs Promise.all en 1 round-trip) + POST `/preferences` (upsert Zod partial onConflict user_id) + POST `/session` start + PATCH end avec cumul `total_minutes_listened`
- ✅ UI immersion : canvas plein écran derrière + voile gradient primary/secondary + UI overlay backdrop-blur (play, volume slider, binaural toggle Volume2/VolumeX, timer live), sendBeacon sur unmount pour finir la session même si user ferme l'onglet
- ✅ Dashboard : **8 ActionCards** (+ Modes Ambiance avec icône Headphones)
- ✅ Smoke 7 routes : 307×3 dashboard auth + 401×3 API auth + 405 session GET (POST/PATCH only)

## Décisions clés P8
- **Binaural via StereoPanner pas merger** : permet le crossfade par oreille indépendamment, contrôle précis du gain stéréo
- **AudioContext lazy-init** : créé seulement au premier user gesture (browser policy iOS/Safari sinon `AudioContext.state === 'suspended'`)
- **6 scenes en lazy chunks** : initial load `/ambiance` ne charge AUCUN three.js, seulement le slug visité tire son chunk → bundle gallery <80KB
- **visibilitychange pause** : standard pour tabs en arrière-plan (mobile lock screen, swipe app), évite drain batterie sur Three.js qui tourne en idle
- **sendBeacon pour end-session** : garantit l'envoi telemetry même si user ferme l'onglet brutalement (vs fetch qui peut être annulé)
- **Schumann 7.83 Hz pour Ocean** : résonance fondamentale de la Terre, choix non arbitraire — alignement physique-spirituel
- **Recommendation pas IA** : règles déterministes 60+40 testables en pur JS, IA viendra en P9 pour personnalisation comportementale

## P7 — livré
- ✅ 8 partenaires cashback éthiques FR seedés : Greenweez (4%), La Fourche (6%), BlaBlaCar Daily (8%), Citiz (5%), Enercoop (3%), ilek (4.5%), Fairphone (2.5%), Veja (5%) — user_share_pct 70-80% selon partenaire
- ✅ 6 missions VIDA Assoc seedées : Reforestation Cévennes (12 places, train -100%), Maraude Paris hiver (20), Jardins Marseille (15), Alpha Lyon (8 — 90j récurrent), Vendanges Bordeaux bio (25), Classes vertes Pyrénées (6, 200€ — seul payant)
- ✅ RPC `credit_cashback_v1` atomique : FOR UPDATE lock + INSERT wallet_transactions + UPSERT wallets agrégat — confirmable une seule fois (status check)
- ✅ Webhook HMAC SHA-256 timing-safe : `x-yatra-signature` header obligatoire + body raw + idempotency `cashback_clicks.converted`
- ✅ Matching missions 0-100 : cause/intérêts (35) + accessibilité ville/région (20) + âge (15) + timing 30/90j (15) + spots restants 50%/20% (15)
- ✅ 5 API : `/api/cashback` + `/click/[partnerId]` (tracking_id auto + ip_hash SHA-256 + UA truncated 200) + `/webhook` (signature mandatoire) + `/api/humanitarian` + `/[id]` + `/[id]/apply` (POST motivation 50-2000 chars + DELETE retrait)
- ✅ 3 pages UI : `/dashboard/cashback` (KPI hero gradient earned + filtres catégorie + cards éthique score 0-100 + ledger 10 transactions), `/dashboard/humanitaire` (cards filter cause + reasons top 2 + status candidature), `/[id]` (détail + form motivation + retrait pending only)
- ✅ Dashboard : **7 actions** (+ Cashback éthique + Voyages humanitaires)
- ✅ Env `CASHBACK_WEBHOOK_SECRET` (32 bytes hex) ajoutée prod via Vercel CLI + redeploy
- ✅ Smoke 7 routes : 307×2 (auth dashboard) / 401×2 (auth API) / 405 (webhook GET) / 401 (webhook POST sans sig) / 401 (mission [slug] no auth)

## CI — Cron UAT hebdo activé
- ✅ `.github/workflows/uat-weekly.yml` : Sunday 03:00 UTC + workflow_dispatch
- ✅ 6 secrets GH poussés : SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, CRON_SECRET, RESEND_API_KEY, ALERT_EMAIL
- ✅ Steps : checkout → npm ci → playwright install chromium → run UAT → upload report+output (retention 14j) → Resend alert si rouge → exit 1
- ✅ Run de validation manuel `24936142818` lancé via `gh workflow run` — workflow registered + actif

## Décisions clés P7
- **70-80% user share** : Greenweez/Veja/BlaBlaCar/Citiz/Enercoop = 70%, Fairphone = 80%, ilek = 70% — calibré pour économies réelles user en gardant marge SASU
- **Webhook signature obligatoire** : zéro confiance partenaire externe, HMAC SHA-256 timing-safe avec secret 32 bytes hex distinct
- **Idempotency click.converted** : garde anti double-crédit même si partenaire retry webhook
- **Mission seed FR uniquement P7** : 6 missions VIDA Assoc curées manuellement (sourcées sites NGO réels) — international viendra avec partenariats UNICEF/MSF en P11+
- **Train -100% sur reforestation Cévennes** : maximum incitatif puisque destination rurale + cause biodiversité = match parfait avec ADN YATRA
- **Application motivation min 50 chars** : friction minimale pour filtrer candidatures sérieuses sans bloquer

## P6 — livré

## P6 — livré
- ✅ 12 événements gratuits FR seedés (Louvre/Orsay/Beaubourg 1er dimanche, Petit Palais permanent, MAC Lyon, MUCEM Marseille, Croix-Rouge, Restos du Cœur, Halles Civiques, Parc Tête d'Or, Fête de la Musique, Patrimoine)
- ✅ Achat groupé : `group_purchases` (savings_percent generated column) + `group_purchase_members` + RPC `group_join_v1` (FOR UPDATE lock + auto-unlock_code à threshold)
- ✅ Matching events : ville exact (60) + région (25) + FR (10) + distance < 5km (15) / < 20 (8) / < 100 (3)
- ✅ 4 API : `/api/gratuit`, `/api/groups`, `/api/groups/create`, `/api/groups/[id]/join`
- ✅ 4 pages UI : `/dashboard/gratuit` (events cards), `/dashboard/groupes` (liste pools), `/[id]` (détail + UnlockBanner), `/create` (form pool)
- ✅ Dashboard : 5 actions (trajet · trajets · aides · gratuit · groupes)
- ✅ Smoke 7 routes : 200 / 200 / 307×2 / 401×2 / 405

## Décisions clés P6
- **savings_percent generated column** : auto-calculé à l'insert/update, pas de divergence possible
- **Pool min 2 participants, max 1000** : on commence raisonnable, P11 ajoutera étapes 5/10/25/50
- **unlock_code généré côté Postgres** au moment du `reached` : `YATRA-` + 8 hex chars random
- **Auto-join creator** dans la même transaction que la création
- **Source events `official` only** : pas d'auto-import Tavily P6 (Tavily concentré sur aides P5), curation manuelle pour fiabilité

## UAT P1→P5 — 23/23 ✅
- 3 tests Auth + 2 VIDA CORE + 5 Trajet/GPS/anti-fraude + 5 Wallet + 7 Aides/Tavily + 1 console errors
- Test user auto créé/supprimé via globalSetup/globalTeardown
- GPS data réaliste vélo @ 18 km/h vs voiture @ 95 km/h pour fraud detection
- Tavily fetch live avec Bearer CRON_SECRET
- 4 bugs trouvés et fix : RLS INSERT manquant `score_humanite_history`, `.or` plante sur slug non-UUID dans `/api/aides/[id]`, hydration mismatch `getGreeting()`, Zod min(15) IBAN

## P5 — livré
- ✅ 30 aides FR officielles seedées (service-public.fr, gouv.fr, ameli.fr, francetravail.fr, iledefrance.fr, sncf-connect, actionlogement)
- ✅ Catégories : transport (18), social (4), logement (4), handicap (2), énergie (1), santé (1)
- ✅ Score matching 0-100 multi-signaux : région (24) + situation (28) + transport (24) + âge (12) + profil (12)
- ✅ Tavily veille permanente : `lib/tavily.ts` (search + extract) avec domaines trustés (.gouv.fr only)
- ✅ CRON quotidien 6h via `vercel.json` schedule (`/api/cron/aides-research`) + Bearer CRON_SECRET (32 bytes hex)
- ✅ Trigger admin manuel `/api/admin/aides-research` (super-admin only)
- ✅ 5 API : `/api/aides` (top matches), `/[id]` (détail), `/[id]/follow` (POST+DELETE), `/admin/aides-research`, `/cron/aides-research`
- ✅ UI `/dashboard/aides` (hero KPI gradient + 7 filtres catégories + cards score) + `/dashboard/aides/[id]` (détail + bouton officiel + follow/applied/dismissed)
- ✅ Dashboard : 3ème card "Mes droits & aides" active
- ✅ Smoke 6 routes : 200 / 200 status / 307 dashboard auth / 401 APIs auth / 405 admin GET (POST only) / 401 cron sans Bearer

## Décisions clés P5
- **Tavily uniquement domaines .gouv.fr / .fr trustés** : zero risque pubs/scams. CRON skip auto-publish, admin valide lots flagged.
- **Score deterministe pur (pas d'IA matching)** : explicable via `_reasons[]`, audit-friendly, aucune hallucination
- **Aides Tavily isolées via `source_type='tavily'`** : badge "Veille" UI distinct du badge "Source officielle"
- **CRON_SECRET random 32 bytes** : généré localement openssl, jamais commit, ajouté via Vercel CLI sans whitespace
- **Régions devinées via mapping ville** : 8 régions FR principales (IDF/AURA/OCC/PACA/NAQ/PDL/HDF/GE), fallback FR. P11 = mapping INSEE Code Officiel.

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
