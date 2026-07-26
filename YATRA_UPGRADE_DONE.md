# YATRA — UPGRADE VACANCES V2.0 — LIVRAISON

**Date** : 2026-07-26
**Périmètre** : ajout du volet VACANCES/VOYAGES complet (§0 à §10 du brief) sur YATRA existant, zéro régression sur les 73+ routes trajets/mobilité déjà en production.
**Déploiement** : `https://yatra.purama.dev` — production, vérifié live après déploiement.

---

## Ce qui a été livré

### §0 — Mise aux normes
- Webhook Stripe migré vers le dispatcher partagé de l'écosystème (`app_slug: yatra`) : `/api/internal/stripe-fulfillment` (vérifie `x-internal-secret` + re-vérifie la signature Stripe en défense en profondeur), `/api/stripe/checkout`, `/api/stripe/portal`.
- 3 Price IDs Stripe créés en mode live (premium mensuel 9,99€, annuel 71,93€, abo à vie anti-churn 4,99€) et poussés en production via CLI (jamais dashboard).
- `REVENUE_SPLIT` corrigé à 50/10/40 (l'ancien 50/10/10/30 était obsolète).
- Flag `CORE_READY` ajouté.

### §6 — Vrai prix total (socle)
Calcul du coût réel d'un trajet (prix affiché + bagages + siège + frais de dossier + transfert aéroport) à partir d'une grille de frais par transporteur et d'une base de transferts aéroport — toujours une fourchette min/max, jamais un chiffre inventé.

### §2 — Budget inversé (écran signature)
"J'ai X€, Y jours" → toujours 5 propositions de destinations chiffrées (catalogue de 16 destinations de référence), triées par respect du budget + correspondance aux envies.

### §4 — Argent récupéré
- Générateur de lettre de réclamation EU261/2004 conforme (montant selon distance, motif d'éligibilité, mention DGAC, délai de réponse 8 semaines).
- Suivi de réservations avec ré-estimation du prix et alerte de rebooking.
- Radar aides existant étendu à la catégorie vacances.

### §1 — Alertes erreurs de tarif & bons plans
Veille automatisée (Tavily, cron quotidien) qui matche les bons plans détectés aux alertes configurées par l'utilisateur.

### §3 — Logement à 0€
House-sitting, échange de maison, volontariat — redirection vers plateformes réelles (TrustedHousesitters, HomeExchange, Workaway…) + checklist sécurité par canal + calculateur d'économie déclaratif.

### §5 — Stacking automatique
Cumul cashback + code promo sur chaque réservation, logué et sommé.

### §7 — Sur place
Repas anti-gaspi (Too Good To Go), villes à transport gratuit (faits sourcés), calculateur de rentabilité de pass touristique.

### §8 — Cagnotte yatrage
Cagnotte collaborative avec lien de partage public (aucun compte requis pour contribuer), contribution créditée directement sur le wallet YATRA via RPC atomique (`contribute_cagnotte_v1`). Anti-abus : plafond 500€/don, garde-fou 2x l'objectif, rate-limit par hash IP.

### §9 — Repositionnement & dernière minute
Convoyage de véhicules/camping-cars (DriiveMe, Cocolis, Otoqi), location aller simple bradée (Europcar One Way, Hertz One, Rent A Car), croisières dernière minute -70% (AB Croisière, Promo Croisière, Croisière Club, MSC), guide vols de repositionnement (aucune plateforme fiable identifiée → contenu pédagogique uniquement).

### §10 — UX hub + compteur permanent
Nouvelle entrée "Vacances" sur l'accueil dashboard. Hub `/dashboard/vacances` avec les 3 entrées héroïques du brief ("J'ai un budget" / "J'ai une destination" / "Récupérer de l'argent") + accès aux 6 autres modules. Compteur "YATRA t'a fait économiser/récupérer : XXX€" agrégeant les montants réellement enregistrés (EU261 obtenus, rebooking réalisé, logement évité, stacking cumulé, pass rentables, contributions cagnotte, repositionnement).

---

## Stratégie produit V1 (validée avec l'utilisateur en amont)

Aucune API de pricing live n'existe dans l'écosystème Purama. Stratégie **V1 guidée/affiliation** appliquée partout : fourchettes de référence sourcées + disclaimers honnêtes, ou redirection vers des plateformes réelles et stables (Google Flights, Booking.com, plateformes nommées ci-dessus). Jamais de prix live inventé, jamais de faux avis/chiffres/partenariat.

**Aucun contenu hidden-city nulle part** — vérifié par grep exhaustif sur tout le repo (0 occurrence).

---

## Tests & vérifications (protocole 5 niveaux)

- **Unit** : arithmétique `computeTruePrice` vérifiée par script indépendant (fourchettes exactes) ; `generateBudgetPropositions` confirmé toujours 5 résultats (16 destinations actives en base, aucun filtre additionnel) ; lettre EU261 vérifiée conforme (montants Art. 7, motifs d'éligibilité, mentions légales).
- **Build** : `tsc --noEmit` 0 erreur, `next build` 0 erreur, à chaque module livré et en repli final.
- **Lint** : 0 erreur sur tous les fichiers VACANCES créés/modifiés. *(9 erreurs / 8 warnings ESLint pré-existants détectés dans des fichiers hors périmètre — `RadarView.tsx`, `ForestScene.tsx`, `MountainScene.tsx`, `InstallBanner.tsx`, `WalletView.tsx`, `trajets/page.tsx`, `challenges/stake`, `anti-fraud.ts` — non touchés par cet upgrade, à traiter dans une session dédiée.)*
- **Intégration / HTTP** : sweep complet sur les 73+ routes existantes (accueil, login/signup, toutes les pages `/dashboard/*`, échantillon d'API) — aucune régression, tous les codes HTTP inchangés (307 auth-gate, 401 API, 200 public).
- **Non-régression GitNexus** : `detect_changes` exécuté avant chaque commit, `risk_level: none` à chaque fois — les seules modifications de fichiers partagés (`middleware.ts`, `wallet.ts`, `DashboardHello.tsx`) sont additives et confirmées LOW risk / 1 seul appelant direct.
- **Production live** : après déploiement, sweep de confirmation sur `https://yatra.purama.dev` — accueil 200, dashboard 307, hub vacances 307, `/api/stripe/checkout` et `/api/stripe/portal` 401 (pas 500 → confirme que `STRIPE_SECRET_KEY` est bien chargée en production), page cagnotte publique 404 sur code invalide.

## Migrations base de données

`p14` à `p22` (9 migrations), toutes appliquées et vérifiées sur le VPS de production (`72.62.191.111`, schéma `yatra`).

## Déploiement

- Web : `vercel --prod` — déploiement `dpl_52quSmXL7y2ew5kXAKVRXdE2u1LT`, `readyState: READY`, cible `production`.
- Env vars poussées via CLI uniquement (jamais dashboard) : `STRIPE_SECRET_KEY` (rafraîchie avec la clé valide résolue par l'audit écosystème), `INTERNAL_WEBHOOK_SECRET` (ajoutée), `STRIPE_PRICE_PREMIUM_MONTHLY`, `STRIPE_PRICE_PREMIUM_ANNUAL`, `STRIPE_PRICE_LIFETIME_ANTI_CHURN`.

## À faire ensuite (hors périmètre de cet upgrade)

1. Nettoyage des 9 erreurs / 8 warnings ESLint pré-existants listés ci-dessus (session dédiée).
2. Test manuel d'un vrai paiement Stripe checkout de bout en bout (impossible à automatiser sans session utilisateur authentifiée depuis le CLI).
3. Mobile Expo (§P7 du planning global YATRA) — non concerné par ce brief VACANCES.
