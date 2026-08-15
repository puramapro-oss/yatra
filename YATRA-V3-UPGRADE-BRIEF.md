# YATRA-V3-UPGRADE-BRIEF.md — MASTER BRIEF
> App PURAMA · YATRA — Voyage & Transport · Upgrade V3 (doc maître « VIDA MOVE »)
> **Claude Code : LIS ce brief + CLAUDE.md + CLAUDE-2.md (§9/9bis/9ter) + STRIPE_CONNECT_KARMA_V4.md + KARMA_INTEGRATION.md + PURAMA_MASTER_UPGRADE.md + TOUT le code existant de ~/purama/yatra. PLAN D'ABORD. NE CODE PAS tant que le plan n'est pas validé.**

---

## 0. IDENTITÉ & ÉTAT DES LIEUX (Phase 0 obligatoire)

- **SLUG** : `yatra` (figé partout). Domaine : `yatra.purama.dev`. Dossier : `~/purama/yatra`. App livrée le 26/04 (73 routes, prod Vercel).
- **Historique des noms** : le doc source s'appelait « VIDA MOVE », puis « VOYA » (volet vacances fusionné dans YATRA le 25/07). **Dans l'UI, le code et les textes : uniquement YATRA.** Jamais « VIDA MOVE », « VOYA », ni « Claude » (l'IA in-app s'appelle YATRA).
- **AUDIT D'ABORD** : inventorier l'existant (routes, modules, migrations, branche webhook, design). Vérifier si `YATRA-VACANCES-UPGRADE-BRIEF.md` (V2 — 9 modules vacances) a été exécuté :
  - V2 non fait → l'exécuter EN PREMIER dans l'ordre de son propre brief, puis enchaîner V3.
  - V2 partiel → compléter V2, puis V3.
- **Zéro régression** : chaque module V3 s'ajoute sans rien casser des 73 routes existantes ni de V2.
- Rendre compte dans `task_plan.md` : tableau [existant / V2 fait ou pas / V3 à faire].

## 1. MISE AUX NORMES (s'applique à tout le V3)

- Backend partagé Supabase self-hosted + auth commune (PURAMA_MASTER_UPGRADE.md). **Webhook Stripe UNIQUE partagé** — jamais de nouveau webhook (limite dure 16), routage par metadata `app_slug: "yatra"`.
- **Abonnement : UNIQUEMENT l'abonnement unique PURAMA 3 niveaux** (ESSENTIEL 9,99 / INFINI 49,99 / LÉGENDE 99,99). Aucun abonnement propre YATRA. Flag `CORE_READY=false` + fallback existant tant que WALLET_INTEGRATION.md n'est pas livré. Checkout abonnement = site web PURAMA (jamais IAP stores).
- **Gains utilisateurs** : points wallet PURAMA (Phase 1), cash Swan SEPA (Phase 2). 0% commission sur les gains. Tout gain est financé par le pool/la Grille avec plafonds — **jamais de € fixes promis, jamais de promesse de gains chiffrée publique**.
- **PILOT_MODE** : respecter le flag (zéro € affiché, tout en points « membre fondateur ») tant qu'il est actif.
- **Design** : GOD MODE (CLAUDE-2.md) + boucle Directeur Artistique jusqu'à score ≥ 9 — niveau meilleures apps du store, coloré et vivant (référence Duolingo × Headspace), signature YATRA nature/spirituel/futuriste. INTERDICTION `/graphify`.

## 2. MODULE — PAYÉ POUR MOBILITÉ PROPRE (cœur du V3)

- Modes récompensés : marche, vélo, trottinette, transports en commun, covoiturage.
- **Mode Trajet** (réaliste en web/PWA) : l'utilisateur lance le trajet → `watchPosition` + wake lock + accéléromètre quand dispo → fin de trajet → validation.
- **Anti-fraude OBLIGATOIRE avant tout gain** : cohérence vitesse par mode (marche < 8 km/h, vélo 8–35, etc.), plausibilité du tracé, détection voiture déguisée / GPS spoofing (vérifs croisées capteurs), plafonds journalier + mensuel par palier ×1/×5/×10, budget cantonné au pool + réconciliation quotidienne.
- Barème en points/km selon le mode (défini dans une table de config, modifiable sans redéploiement).
- Compteur CO₂ évité (réf. voiture 0,21 kg/km) alimentant `impact_total` + le compteur permanent « YATRA t'a fait économiser/récupérer XXX ».
- Limite honnête à documenter (R06) : le tracking en arrière-plan est impossible en web → l'API et le moteur de règles sont conçus pour être réutilisés tels quels par le futur module natif Expo (backlog V3.1).

