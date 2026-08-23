import type { LegalAppConfig } from './types';
import { buildCompanyInfo, buildMediateurInfo } from './company';

/**
 * Config légale YATRA (NIYAMA — famille karma_wellness : l'app redistribue une part
 * du CA aux utilisateurs). aPaiement=true (Stripe checkout réel, cf src/lib/stripe.ts) ;
 * aChatIA=true (Aria, assistant conversationnel réel, cf src/app/dashboard/aria).
 */
export const YATRA_LEGAL_CONFIG: LegalAppConfig = {
  slug: 'yatra',
  nom: 'YATRA',
  domaine: 'yatra.purama.dev',
  famille: 'karma_wellness',
  company: buildCompanyInfo(),
  mediateur: buildMediateurInfo(),
  descriptionActivite:
    'YATRA permet de suivre ses trajets de mobilité propre, de recevoir des Vida Credits convertibles, ' +
    "de découvrir et d'activer des aides publiques et droits personnels, et d'échanger avec Aria, " +
    'assistante IA de conscience voyage.',
  aPaiement: true,
  aChatIA: true,
  clausesSpecifiquesCgu: [
    {
      titre: 'Abonnement',
      paragraphes: [
        "YATRA propose un plan Découverte gratuit (visualisation seule, pas de tracking) et un plan Premium payant, dont le détail tarifaire figure dans les Conditions générales de vente.",
      ],
    },
    {
      titre: 'Redistribution du chiffre d\'affaires',
      paragraphes: [
        "Chaque mois, le chiffre d'affaires généré par les abonnements est réparti ainsi : 50 % redistribués aux utilisateurs sous forme de Vida Credits (Score d'Humanité), 10 % versés à l'Association PURAMA, 40 % conservés par SASU PURAMA. Cette répartition est calculée et exécutée via Treezor (établissement de monnaie électronique agréé ACPR, partenaire Société Générale).",
      ],
    },
    {
      titre: 'Anti-fraude',
      paragraphes: [
        "YATRA détecte les usages frauduleux du tracking de mobilité (ex. téléphone en voiture déclaré comme trajet vélo) via capteurs (accéléromètre, gyroscope, GPS) et apprentissage automatique exécuté localement. Toute fraude avérée entraîne l'annulation des Vida Credits concernés et, en cas de récidive, la suspension du compte.",
      ],
    },
    {
      titre: 'Wallet et retraits',
      paragraphes: [
        "Les Vida Credits crédités sont retirables dès 5 € via Treezor SEPA instant. Une vérification d'identité (KYC) est requise au-delà de 1 000 € cumulés, conformément aux obligations de lutte contre le blanchiment et le financement du terrorisme (LCB-FT).",
      ],
    },
    {
      titre: 'Âge minimum',
      paragraphes: [
        "YATRA est réservé aux personnes majeures (18 ans), conformément à la clause d'inscription des présentes CGU. Le service comportant un wallet retirable (Vida Credits) et des paiements réels (abonnement Premium), aucune inscription de mineur, même avec autorisation parentale, n'est acceptée à ce jour.",
      ],
    },
    {
      titre: 'Voyages et hébergements — rôle d\'affiliation uniquement',
      paragraphes: [
        "YATRA n'est ni une agence de voyages ni un opérateur de vente de voyages ou de séjours au sens du Code du tourisme : la plateforme ne vend, ne réserve et n'encaisse aucun voyage, transport, hébergement ou séjour pour le compte de l'utilisateur.",
        "Les fonctionnalités « Vacances » se limitent à : (i) le suivi d'un lien de réservation que l'utilisateur a lui-même effectuée ailleurs, (ii) la journalisation d'usages de house-sitting, d'échange de logement ou de volontariat entre particuliers, sans transaction opérée par YATRA, et (iii) l'affiliation vers des partenaires cashback tiers, rémunérée en commission.",
        "Tant que YATRA n'est pas immatriculée au registre des opérateurs de voyages et de séjours (Atout France) et ne dispose pas de la garantie financière correspondante, aucune fonctionnalité de réservation directe, d'encaissement de voyage ou de vente de séjour ne sera activée sur la plateforme.",
      ],
    },
  ],
  clausesSpecifiquesCgv: [
    {
      titre: 'Offres et tarifs',
      paragraphes: [
        "Plan Découverte : gratuit, sans tracking de trajets.",
        "Plan Premium mensuel : 9,99 €/mois (8,99 € le premier mois).",
        "Plan Premium annuel : 71,93 €/an, soit l'équivalent de 5,99 €/mois (–30 % vs mensuel).",
        "Offre anti-churn : en cas de désabonnement, un tarif à vie de 4,99 €/mois peut être proposé au Client sur l'écran d'annulation, à titre exceptionnel et non cumulable avec d'autres offres.",
      ],
    },
  ],
};
