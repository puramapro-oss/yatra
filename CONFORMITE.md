# CONFORMITÉ NIYAMA — YATRA

Date de l'audit : 2026-08-23 (le jour même de l'application du socle légal).
Méthode : lecture directe de chaque fichier cité (chemin:ligne en preuve), plus 2 vérifications live (port SSH VPS, endpoint PostgREST production) pour ne pas se fier uniquement à la documentation.

**Date de remédiation : 2026-08-24.** Les 6 gaps ci-dessous ont été corrigés (voir « Récapitulatif des gaps » en fin de document pour le détail CORRIGÉ/NON CORRIGÉ). `tsc --noEmit` et `npm run build` passent à 0 erreur après remédiation.

Famille NIYAMA déclarée (`src/lib/legal/yatra-config.ts:13`) : **`karma_wellness`** — cohérente avec le code réel : YATRA redistribue 50 % du CA aux utilisateurs (Vida Credits), a un wallet retirable, et une clause anti-fraude. Match famille/code : **OK**.

---

## 1. Pages légales

| Page | Fichier | Preuve |
|---|---|---|
| Mentions légales | `src/app/mentions-legales/page.tsx` | `buildMentionsLegales(YATRA_LEGAL_CONFIG)` via `LegalPage` |
| CGU | `src/app/cgu/page.tsx` | `buildCGU(YATRA_LEGAL_CONFIG)` |
| CGV (aPaiement=true) | `src/app/cgv/page.tsx` | `buildCGV(YATRA_LEGAL_CONFIG)` |
| Politique de confidentialité | `src/app/politique-confidentialite/page.tsx` | `buildPolitiqueConfidentialite(YATRA_LEGAL_CONFIG, process.env, [...Treezor])` |
| Anciennes routes | `src/app/terms/page.tsx`, `src/app/privacy/page.tsx`, `src/app/legal/page.tsx` | redirects propres vers `/cgu`, `/politique-confidentialite`, `/mentions-legales` — pas de doublon de contenu périmé |

**Verdict : VERT.** 4 pages réelles, contenu généré depuis le socle partagé, pas de Lorem, pas de faux liens.

---

## 2. Bandeau consentement cookies — GAP #1 (le piège vida-grow-origine/raksha se reproduit ici)

Le socle légal contient un composant `CookieConsentBanner` réellement fonctionnel (`src/lib/legal/components/CookieConsentBanner.tsx`) : 3 actions (Tout accepter / Tout refuser / Personnaliser mesure+marketing séparément), rien n'est déposé avant choix, synchronisation optionnelle vers `POST /api/legal/cookie-consent` via un `onConsent`.

**Mais ce composant n'est importé nulle part.** `grep -rn "CookieConsentBanner" src/app src/components` → 0 résultat.

Ce qui est réellement monté dans `src/app/layout.tsx:96` est l'**ancien** composant `src/components/shared/CookieBanner.tsx` :
- 2 choix seulement (Accepter/Refuser), aucune granularité mesure/marketing ;
- clé localStorage différente (`yatra-cookie-choice` vs `purama_cookie_consent_v1`) ;
- **aucun appel** à `/api/legal/cookie-consent` — `onConsent` n'existe même pas dans ce composant ;
- wording générique non aligné avec la politique de confidentialité générée ("Aucun tracking publicitaire, jamais" — affirmation non vérifiée par le composant lui-même).

**Verdict : ROUGE sur ce point.** Le bandeau conforme existe en code mort ; le bandeau réellement vu par l'utilisateur n'est pas branché au nouveau socle.

**CORRIGÉ (2026-08-24).** `src/components/legal/CookieConsentBannerClient.tsx` créé (câble `CookieConsentBanner` avec `appName="YATRA"` + `onConsent` → `POST /api/legal/cookie-consent`), monté dans `src/app/layout.tsx:8,96` à la place de `CookieBanner`. L'ancien composant `src/components/shared/CookieBanner.tsx` (2 choix seulement, pas de sync DB) a été supprimé — plus aucune référence dans le code. Pattern repris à l'identique de `vida-grow-origine` (déjà en prod).

---

## 3. Preuve d'acceptation CGU horodatée — code correct, mais table absente en prod