## 3. MODULE — RECHERCHE EN LANGAGE NATUREL + IA YATRA

- **Entrée principale de l'app** : « Dis exactement ce que tu cherches » (texte + voix). L'IA comprend (destination, budget, dates, contraintes) et route vers le bon moteur : trajet minimal, budget inversé (V2), radar gratuit, aides, surprise parfaite.
- Assistant YATRA in-app qui répond à toutes les questions voyage/transport et sur l'app. Ton honnête, zéro promesse irréaliste. Crédits IA par palier avec plafonds anti-perte (décision 25) via l'engine partagé.

## 4. MODULE — MOTEUR ZÉRO-COÛT (trajet hybride)

- Combinaison marche + vélo + TC + covoiturage + train/bus pour le **prix minimal ET le CO₂ minimal** ; affichage comparatif par option : prix, durée, CO₂, points gagnés.
- Réutilise les scanners/APIs du volet V2 — aucun doublon de scraper.

## 5. MODULE — ACHAT GROUPÉ INTELLIGENT

- Pools de demande par trajet/activité : l'utilisateur rejoint un pool (même seul) → seuil atteint → tarif groupe (billets de groupe SNCF, activités partenaires).
- V1 réaliste : pools + compteur + notification « seuil atteint » + réservation assistée. Automatisation complète seulement si une API le permet — documenter ce qui est faisable (R06), ne rien simuler.

## 6. MODULE — RADAR GRATUIT & AIDES LOCALES

- Carte + liste autour de soi : musées gratuits (1ers dimanches), nature, balades, événements — filtres 0€ / <5€ / <10€. Sources : base curatée + APIs publiques d'agendas + contributions communauté modérées.
- **« Ce à quoi tu as droit »** : moteur d'aides mobilité/vacances par profil et localisation (ville/département/région, CAF/VACAF/ANCV, étudiant, senior, handicap, demandeur d'emploi) — étend le module « argent récupéré » V2. Fiches claires + démarches officielles. **L'app ne touche jamais l'argent des aides.**

## 7. MODULE — NATUREL & SOINS

- Cashback en points sur les produits naturels PURAMA + partenaires éthiques (liens affiliés transparents, charte de filtrage).
- Annuaire « soins naturels accessibles » (naturopathie, cures, ateliers respiration/méditation) avec tarifs solidaires. **Bien-être non médical uniquement : zéro claim santé, orientation vers un médecin pour tout ce qui est médical.**

## 8. MODULE — HUMANITAIRE & MISSIONS

- Pont **vida-assoc** : micro-missions locales (ramassage, aide asso, événement) + voyages solidaires encadrés par des associations partenaires vérifiées. Récompenses via KARMA/points + réductions. Cadre strict : bénévolat encadré, jamais de travail déguisé.
- Défis, jeux-concours, ligues : **BRANCHER sur le moteur KRIDA de l'écosystème** (places gagnées par l'usage, chances ×1/×5/×10). Ne PAS créer de moteur de jeux local.

## 9. MODULE — QR CODES & PUB TRANSPORTS

- Générateur de QR codes trackés par lieu/partenaire (bus, trains, taxis, gares, aéroports…) : scan → landing YATRA → attribution (lieu, campagne, partenaire) → install/signup attribués.
- Kit print auto (affichette PDF par partenaire), stats remontées dans AGNI, lien avec le programme partenaires physiques (commission sur abonnements attribués).

## 10. MODULE — SURPRISE PARFAITE

- 1 bouton → en 10 secondes : destination proche + trajet minimal + 1 activité gratuite du radar + 1 micro-défi positif. Paramètres : rayon, budget (0€/5€/10€), durée (2h / demi-journée / week-end).

