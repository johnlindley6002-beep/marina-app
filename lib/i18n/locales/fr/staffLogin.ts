import type { Dictionary } from "../../types";

export const staffLogin: Dictionary["staffLogin"] = {
  title: "Connexion du personnel",
  intro:
    "Saisissez votre email professionnel et nous vous enverrons un lien de connexion. Les comptes du personnel sont créés sur invitation de votre marina.",
  email: "Email professionnel",
  send: "Envoyer le lien de connexion",
  sending: "Envoi en cours",
  errEmail: "Saisissez une adresse email comme nom@exemple.com.",
  sent: (email) =>
    `Si ${email} correspond à un compte du personnel, un lien de connexion est en route. Ouvrez-le sur cet appareil. Il ne fonctionne qu'une fois.`,
  tooMany: "Trop de liens ont été demandés. Patientez une minute et réessayez.",
  failed: "Impossible d'envoyer le lien. Vérifiez votre connexion et réessayez.",
  linkFailed:
    "Ce lien de connexion n'a pas fonctionné. Il a peut-être expiré ou déjà été utilisé. Demandez-en un nouveau ci-dessous.",
  notStaffTitle: "Pas d'accès du personnel",
  notStaff: (email) =>
    `${email} est connecté mais ne fait partie du personnel d'aucune marina. Demandez une invitation à l'administrateur de votre marina.`,
  signOut: "Se déconnecter",
  signedInAs: (email) => `Connecté en tant que ${email}`,
};
