import type { Dictionary } from "../../types";

export const accounts: Dictionary["accounts"] = {
  gate: {
    signInTitle: "Inicie sessão para continuar",
    signInBody: "Inicie sessão com o seu email para ver esta página.",
    signInLink: "Iniciar sessão",
  },
  privacyNote:
    "A aldock guarda na sua conta o que guarda: os seus barcos, documentos e dados do comandante, e os pedidos que envia a uma marina. Só você e a marina a que envia um pedido os podem ver. Os números de passaporte e outros dados privados são opcionais e podem ser dados à equipa em pessoa. Sem iniciar sessão, os dados do barco e as marinas guardadas ficam neste navegador.",
  nav: {
    signIn: "Iniciar sessão",
    myArrivals: "As minhas chegadas",
  },
  login: {
    title: "Iniciar sessão",
    intro:
      "Indique o seu email e enviamos-lhe uma ligação. Abra-a para iniciar sessão. Não há palavra-passe. Se é novo aqui, a mesma ligação cria a sua conta.",
    emailLabel: "Email",
    send: "Enviar-me uma ligação de acesso",
    sending: "A enviar",
    errEmail: "Indique um endereço de email como nome@exemplo.com.",
    sentTitle: "Verifique o seu email",
    sentBody: (email) =>
      `Enviámos uma ligação de acesso para ${email}. Abra-a neste dispositivo. Funciona uma vez e expira ao fim de uma hora.`,
    useAnother: "Usar outro email",
    tooMany: "Foram pedidas demasiadas ligações. Aguarde um minuto e tente de novo.",
    failed: "Não foi possível enviar a ligação. Verifique a ligação à internet e tente de novo.",
    linkProblem:
      "Essa ligação não funcionou. Pode ter expirado ou já ter sido usada. Envie a si próprio uma nova abaixo.",
    previewNote:
      "O acesso por email está desligado nesta pré-visualização. Use o seletor Mock, em baixo à esquerda, para entrar como conta de exemplo.",
    signedIn: (name) => `Sessão iniciada como ${name}.`,
    continue: "Continuar",
    privacy:
      "Usamos o seu email apenas para iniciar a sua sessão e para a marina lhe responder aqui.",
  },
  profile: {
    nationality: "Nacionalidade",
    nationalityChoose: "Escolha um país",
    euStatus: "UE ou não UE",
    euStatusChoose: "Escolher",
    eu: "UE",
    nonEu: "Não UE",
    euNote:
      "Onde reside, para as regras de alfândega e de fronteiras. Ajuda a marina a preparar a sua chegada.",
    emailFixed: "Este é o email com que inicia sessão. Não pode ser alterado aqui.",
    saved: "Guardado na sua conta.",
    saveFailed: "Não foi possível guardar na sua conta. Verifique a ligação e tente de novo.",
  },
  myBoat: {
    intro:
      "Guarde o seu barco uma vez e todos os formulários da aldock ficam preenchidos. Os seus barcos, documentos e dados do comandante ficam na sua conta e acompanham-no em todos os dispositivos.",
    deviceNote:
      "Só você e a marina a que envia um pedido podem ver isto. Os documentos do barco aqui são notas, nunca ficheiros.",
    removeQuestion: (name) => `Remover ${name} e os seus documentos da sua conta?`,
    saved: (name) => `${name} guardado na sua conta.`,
    documentsSaved: "Documentos guardados na sua conta.",
    savedOnDevice: "Guardado na sua conta.",
    dataHeading: "Os seus dados guardados",
    clearWarning:
      "Isto remove os seus barcos e documentos da sua conta, e as marinas guardadas e o último pedido deste dispositivo. O nome, o telefone, as unidades e o idioma mantêm-se.",
    clearAll: "Apagar os meus barcos e dados guardados",
    cleared: "Os seus barcos e dados guardados foram removidos.",
    syncFailed:
      "A sua última alteração não foi guardada na sua conta. Verifique a ligação e tente de novo.",
    signInPrompt:
      "Inicie sessão para manter os seus barcos na sua conta e usá-los em qualquer dispositivo. O que guardar antes de iniciar sessão passa para a sua conta.",
    signInLink: "Iniciar sessão",
  },
  request: {
    intro: (marina) =>
      `Envia o seu pedido a ${marina}. A marina responde aqui, em As minhas chegadas.`,
    note: "A marina confirma um posto de amarração para as suas datas e responde em As minhas chegadas.",
    goesToMarina: "O seu pedido chega à marina através da sua conta.",
    send: "Enviar pedido",
    sending: "A enviar",
    signInTitle: "Inicie sessão para enviar um pedido",
    signInBody:
      "Os pedidos chegam à marina através da sua conta, para que possa seguir a resposta em As minhas chegadas.",
    signInLink: "Iniciar sessão",
    sentTitle: "Pedido enviado",
    sentBody: (marina) =>
      `${marina} recebeu o seu pedido. Aparece como Pedido em As minhas chegadas até a marina responder.`,
    viewArrivals: "Ver as minhas chegadas",
    emailToo: "Enviar também um email à marina",
    emailTooNote: "Opcional. A sua aplicação de email envia uma cópia do pedido.",
    summaryNote: "Esta é uma cópia do que enviou. Pode também enviá-la por email à marina.",
  },
  arrivals: {
    title: "As minhas chegadas",
    intro:
      "Os seus pedidos de posto de amarração e em que ponto está cada um. A marina responde aqui.",
    previewNote:
      "Esta pré-visualização não tem serviço de contas, por isso os pedidos não ficam guardados. O acesso e os pedidos funcionam no site real.",
    empty: "Ainda não enviou nenhum pedido. Encontre uma marina e peça um posto de amarração.",
    findMarina: "Encontrar uma marina",
    loading: "A carregar os seus pedidos",
    loadFailed: "Não foi possível carregar os seus pedidos. Verifique a ligação e tente de novo.",
    refresh: "Tentar de novo",
    list: "Os seus pedidos",
    status: {
      requested: "Pedido",
      confirmed: "Confirmado",
      declined: "Recusado",
      arrived: "Chegou",
      departed: "Partiu",
      dates_proposed: "Outras datas propostas",
    },
    help: {
      requested: "A marina recebeu o seu pedido e vai responder aqui.",
      confirmed: (berth) => `A marina confirmou a sua estadia. O seu posto é o ${berth}.`,
      confirmedNoBerth: "A marina confirmou a sua estadia e indica-lhe o posto à chegada.",
      declined: "A marina não pode aceitar este pedido.",
      arrived: (berth) => (berth ? `Fez o check-in no posto ${berth}.` : "Fez o check-in."),
      departed: "Esta estadia terminou.",
      dates_proposed: "A marina não pode aceitar as suas datas e propôs outras.",
    },
    boat: "Barco",
    stay: "Estadia",
    sent: (date) => `Enviado a ${date}`,
    reason: (text) => `Motivo: ${text}`,
    note: (text) => `Nota da marina: ${text}`,
    proposedTitle: "Datas propostas pela marina",
    accept: "Aceitar estas datas",
    accepting: "A enviar",
    accepted: "Aceitou as novas datas. A marina vai confirmar um posto de amarração.",
    openEnded: (from) => `A partir de ${from}, sem data de saída`,
    range: (from, to) => `${from} a ${to}`,
  },
  errors: {
    not_signed_in: "Inicie sessão para continuar.",
    too_many_requests:
      "Já tem cinco pedidos à espera de resposta. Aguarde que a marina responda antes de enviar outro.",
    boat_not_found:
      "Não encontrámos esse barco na sua conta. Guarde-o em O meu barco e tente de novo.",
    invalid_dates:
      "Verifique as datas. A chegada não pode ser no passado e a partida não pode ser antes dela.",
    too_many_boats: "Pode ter até 20 barcos na sua conta.",
    no_proposal: "A marina não tem outras datas à sua espera.",
    not_found: "Não encontrámos esse pedido.",
    unknown: "Algo correu mal. Verifique a ligação e tente de novo.",
  },
};