## 11. EXPÉRIENCE MULTISENSORIELLE (signature)

- Fond vivant nature : parallax au gyroscope + continuité du décor au swipe ; micro-animations organiques ; haptique (Vibration API quand dispo) + sons doux par interaction ; cinématique de lancement < 2,5 s, skippable et jouée en entier seulement à la 1ère ouverture.
- Mode « Silence total » (tout coupé en 1 tap) ; `prefers-reduced-motion` respecté ; tout désactivable dans les réglages.
- **Budget perf strict** : LCP < 2,5 s, pas de vidéo lourde — WebM/AV1 léger ou canvas/gradients animés en fallback, lazy-load, batterie respectée.

## 12. ACCESSIBILITÉ & LANGUES

- WCAG 2.2 AA minimum : lecteurs d'écran (VoiceOver/TalkBack), contrastes, cibles 44 px, navigation clavier, transcripts/sous-titres, mode simplifié. Testé Playwright + axe (0 erreur critique).
- i18n complet (next-intl) : FR, EN, ES, DE, IT, PT, AR (RTL) au lancement + architecture extensible à toutes les langues ; devises et formats locaux.

## 13. PAIEMENTS

- Stripe (webhook partagé) ; **Apple Pay + PayPal via Stripe** pour les achats ponctuels ; abonnements = checkout web PURAMA uniquement.

---

## INTERDITS ABSOLUS (à graver)

1. Hidden city ticketing : aucun contenu, aucune suggestion (règle V2 maintenue).
2. **Jamais payer ni récompenser des avis App Store/Play Store, ni des abonnements/follows Instagram/TikTok/YouTube** (interdits par Apple, Google, Meta, TikTok — risque de bannissement du compte SASU). Les missions de partage rémunérées = création de contenu libre avec mention #partenariat, jamais conditionnée à un avis ou à un follow.
3. Pas d'abonnement propre YATRA. Pas de moteur de jeux local (KRIDA only). Pas de nouveau webhook Stripe. Pas de promesse de gains chiffrée. Pas de claim médical. `/graphify` interdit.
4. Aucun gain de mobilité activé tant que l'anti-fraude n'est pas testée et verte.

## ORDRE DE MARCHE

0. Audit existant + statut V2 → `task_plan.md`
1. (si nécessaire) Exécution/complétion V2 dans l'ordre de son brief
2. Mise aux normes §1
3. Recherche langage naturel + IA YATRA (§3)
4. Mobilité propre + anti-fraude (§2)
5. Radar gratuit & aides locales (§6)
6. Moteur zéro-coût hybride (§4)
7. Surprise parfaite (§10)
8. Achat groupé (§5)
9. Naturel & soins (§7)
10. Humanitaire & missions + branchement KRIDA (§8)
11. QR codes & pub transports (§9)
12. Multisensoriel (§11) + Accessibilité/i18n (§12) + Paiements (§13)
13. Boucle Directeur Artistique ≥ 9 + tests + livraison

## TESTS & LIVRAISON

- Protocole 5 niveaux CLAUDE.md (unit → feature → intégration → E2E → CLIENT-SIM) + audit visuel Playwright 3 viewports : chaque bouton/lien cliqué, screenshots vérifiés — interdiction de déclarer OK sans preuve.
- **Critères critiques** : zéro régression sur les 73 routes + V2 ; anti-fraude mobilité testée avec scénarios de triche ; plafonds de gains jamais dépassés (réconciliation quotidienne verte) ; radar retourne toujours des résultats 0€ ; axe 0 erreur critique ; i18n 100% des clés ; Lighthouse ≥ 95.
- Règles permanentes : après validation du plan, ne jamais s'arrêter entre les phases — enchaîner jusqu'à 100% (seuls les vrais choix business/légaux irréversibles remontent) ; crédits API Anthropic = documenter une fois dans task_plan.md et continuer, validation groupée à l'audit final ; R06 suppositions flaggées, R07 failles logiques signalées.
- Livraison : déploiement Vercel prod + `YATRA_V3_DONE.md` (état final, preuves, backlog V3.1 : module natif Expo mobilité en arrière-plan).
