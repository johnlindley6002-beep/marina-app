import type { Dictionary } from "../../types";

export const chrome: Dictionary["chrome"] = {
  skipToContent: "Saltar para o conteúdo",
  privacyNote:
    "A aldock não tem contas. Os dados da embarcação, as marinas guardadas e o seu último pedido ficam guardados apenas neste navegador. Quando envia um pedido, a sua própria aplicação de email envia-o diretamente à marina e a aldock não recebe cópia. Os números de passaporte e outros dados privados são opcionais e podem ser entregues ao pessoal em mão.",
  nav: {
    main: "Principal",
    breadcrumb: "Localização no site",
    footer: "Rodapé",
    ownerHome: "O meu posto",
  },
  account: {
    account: "Conta",
    staffArea: "Área da equipa",
    signOut: "Terminar sessão",
    menuFor: (name) => `Menu da conta de ${name}`,
  },
  mode: { label: "Modo", guest: "Visitante", owner: "Titular" },
  gate: {
    back: "Voltar às marinas",
    signInTitle: "Inicie sessão para continuar",
    signedOutDemo:
      "Não tem sessão iniciada. Isto é uma demonstração: use o seletor no canto inferior esquerdo para entrar com uma conta de exemplo.",
    notAvailable:
      "Não tem sessão iniciada. O início de sessão não está disponível nesta pré-visualização.",
    ownerTitle: "O modo titular não está disponível",
    ownerLocked:
      "O modo titular fica disponível quando a marina associa o seu posto de amarração à sua conta. Não o pode adicionar sozinho.",
    staffTitle: "Área da equipa",
    staffLocked:
      "A área da equipa é para o pessoal da marina que aceitou o convite da respetiva marina.",
  },
  share: {
    share: "Partilhar",
    copied: "Ligação copiada",
    failed: "Não foi possível copiar. Copie o endereço da barra do navegador.",
  },
  discovery: {
    region: "Região",
    any: "Qualquer",
    priceBand: "Escalão de preço",
    boatLength: (unit) => `Comprimento da embarcação (${unit})`,
    facilities: "Instalações",
    noMatch: "Nenhuma marina corresponde a estes filtros. Experimente menos filtros.",
    protection: "Abrigo",
    startEnquiry: "Fazer um pedido",
    remove: "Remover",
  },
};
