# ✈️ YATRA — UPGRADE BRIEF V2.0
## « Tes vacances au prix le plus bas possible — et YATRA te fait même gagner de l'argent »

> **Contexte :** YATRA existe déjà (app mobilité/trajets livrée v1.0 : 73 routes, DUAL REWARD, missions trajets, prod yatra.purama.dev). Ce brief ajoute un tout nouveau volet VACANCES/VOYAGES à l'app existante : scanner multi-plateformes de voyages (vols, trains, bus, hébergements) + tous les modules ci-dessous. On ne recrée PAS l'app, on ne casse RIEN de l'existant (zéro régression sur les 73 routes et les modes trajets actuels). Le volet vacances devient une section majeure de YATRA à côté des trajets quotidiens.
> **Règle absolue :** Lis d'abord CLAUDE.md, CLAUDE-2.md, PURAMA_MASTER_UPGRADE.md, STRIPE_CONNECT_KARMA_V4.md, KARMA_INTEGRATION.md, KARMA-BRIEF.md, puis le code existant de YATRA. (LEARNINGS.md, ERRORS.md, PATTERNS.md, AGENTS.md dans ~/purama/ sont importés automatiquement par CLAUDE.md.) Plan d'abord. NE CODE PAS avant validation. `/clear` à 50% de contexte → "Continue, lis task_plan.md."

---

## 0. MISE AUX NORMES (avant les nouveautés)

- Vérifier/migrer YATRA sur le backend partagé (PURAMA_MASTER_UPGRADE.md) : Supabase partagé, auth commune.
- Webhook Stripe : réutiliser le webhook UNIQUE partagé (routage metadata `app_slug: yatra`). INTERDICTION d'en créer un nouveau (limite 16).
- Design : conserver l'identité YATRA mais aligner sur CLAUDE-2.md (GOD MODE V3). INTERDICTION /graphify.
- Abonnement : SUPPRIMER tout abonnement propre à YATRA → l'accès premium = abonnement unique PURAMA (sera branché via WALLET_INTEGRATION.md quand le core sera prêt ; en attendant, prévoir le flag `CORE_READY=false` avec l'ancien système en fallback).

---

## 1. NOUVEAU — ALERTES ERREURS DE TARIF & BONS PLANS

- L'utilisateur définit ses aéroports/gares de départ + destinations rêvées + budget.
- Veille automatisée des tarifs anormalement bas (erreurs de tarif, promos flash) sur les sources déjà scannées par YATRA + flux publics spécialisés.
- Alerte push/email personnalisée : "Paris→Tokyo 180€ détecté, fenêtre estimée 2-6h" avec lien direct de réservation.
- Honnêteté codée : mention claire que les erreurs de tarif peuvent être annulées par la compagnie — conseil de ne rien réserver d'autre (hôtel non remboursable) avant confirmation du billet.
- ⚠️ INTERDIT : hidden city ticketing (descendre à l'escale) — ne jamais le proposer ni l'expliquer dans l'app (violation des CGV compagnies, risque pour l'utilisateur).

## 2. NOUVEAU — BUDGET INVERSÉ (l'écran signature)

- Entrée : "J'ai X€ et Y jours" (+ options : départ, avec qui, envies).
- Sortie : 5 yatrages COMPLETS chiffrés (transport + logement + repas estimés + activités), triés par rapport qualité/prix, prêts à réserver lien par lien.
- Le moteur exploite la flexibilité (±2 jours, aéroports alternatifs, combinaisons train/bus/avion) et le vrai prix total (cf. §6).

## 3. NOUVEAU — LOGEMENT À 0€

- Trois canaux agrégés avec guides intégrés :
  1. **House-sitting** (garde de maison/animaux = logement gratuit)
  2. **Échange de maisons**
  3. **Volontariat** type Workaway/HelpX (quelques heures/jour = logé nourri)
- YATRA redirige vers les plateformes existantes (pas de marketplace propre en V1), avec checklist de sécurité et calcul de l'économie réalisée ("logement : 0€ au lieu de 640€").
- Synergie interne : les gardes d'animaux peuvent être reliées à PASHU quand elle sera live (flag).

## 4. NOUVEAU — L'ARGENT RÉCUPÉRÉ (l'arme marketing)

