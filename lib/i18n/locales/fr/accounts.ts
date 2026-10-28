import type { Dictionary } from "../../types";

export const accounts: Dictionary["accounts"] = {
  gate: {
    signInTitle: "Connectez-vous pour continuer",
    signInBody: "Connectez-vous avec votre e-mail pour voir cette page.",
    signInLink: "Se connecter",
  },
  privacyNote:
    "aldock garde dans votre compte ce que vous enregistrez : vos bateaux, documents et coordonnées du skipper, et les demandes que vous envoyez à une marina. Seuls vous et la marina à laquelle vous envoyez une demande pouvez les voir. Les numéros de passeport et autres données privées sont facultatifs et peuvent être remis au personnel en personne. Sans connexion, les données du bateau et les marinas enregistrées restent dans ce navigateur.",
  nav: {
    signIn: "Se connecter",
    myArrivals: "Mes arrivées",
  },
  login: {
    title: "Se connecter",
    intro:
      "Saisissez votre e-mail et nous vous envoyons un lien. Ouvrez-le pour vous connecter. Il n'y a pas de mot de passe. Si vous êtes nouveau, le même lien crée votre compte.",
    emailLabel: "E-mail",
    send: "M'envoyer un lien de connexion",
    sending: "Envoi en cours",
    errEmail: "Saisissez une adresse e-mail comme nom@exemple.com.",
    sentTitle: "Vérifiez votre e-mail",
    sentBody: (email) =>
      `Nous avons envoyé un lien de connexion à ${email}. Ouvrez-le sur cet appareil. Il ne fonctionne qu'une fois et expire au bout d'une heure.`,
    useAnother: "Utiliser un autre e-mail",
    tooMany: "Trop de liens ont été demandés. Attendez une minute et réessayez.",
    failed: "Nous n'avons pas pu envoyer le lien. Vérifiez votre connexion et réessayez.",
    linkProblem:
      "Ce lien n'a pas fonctionné. Il a peut-être expiré ou déjà été utilisé. Envoyez-vous-en un nouveau ci-dessous.",
    previewNote:
      "La connexion par e-mail est désactivée dans cet aperçu. Utilisez le sélecteur Mock, en bas à gauche, pour entrer avec un compte d'exemple.",
    signedIn: (name) => `Vous êtes connecté en tant que ${name}.`,
    continue: "Continuer",
    privacy:
      "Nous utilisons votre e-mail uniquement pour vous connecter, et pour que la marina vous réponde ici.",
  },
  profile: {
    nationality: "Nationalité",
    nationalityChoose: "Choisir un pays",
    euStatus: "UE ou hors UE",
    euStatusChoose: "Choisir",
    eu: "UE",
    nonEu: "Hors UE",
    euNote:
      "Où vous résidez, pour les règles de douane et de frontière. Cela aide la marina à préparer votre arrivée.",
    emailFixed: "C'est l'e-mail avec lequel vous vous connectez. Il ne peut pas être modifié ici.",
    saved: "Enregistré dans votre compte.",
    saveFailed:
      "Impossible d'enregistrer dans votre compte. Vérifiez votre connexion et réessayez.",
  },
  myBoat: {
    intro:
      "Enregistrez votre bateau une fois et tous les formulaires d'aldock se remplissent seuls. Vos bateaux, documents et coordonnées du skipper sont gardés dans votre compte et vous suivent sur tous vos appareils.",
    deviceNote:
      "Seuls vous et la marina à laquelle vous envoyez une demande pouvez les voir. Les documents du bateau sont des notes, jamais des fichiers.",
    removeQuestion: (name) => `Retirer ${name} et ses documents de votre compte ?`,
    saved: (name) => `${name} enregistré dans votre compte.`,
    documentsSaved: "Documents enregistrés dans votre compte.",
    savedOnDevice: "Enregistré dans votre compte.",
    dataHeading: "Vos données enregistrées",
    clearWarning:
      "Cela retire vos bateaux et documents de votre compte, ainsi que les marinas enregistrées et la dernière demande de cet appareil. Votre nom, téléphone, unités et langue sont conservés.",
    clearAll: "Effacer mes bateaux et données enregistrés",
    cleared: "Vos bateaux et données enregistrés ont été retirés.",
    syncFailed:
      "Votre dernière modification n'a pas pu être enregistrée dans votre compte. Vérifiez votre connexion et réessayez.",
    signInPrompt:
      "Connectez-vous pour garder vos bateaux dans votre compte et les utiliser sur n'importe quel appareil. Ce que vous enregistrez avant de vous connecter passe dans votre compte.",
    signInLink: "Se connecter",
  },
  request: {
    intro: (marina) => `Envoie votre demande à ${marina}. La marina répond ici, dans Mes arrivées.`,
    note: "La marina confirme une place pour vos dates et répond dans Mes arrivées.",
    goesToMarina: "Votre demande arrive à la marina par votre compte.",
    send: "Envoyer la demande",
    sending: "Envoi en cours",
    signInTitle: "Connectez-vous pour envoyer une demande",
    signInBody:
      "Les demandes arrivent à la marina par votre compte, pour que vous suiviez la réponse dans Mes arrivées.",
    signInLink: "Se connecter",
    sentTitle: "Demande envoyée",
    sentBody: (marina) =>
      `${marina} a reçu votre demande. Elle apparaît comme Demandée dans Mes arrivées jusqu'à la réponse de la marina.`,
    viewArrivals: "Voir mes arrivées",
    emailToo: "Écrire aussi à la marina par e-mail",
    emailTooNote: "Facultatif. Votre application de messagerie envoie une copie de la demande.",
    summaryNote:
      "Ceci est une copie de ce que vous avez envoyé. Vous pouvez aussi l'envoyer par e-mail à la marina.",
  },
  arrivals: {
    title: "Mes arrivées",
    intro: "Vos demandes de place et où en est chacune. La marina répond ici.",
    previewNote:
      "Cet aperçu n'a pas de service de comptes, donc les demandes ne sont pas conservées. La connexion et les demandes fonctionnent sur le site réel.",
    empty: "Vous n'avez pas encore envoyé de demande. Trouvez une marina et demandez une place.",
    findMarina: "Trouver une marina",
    loading: "Chargement de vos demandes",
    loadFailed: "Nous n'avons pas pu charger vos demandes. Vérifiez votre connexion et réessayez.",
    refresh: "Réessayer",
    list: "Vos demandes",
    status: {
      requested: "Demandée",
      confirmed: "Confirmée",
      declined: "Refusée",
      arrived: "Arrivé",
      departed: "Parti",
      dates_proposed: "Autres dates proposées",
    },
    help: {
      requested: "La marina a votre demande et répondra ici.",
      confirmed: (berth) => `La marina a confirmé votre séjour. Votre place est la ${berth}.`,
      confirmedNoBerth:
        "La marina a confirmé votre séjour et vous indiquera votre place à l'arrivée.",
      declined: "La marina ne peut pas accepter cette demande.",
      arrived: (berth) =>
        berth ? `Vous êtes enregistré à la place ${berth}.` : "Vous êtes enregistré.",
      departed: "Ce séjour est terminé.",
      dates_proposed: "La marina ne peut pas accepter vos dates et en a proposé d'autres.",
    },
    boat: "Bateau",
    stay: "Séjour",
    sent: (date) => `Envoyée le ${date}`,
    reason: (text) => `Motif : ${text}`,
    note: (text) => `Note de la marina : ${text}`,
    proposedTitle: "Dates proposées par la marina",
    accept: "Accepter ces dates",
    accepting: "Envoi en cours",
    accepted: "Vous avez accepté les nouvelles dates. La marina confirmera une place.",
    openEnded: (from) => `À partir du ${from}, sans date de départ`,
    range: (from, to) => `${from} au ${to}`,
  },
  errors: {
    not_signed_in: "Connectez-vous pour continuer.",
    too_many_requests:
      "Vous avez déjà cinq demandes en attente de réponse. Attendez la réponse de la marina avant d'en envoyer une autre.",
    boat_not_found:
      "Nous n'avons pas trouvé ce bateau dans votre compte. Enregistrez-le dans Mon bateau et réessayez.",
    invalid_dates:
      "Vérifiez vos dates. L'arrivée ne peut pas être dans le passé, et le départ ne peut pas la précéder.",
    too_many_boats: "Vous pouvez garder jusqu'à 20 bateaux dans votre compte.",
    no_proposal: "La marina n'a pas d'autres dates en attente pour vous.",
    not_found: "Nous n'avons pas trouvé cette demande.",
    unknown: "Une erreur s'est produite. Vérifiez votre connexion et réessayez.",
  },
};
