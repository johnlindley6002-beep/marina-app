import type { Dictionary } from "../../types";

export const account: Dictionary["account"] = {
  title: "Conta",
  signedInAs: (name) => `Sessão iniciada como ${name}.`,
  mockNote: "Demonstração: são dados de exemplo e nada é guardado num servidor.",
  profile: "Perfil",
  name: "Nome",
  email: "Email",
  phone: "Telefone",
  save: "Guardar alterações",
  errName: "Indique o seu nome.",
  errEmail: "Indique um endereço de email como nome@exemplo.com.",
  saved: "Guardado neste dispositivo.",
  saveFailed: "Não foi possível guardar. O seu navegador está a bloquear o armazenamento.",
  skipperNote: "Os dados do comandante usados nos seus pedidos ficam guardados à parte em",
  roles: "As suas funções",
  roleCopy: {
    voyager: {
      title: "Visitante",
      how: "Registou-se como visitante. É a função de todos por predefinição.",
    },
    owner: {
      title: "Titular do posto de amarração",
      how: "Atribuída porque uma marina associou um posto de amarração a si. Não pode ser acrescentada nem retirada aqui.",
    },
    staff: {
      title: "Equipa da marina",
      how: "Atribuída porque uma marina o convidou e aceitou. Não pode ser acrescentada nem retirada aqui.",
    },
  },
  howRolesWork: "Como funcionam as funções",
  rules: [
    "Qualquer pessoa se pode registar como visitante.",
    "A função de titular do posto de amarração só é atribuída quando uma marina associa um posto a si.",
    "A função de equipa só é atribuída quando uma marina o convida e aceita.",
  ],
  ownerMode: "Modo titular do posto",
  ownerModeBody:
    "Use o seletor Visitante e Titular do posto no canto inferior esquerdo para alternar entre reservar como visitante e gerir o seu posto de amarração.",
  goToMyBerth: "Ir para O meu posto",
};