1. **Indemnisation vols (EU261)** : détection automatique des retards 3h+/annulations sur les vols enregistrés dans YATRA → génération de la lettre de réclamation pré-remplie (jusqu'à 600€/personne) que l'utilisateur envoie lui-même. **0% de commission** (les concurrents prennent 25-35%) — l'app assiste, ne se substitue pas à un service juridique et ne touche jamais l'argent.
2. **Aides sociales vacances** : test d'éligibilité VACAF/aides CAF (quotient familial), chèques-vacances ANCV, aides CE, bons régionaux → checklist personnalisée + liens officiels. L'app ne collecte pas les aides, elle oriente.
3. **Rebooking automatique** : pour les réservations annulables suivies dans YATRA, alerte si le prix baisse → "Annule et re-réserve : -87€" (semi-auto : l'utilisateur valide, YATRA guide).

## 5. NOUVEAU — STACKING AUTOMATIQUE

- Sur chaque réservation, YATRA affiche la pile optimale : cashback (portails partenaires) + code promo actif + programme de fidélité/miles + moyen de paiement conseillé.
- Objectif : 15-30% récupérés, affichés ligne par ligne ("Total récupéré : 43,20€").
- V1 : affichage guidé de la pile (l'utilisateur clique dans l'ordre). V2 : liens affiliés propres (revenus YATRA sans surcoût utilisateur — transparence affichée).

## 6. NOUVEAU — VRAI PRIX TOTAL

- Comparateur incluant bagages, sièges, frais de dossier, transferts aéroport → le classement réel change souvent complètement.
- Badge "prix final vérifié" sur chaque résultat.

## 7. NOUVEAU — SUR PLACE

- Repas anti-gaspi (paniers -50/70% type Too Good To Go — liens), villes à transports gratuits, calculateur de pass touristique ("rentable pour ton programme : NON, économise 38€"), et **missions rémunérées locales** via KARMA/VIDA JOB (photos pour commerces, vérifications terrain) — le yatrage qui rapporte.

## 8. NOUVEAU — CAGNOTTE YATRAGE

- Cagnotte par projet de yatrage : proches qui cotisent (lien de partage), arrondis volontaires, et crédits gagnés via les missions de l'écosystème.
- Alimentée en points wallet (Phase 1) ; branchement complet au wallet central via WALLET_INTEGRATION.md quand le core sera prêt.

## 9. NOUVEAU — REPOSITIONNEMENT & DERNIÈRE MINUTE

- Conyatrage de véhicules/camping-cars (trajet quasi gratuit), vols de repositionnement, cabines de croisière dernière minute (-70%) — flux agrégés + guides.

---

## 10. UX

- Accueil = 3 entrées seulement : **"J'ai un budget"** (§2) / **"J'ai une destination"** (scanner classique amélioré) / **"Récupérer de l'argent"** (§4).
- Compteur personnel permanent : "YATRA t'a fait économiser/récupérer : XXX€" (lié à l'impact_total du profil).
- Ton : simple, honnête, zéro promesse irréaliste. Chaque économie affichée doit être calculée, pas inventée.

## 11. TESTS & LIVRAISON

- Protocole 5 niveaux CLAUDE.md (unit → feature → integration → E2E → CLIENT-SIM 21 tests).
- Tests critiques : aucune régression sur les 73 routes et fonctionnalités trajets existantes de YATRA ; scanner voyages multi-plateformes fonctionnel (à créer) ; lettre EU261 générée conforme (champs obligatoires) ; calculs du vrai prix total exacts ; budget inversé retourne toujours 5 propositions valides ; aucun contenu hidden-city nulle part.
- Livraison : déploiement Vercel + `YATRA_UPGRADE_DONE.md` (résumé de ce qui a été fait).

---

## ORDRE DE MARCHE
1. Lis tout (fichiers + code existant). Plan d'abord. NE CODE PAS.
2. Après validation : mise aux normes (§0) → vrai prix total (§6, socle) → budget inversé (§2) → argent récupéré (§4) → alertes (§1) → logement 0€ (§3) → stacking (§5) → sur place (§7) → cagnotte (§8) → repositionnement (§9) → UX (§10) → tests.
