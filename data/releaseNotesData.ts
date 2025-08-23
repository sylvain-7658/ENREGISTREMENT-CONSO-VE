export interface ReleaseNote {
  version: string;
  date: string; // YYYY-MM-DD
  changes: string[];
}

export const releaseNotes: ReleaseNote[] = [
  {
    version: '6.0.0',
    date: '2025-09-02',
    changes: [
      "Mise à jour du nom de l'application en 'SUIVI CONSO-FUN&LEC'.",
      "Mise à jour de la version majeure.",
    ],
  },
  {
    version: '5.5.0',
    date: '2025-09-01',
    changes: [
      "Recherche IA pour la capacité de la batterie : Lors de l'ajout d'un véhicule 'Autre / Personnalisé', un bouton de recherche par IA (icône étoile) permet de trouver et remplir automatiquement la capacité de la batterie.",
      "Amélioration de l'ergonomie : Ajout d'un texte explicatif pour guider l'utilisateur sur la fonctionnalité de recherche par IA.",
    ],
  },
  {
    version: '5.4.0',
    date: '2025-08-31',
    changes: [
      "Amélioration du flux d'envoi d'e-mail : une fenêtre de confirmation guide désormais l'utilisateur pour l'envoi de la pièce jointe après le téléchargement.",
      "Ajout de la section 'Notice' d'utilisation pour guider les utilisateurs à travers les fonctionnalités de l'application.",
      "Ajout d'une section 'Informations Légales' (CGU, CGV, etc.) accessible depuis les paramètres.",
    ],
  },
  {
    version: '5.3.0',
    date: '2025-08-30',
    changes: [
      "Ajout de la section 'Notes de version' pour suivre l'historique des mises à jour de l'application.",
    ],
  },
  {
    version: '5.2.0',
    date: '2025-08-29',
    changes: [
      "Fiabilité des coûts : Le prix du kWh est maintenant sauvegardé avec chaque recharge pour préserver l'historique des coûts, même si les tarifs sont modifiés plus tard.",
    ],
  },
  {
    version: '5.1.0',
    date: '2025-08-28',
    changes: [
      "Précision des calculs : Correction majeure du calcul de la consommation moyenne (kWh/100km) et du coût au 100km, en particulier lors du filtrage par type de tarif.",
      "La logique associe désormais correctement l'énergie d'une recharge au trajet qui la suit.",
    ],
  },
   {
    version: '5.0.0',
    date: '2025-08-20',
    changes: [
      "Migration vers Firebase pour le stockage des données en ligne et la synchronisation multi-appareils.",
      "Introduction de l'authentification des utilisateurs.",
      "Refonte de l'interface utilisateur pour une meilleure expérience.",
    ],
  },
];