### 3a. Le code appelle réellement `/api/legal/accept` (pas juste codé)
- **Signup email** : `src/app/signup/page.tsx:14-25` définit `acceptLegalDocs()` qui `POST /api/legal/accept` pour `cgu`/`cgv`/`confidentialite`, et cette fonction est **effectivement appelée** ligne 74, juste après un signup réussi (`await acceptLegalDocs()`), avant le `toast.success` et le redirect. Vérifié : ce n'est pas un composant affiché sans handler — le call réseau part.
- **Signup Google OAuth** : `src/app/callback/route.ts:33-51` — pas d'appel HTTP interne (logique), mais insertion directe en base des 3 documents manquants (`legal_acceptances.insert(...)`), server-side, avec IP + user-agent. Cohérent avec le principe "1 clic Google = acceptation".
- **`api/legal/accept/route.ts`** : version **toujours recalculée côté serveur** (`CURRENT_LEGAL_VERSIONS[docType]`), jamais une valeur envoyée par le client — bonne pratique anti-triche.

### 3b. Mais la table cible n'existe pas en production — vérifié en LIVE, pas juste dans ERRORS.md
`ERRORS.md` (ligne datée 2026-08-23) documente que la migration `supabase/migrations/p31_legal_niyama.sql` n'a **jamais été exécutée** (SSH VPS `72.62.191.111:22` refusé depuis le sandbox de développement). Vérification indépendante faite pendant cet audit :
```
$ (tcp connect 72.62.191.111:22) → Connection refused   (confirme le blocage, toujours d'actualité)
$ curl .../rest/v1/legal_acceptances?select=id&limit=1  → HTTP 404
$ curl .../rest/v1/wallets?select=id&limit=1            → HTTP 200   (table existante, témoin de contrôle)
```
Le `404` (et non un `200` avec liste vide, ce que donnerait une RLS qui cache les lignes) confirme que la table **n'existe pas** dans le schéma `yatra` en production. Donc à ce jour :
- tout `POST /api/legal/accept` échoue silencieusement en base (le endpoint renvoie 500, capturé par `catch()` côté signup mais jamais remonté à l'utilisateur — `Promise.allSettled`, best-effort) ;
- `cookie_consents` et `account_deletion_requests` n'existent pas non plus → §4 est impacté également ;
- `src/types/database.ts` ne connaît pas ces 3 tables (attendu, documenté, ne casse pas `tsc`/`build`).

**Verdict : ORANGE→ROUGE selon le moment de lecture.** Le code est honnête et complet ; le blocage est documenté avec un runbook exact (`sshpass ... psql -U supabase_admin ...`) prêt à l'emploi. Mais tant que la migration n'est pas jouée, **aucune preuve d'acceptation n'est réellement écrite en base** malgré ce que suggère l'UI ("Compte créé ! 🌿"). C'est un blocage d'infra documenté, pas un oubli de code — mais reste un gap réel de conformité live.

**CORRIGÉ (2026-08-24).** SSH toujours refusé depuis ce sandbox (`Connection refused` port 22, confirmé de nouveau) — migration jouée via le fallback pg-meta API (`POST https://auth.purama.dev/pg/query`, header `apikey: $SUPABASE_SERVICE_ROLE_KEY`, cf PIEGES.md entrée SEVA 2026-08-23). Vérifié en LIVE : `information_schema.tables` confirme les 3 tables présentes dans le schéma `yatra` ; `curl .../rest/v1/legal_acceptances` passe de `404` (table absente) à `401`/`42501 permission denied` avec la clé anon — comportement attendu (GRANT volontairement limité à `postgres/authenticated/service_role`, jamais `anon`), qui confirme que la table + RLS existent bel et bien. `POST /api/legal/accept` écrit désormais réellement en base.

---

## 4. « Ma mémoire » / export RGPD / suppression de compte

- Page montée : `src/app/dashboard/ma-memoire/page.tsx` → `<MaMemoirePage>` avec `acceptations` et `deletionScheduledFor` lus côté serveur (Supabase) — code correct.
- Export : `GET /api/legal/my-data` (`src/app/api/legal/my-data/route.ts`) — exporte profil + `legal_acceptances` + `cookie_consents` + 9 tables applicatives (`wallet_transactions`, `withdrawals`, `referrals`, `conversations`, `aria_conversations`, `adn_mobilite`, `fil_de_vie`, `humanitarian_applications`, `support_tickets`) en JSON téléchargeable. Portabilité RGPD art. 20 réelle.
- Suppression : `POST /api/account/delete` programme une suppression à J+30 (grâce), `DELETE /api/account/delete` annule. `AccountDeletionButton.tsx` exige de taper `DELETE_MY_ACCOUNT` — 0 case à cocher, friction volontaire cohérente avec le reste de l'écosystème.
- Suppression effective : dépend du cron `src/app/api/cron/account-deletion/route.ts` (existe dans l'arborescence — non audité en détail ici, hors périmètre §1 mais présent).

**Mais** cette chaîne dépend des mêmes 3 tables absentes en prod (§3b) — `legal_acceptances`, `cookie_consents`, `account_deletion_requests`. Résultat live actuel : la page "Ma mémoire" s'affiche sans erreur visible (les `select` renvoient `data: null` silencieusement, pas de check `.error` dans `dashboard/ma-memoire/page.tsx:15-26`) mais **liste toujours 0 acceptation** et une suppression de compte échouera en 500 côté `/api/account/delete`.

**Verdict : code ORANGE (bien écrit), fonctionnel réel ROUGE tant que la migration n'est pas jouée.**

**CORRIGÉ (2026-08-24).** Conséquence directe de la migration jouée en §3b — `legal_acceptances`, `cookie_consents` et `account_deletion_requests` existent désormais réellement en prod. La page « Ma mémoire » et `/api/account/delete` peuvent lire/écrire dans ces tables.

---

## 5. Déclaration IA sur chaque UI de chat IA

Une seule interface de chat IA dans l'app : `src/app/dashboard/aria/conversation/[id]/ConversationView.tsx`. Elle importe et monte réellement `AIDisclosure` (ligne 9 et ligne 233) :
```
<AIDisclosure appName="YATRA" extra="Aria ne remplace pas l'avis d'un professionnel qualifié." />
```
Recherche exhaustive (`grep -rln "MessageInput\|<textarea\|ChatInterface" src/app/dashboard/aria`) : un seul fichier de conversation IA dans toute l'app, et il porte la déclaration.

**Verdict : VERT. 1/1 surface de chat IA couverte, 0 gap.**

---

## 6. Lexique interdit + avis rémunérés + promesses de résultat + piège YATRA (Atout France)

- Recherche du lexique santé/promesses interdites (`garanti`, `100% sûr/gratuit`, `sans risque`, `gagnant à coup sûr`, `argent facile`, `devenir riche`, `guérit`, `soigne`, `remède`, `miracle`) sur tout `src/app` + `src/components` (`.tsx`) : **0 occurrence**, à une exception qui va dans le bon sens — `src/app/dashboard/vacances/recuperer/reservations/ReservationsView.tsx:92` : *« l'économie n'est jamais garantie »* (disclaimer honnête, pas une promesse).
- Mécaniques d'avis/notes rémunérés (`avis`, `review`, `témoignage`, `noter l'app`) : recherche exhaustive, aucune mécanique de récompense contre avis trouvée dans `src/app`/`src/components`.
- **Piège spécifique YATRA (NIYAMA-BRIEF §3)** : *« affiliation/redirection uniquement tant que pas d'immatriculation Atout France + garantie financière »*.
  - Vérifié structurellement respecté : `src/app/api/vacances/reservations/route.ts` ne fait que **tracker** un `lien_reservation` saisi par l'utilisateur lui-même (réservation faite ailleurs) ; `src/app/api/vacances/logement/route.ts` ne fait que journaliser des usages de house-sitting/échange/volontariat (aucune transaction) ; `src/app/api/cashback/route.ts` liste des `cashback_partners` (modèle affiliation/commission) ; `src/app/api/yatra/search/route.ts` est un classifieur NLU (Claude) qui ne réserve rien. `grep -rln "createYatraCheckoutSession\|createYatraPaymentSession" src/app/api/vacances src/app/api/cashback src/app/api/yatra` → 0 résultat : **aucune route de paiement de voyage n'existe**, seul l'abonnement Premium passe par Stripe.
  - **Mais** : `grep -rn "Atout France" src` → 0 occurrence. Le respect du piège est un effet de bord de l'architecture actuelle (pas de moteur de réservation), **pas une garde-fou écrit** dans les CGU. Rien n'empêche une future feature de réservation directe de passer sous le radar du socle légal, qui ne connaît pas cette contrainte.

**Verdict : VERT sur le lexique et les avis rémunérés (0 occurrence). ORANGE sur le piège Atout France : respecté en pratique, non documenté en CGU — pas de garde-fou écrit.**

**CORRIGÉ (2026-08-24).** Clause spécifique « Voyages et hébergements — rôle d'affiliation uniquement » ajoutée dans `src/lib/legal/yatra-config.ts` (`clausesSpecifiquesCgu`) : décrit factuellement le périmètre actuel (tracking de lien de réservation externe, journalisation house-sitting/échange/volontariat sans transaction, affiliation cashback commissionnée) et pose explicitement le garde-fou pour l'avenir — aucune réservation directe/encaissement de voyage tant que YATRA n'est pas immatriculée Atout France + garantie financière.

### Défaut additionnel trouvé pendant la vérification du lexique — clause « Âge minimum » incohérente
`src/lib/legal/yatra-config.ts:48-52` (clause spécifique CGU) : *« YATRA est accessible à partir de 16 ans (DSA). Pour 16-18 ans, consentement d'un titulaire de l'autorité parentale requis. »*
Mais la clause générique de base (`src/lib/legal/content/cgu.ts:26`) dit : *« L'inscription à YATRA est gratuite et ouverte à toute personne majeure. »*
Ces deux clauses **se contredisent dans le même document** (16 ans vs majeure = 18 ans). De plus, **aucune vérification technique** n'existe : `src/app/signup/page.tsx` ne collecte aucune date de naissance, aucun flux de consentement parental n'existe dans `src/app/onboarding/`. La promesse « consentement parental requis 16-18 » n'est donc tenue par rien dans le produit.

**Verdict : ORANGE — clause auto-contradictoire et non appliquée techniquement.**

**CORRIGÉ (2026-08-24).** Clause « Âge minimum » de `yatra-config.ts:48-52` réécrite pour s'aligner sur la clause de base (« toute personne majeure », `content/cgu.ts:26`) : suppression de la promesse « 16 ans + consentement parental » qui n'était appuyée par aucun mécanisme technique (aucune collecte de date de naissance, aucun flux de consentement parental). Les deux clauses du même document ne se contredisent plus. Choix délibéré : ne pas construire un flux de vérification d'âge/consentement parental (hors périmètre remédiation NIYAMA, aurait été une fonctionnalité nouvelle) — l'app reste réservée aux majeurs, cohérent avec le wallet retirable et les paiements réels.

---

## 7. Chiffres cohérents avec FACTS.md

| Chiffre | FACTS.md | YATRA | Cohérent ? |
|---|---|---|---|
| Seuil retrait wallet | 5 € | `WALLET_MIN_WITHDRAWAL_EUR = 5` (`src/lib/constants.ts:35`), `MIN_WITHDRAW = 5` (`src/app/api/wallet/withdraw/route.ts:11`), clause CGU « retirables dès 5 € » (`yatra-config.ts:44`) | ✅ |
| Split KARMA | 50 % users / 10 % asso / 40 % SASU | Clause CGU « Redistribution du chiffre d'affaires » (`yatra-config.ts:32`) : 50/10/40 exact, `src/lib/constants.ts:3,14` documente aussi 50/10/40 | ✅ |

**Défaut additionnel trouvé pendant la vérification des chiffres — offre « lifetime 149 € » fantôme**
`src/app/pricing/page.tsx:10-22` affiche un plan `lifetime: { price: 149, features: 5 }`. Or :
- la clause CGV réelle (`yatra-config.ts:54-64`, « Offres et tarifs ») ne liste que Découverte gratuit / Premium mensuel 9,99 € / Premium annuel 71,93 € / offre anti-churn 4,99 €·mois — **aucun plan « lifetime 149 € » n'y figure** ;
- le vrai catalogue Stripe (`src/lib/stripe.ts:55-62`) ne connaît qu'un `lifetime_anti_churn` à 4,99 €/mois, proposé uniquement sur l'écran d'annulation — pas un achat à 149 € en un clic ;
- le bouton d'achat de ce plan fantôme est un **no-op** : `src/app/pricing/page.tsx:38-39` — commentaire `// Pour premium/lifetime → redirect vers Stripe checkout (à implémenter)`, puis `router.push('/dashboard')` sans jamais appeler Stripe.

C'est un TODO non résolu affiché comme un prix réel au public, sur une page dont l'objet même est la vente — exactement le type d'écart que §7 doit attraper (chiffre montré à l'utilisateur qui ne correspond à rien de vendable, et qui contredit la CGV).

**Verdict : VERT sur WALLET_MIN et split KARMA. ROUGE sur la page pricing (prix fantôme + bouton mort + incohérence CGV).**

**CORRIGÉ (2026-08-24).** Plan « lifetime 149 € » supprimé de `src/app/pricing/page.tsx` (objet `PLANS`, carte, cas `handleSelectPlan`) — grille repassée à 2 plans réels (Découverte / Premium), les seuls qui existent à la fois en CGV (`yatra-config.ts:54-64`) et dans le catalogue Stripe (`src/lib/stripe.ts:15-63`). Plus aucun prix affiché au public ne correspond à un TODO non résolu. Le bouton Premium reste un `router.push('/dashboard')` (comportement pré-existant, non flagué par l'audit comme fantôme — Premium est un plan réel — le câblage complet vers `/api/stripe/checkout` est un chantier produit distinct, volontairement hors périmètre de cette remédiation légale pour ne pas introduire un flux de paiement non testé).

---

## 8. Migration SQL

`supabase/migrations/p31_legal_niyama.sql` existe, complet (3 tables `legal_acceptances`/`cookie_consents`/`account_deletion_requests`, RLS + policies + GRANT explicites + `NOTIFY pgrst`). `ERRORS.md` documente le blocage le jour même (2026-08-23), avec la commande exacte pour l'exécuter dès qu'une session a accès au VPS.

Vérification live indépendante faite pendant cet audit (ci-dessus, §3b) : **toujours non exécutée**, port SSH 72.62.191.111:22 toujours refusé depuis ce sandbox, `legal_acceptances` toujours 404 côté PostgREST production.

**Verdict : documenté correctement dans ERRORS.md (pas un oubli silencieux), mais reste un blocage CRITIQUE et actif — toute la chaîne de preuve légale (§3, §4) est inerte en production tant que cette migration n'est pas jouée.**

**CORRIGÉ (2026-08-24).** Migration exécutée via fallback pg-meta API (détail §3b/§9 ci-dessus). Fichier `supabase/migrations/p31_legal_niyama.sql` mis à jour en tête pour documenter l'exécution effective. Reste hors périmètre (non bloquant, non demandé par cette remédiation) : `src/types/database.ts` n'existe pas encore pour cette app — les 3 tables ne sont donc pas dans des types générés, mais `tsc`/`build` passent à 0 malgré ça (client Supabase non typé génériquement dans `lib/supabase/server.ts`).

---

## 9. `LegalReacceptanceGate` — gap quasi-universel confirmé sur YATRA aussi

Le composant existe (`src/lib/legal/components/LegalReacceptanceGate.tsx`), bien conçu (0 case à cocher, un clic « J'ai lu, je continue » par document, appel `onAccept` → `POST /api/legal/accept`), et `computeDocsEnAttente()` (`src/lib/legal/versions.ts:29`) calcule proprement les documents à ré-accepter en comparant les acceptations de l'utilisateur à `CURRENT_LEGAL_VERSIONS`.

**Mais aucun des deux n'est jamais utilisé :**
```
grep -rn "LegalReacceptanceGate" src/app src/components  → 0 résultat (hors export/définition)
grep -rn "computeDocsEnAttente" src                        → seulement sa définition + son ré-export dans index.ts
```
Rien dans `src/app/dashboard/` (pas de layout dédié — l'app n'a qu'un seul `src/app/layout.tsx` racine) n'appelle `computeDocsEnAttente()` côté serveur, et rien ne monte `<LegalReacceptanceGate>` où que ce soit.

**Conséquence concrète** : `versions.ts` documente lui-même la règle *« toute modification du contenu générique DOIT incrémenter sa version... un utilisateur qui a accepté une version antérieure est re-sollicité par `LegalAcceptanceNotice` »* — mais cette phrase est fausse pour YATRA : rien ne re-sollicite personne. Si `CURRENT_LEGAL_VERSIONS.cgu` passe demain de `1.0` à `1.1`, aucun utilisateur déjà inscrit n'en sera jamais informé ni ne sera bloqué — le mécanisme est du code mort.

**Verdict : ROUGE. Confirmé — gap présent, comme sur la quasi-totalité des apps auditées jusqu'ici.**

**CORRIGÉ (2026-08-24).** `src/components/legal/LegalReacceptanceGateClient.tsx` créé (câble `LegalReacceptanceGate` avec `onAccept` → `POST /api/legal/accept`). Monté dans un nouveau `src/app/dashboard/layout.tsx` (l'app n'avait aucun layout dédié sous `dashboard/` — créé a minima : ne touche à aucun chrome existant, calcule `docsEnAttente` côté serveur via `computeDocsEnAttente()` + lecture `legal_acceptances`, et rend le gate en overlay `fixed inset-0` par-dessus `{children}`). Best-effort identique au pattern `vida-grow-origine` : si `legal_acceptances` n'est pas joignable, aucun gate n'est affiché plutôt que de faire planter le dashboard. Pattern repris à l'identique de `vida-grow-origine` (déjà en prod). Note : la route `src/app/(dashboard)/dashboard/surprise` (groupe de routes distinct, hors du dossier `dashboard/`) n'est pas couverte par ce layout — anomalie d'organisation de routes préexistante, non créée par cette remédiation, hors périmètre CONFORMITE.md.

---

## Récapitulatif des gaps

| # | Sujet | Sévérité | Preuve | Statut |
|---|---|---|---|---|
| 1 | Bandeau cookies conforme codé mais jamais monté ; l'ancien bandeau (non granulaire, non synchronisé DB) est ce qui tourne réellement | CRITIQUE | `src/app/layout.tsx:96` monte `CookieBanner`, pas `CookieConsentBanner` | **CORRIGÉ** — `CookieConsentBannerClient` monté, ancien composant supprimé |
| 2 | Tables `legal_acceptances`/`cookie_consents`/`account_deletion_requests` absentes en production (migration jamais jouée) | CRITIQUE (documenté) | `curl .../legal_acceptances` → 404 vérifié en live 2026-08-23 | **CORRIGÉ** — migration jouée via pg-meta API 2026-08-24, 3 tables confirmées en live |
| 3 | `LegalReacceptanceGate` + `computeDocsEnAttente` jamais montés/appelés — 0 re-consentement possible en cas de nouvelle version CGU/CGV | CRITIQUE | 0 usage hors définition/export | **CORRIGÉ** — gate monté via nouveau `src/app/dashboard/layout.tsx` |
| 4 | Clause « Âge minimum » (16 ans + parental) contredit la clause de base (« toute personne majeure ») et n'est vérifiée par aucun champ du formulaire d'inscription | MOYEN | `yatra-config.ts:48-52` vs `content/cgu.ts:26` | **CORRIGÉ** — clause réalignée sur majorité (18 ans), plus de contradiction ni de promesse non tenue |
| 5 | Page `/pricing` affiche un plan « lifetime 149 € » absent de la CGV et du catalogue Stripe réel ; bouton d'achat non implémenté (TODO) | MOYEN-ÉLEVÉ | `src/app/pricing/page.tsx:18-22,38-39` vs `yatra-config.ts:54-64` et `src/lib/stripe.ts:55-62` | **CORRIGÉ** — plan fantôme supprimé, grille limitée aux 2 plans réels (Découverte/Premium) |
| 6 | Piège YATRA (Atout France/affiliation uniquement) respecté par l'architecture actuelle mais non codifié en CGU — pas de garde-fou écrit pour l'avenir | FAIBLE | 0 occurrence « Atout France » dans le code | **CORRIGÉ** — clause CGU dédiée ajoutée dans `yatra-config.ts` |

**6/6 gaps corrigés (2026-08-24)** (3 critiques, 2 moyens/élevés, 1 faible). Aucun n'impliquait de lexique interdit, de faux avis, ou de promesse de résultat santé/financier explicite — le socle textuel généré était propre et le code d'écriture des preuves d'acceptation (signup + callback OAuth) était déjà réellement câblé. Le problème de YATRA était un socle bien conçu mais **partiellement débranché du produit réel** : bandeau cookies, gate de ré-acceptation et tables de preuve n'étaient pas en prise avec ce que l'utilisateur voyait et faisait réellement — c'est désormais le cas. `tsc --noEmit` et `npm run build` : 0 erreur après remédiation.

---

VERDICT:yatra:ORANGE:6
VERDICT-REMEDIATION:yatra:VERT:6/6
