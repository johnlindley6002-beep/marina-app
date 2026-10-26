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
      title: "Viajante",
      how: "Registou-se como viajante. É a função de todos por predefinição.",
    },
    owner: {
      title: "Titular",
      how: "Atribuída porque uma marina associou um posto de amarração a si. Não pode ser acrescentada nem retirada aqui.",
    },
    staff: {
      title: "Equipa da marina",
      how: "Atribuída porque uma marina o convidou e aceitou. Não pode ser acrescentada nem retirada aqui.",
    },
  },
  howRolesWork: "Como funcionam as funções",
  rules: [
    "Qualquer pessoa se pode registar como viajante.",
    "A função de titular só é atribuída quando uma marina associa um posto de amarração a si.",
    "A função de equipa só é atribuída quando uma marina o convida e aceita.",
  ],
  ownerMode: "Modo titular",
  ownerModeBody:
    "Use o seletor Visitante e Titular na barra superior para alternar entre reservar como visitante e gerir o posto de amarração de que é titular.",
  goToMyBerth: "Ir para O meu posto",
};
