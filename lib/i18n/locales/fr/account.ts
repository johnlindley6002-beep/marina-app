import type { Dictionary } from "../../types";

export const account: Dictionary["account"] = {
  title: "Compte",
  signedInAs: (name) => `Connecté en tant que ${name}.`,
  mockNote:
    "Démonstration : ce sont des données d'exemple et rien n'est enregistré sur un serveur.",
  profile: "Profil",
  name: "Nom",
  email: "E-mail",
  phone: "Téléphone",
  save: "Enregistrer les modifications",
  errName: "Saisissez votre nom.",
  errEmail: "Saisissez une adresse e-mail du type nom@exemple.com.",
  saved: "Enregistré sur cet appareil.",
  saveFailed: "Enregistrement impossible. Votre navigateur bloque le stockage.",
  skipperNote:
    "Les coordonnées du chef de bord utilisées pour préremplir vos demandes sont conservées à part dans",
  roles: "Vos rôles",
  roleCopy: {
    voyager: {
      title: "Visiteur",
      how: "Vous vous êtes inscrit comme visiteur. C'est le rôle par défaut de tout le monde.",
    },
    owner: {
      title: "Titulaire de la place",
      how: "Attribué parce qu'une marina a associé une place à votre compte. Il ne peut être ni ajouté ni retiré ici.",
    },
    staff: {
      title: "Personnel de la marina",
      how: "Attribué parce qu'une marina vous a invité et que vous avez accepté. Il ne peut être ni ajouté ni retiré ici.",
    },
  },
  howRolesWork: "Comment fonctionnent les rôles",
  rules: [
    "Tout le monde peut s'inscrire comme visiteur.",
    "Le rôle de titulaire de la place n'est attribué que lorsqu'une marina associe une place à votre compte.",
    "Le rôle de personnel n'est attribué que lorsqu'une marina vous invite et que vous acceptez.",
  ],
  ownerMode: "Mode titulaire de la place",
  ownerModeBody:
    "Utilisez le sélecteur Visiteur et Titulaire de la place en bas à gauche pour passer de la réservation en tant que visiteur à la gestion de votre place.",
  goToMyBerth: "Aller à Ma place",
};
