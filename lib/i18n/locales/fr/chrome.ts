import type { Dictionary } from "../../types";

export const chrome: Dictionary["chrome"] = {
  skipToContent: "Aller au contenu",
  privacyNote:
    "aldock n'a pas de comptes. Les données du bateau, les marinas enregistrées et votre dernière demande sont conservées uniquement dans ce navigateur. Quand vous envoyez une demande, votre propre application de messagerie l'envoie directement à la marina et aldock n'en reçoit pas de copie. Les numéros de passeport et autres données privées sont facultatifs et peuvent être remis au personnel en personne.",
  nav: {
    main: "Principale",
    breadcrumb: "Fil d'Ariane",
    footer: "Pied de page",
    ownerHome: "Ma place",
  },
  account: {
    account: "Compte",
    staffArea: "Espace du personnel",
    signOut: "Se déconnecter",
    menuFor: (name) => `Menu du compte de ${name}`,
  },
  mode: { label: "Mode", guest: "Visiteur", owner: "Titulaire de la place" },
  gate: {
    back: "Retour aux marinas",
    signInTitle: "Connectez-vous pour continuer",
    signedOutDemo:
      "Vous n'êtes pas connecté. Ceci est une démonstration : utilisez le sélecteur en bas à gauche pour vous connecter avec un compte d'exemple.",
    notAvailable: "Vous n'êtes pas connecté. La connexion n'est pas disponible dans cet aperçu.",
    ownerTitle: "Le mode titulaire n'est pas disponible",
    ownerLocked:
      "Le mode titulaire est disponible quand une marina associe votre place à votre compte. Vous ne pouvez pas l'ajouter vous-même.",
    staffTitle: "Espace du personnel",
    staffLocked:
      "L'espace du personnel est réservé au personnel de la marina ayant accepté l'invitation de sa marina.",
  },
  share: {
    share: "Partager",
    copied: "Lien copié",
    failed: "Copie impossible. Copiez l'adresse depuis la barre du navigateur.",
  },
  discovery: {
    region: "Région",
    any: "Toutes",
    priceBand: "Gamme de prix",
    boatLength: (unit) => `Longueur du bateau (${unit})`,
    facilities: "Équipements",
    noMatch: "Aucune marina ne correspond à ces filtres. Essayez-en moins.",
    protection: "Abri",
    startEnquiry: "Faire une demande",
    remove: "Retirer",
  },
};
