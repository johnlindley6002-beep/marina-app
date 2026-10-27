import type { Dictionary } from "../../types";

export const staffLogin: Dictionary["staffLogin"] = {
  title: "Acesso da equipa",
  intro:
    "Introduza o seu email de trabalho e enviamos-lhe uma ligação de acesso. As contas da equipa são criadas por convite da sua marina.",
  email: "Email de trabalho",
  send: "Enviar ligação de acesso",
  sending: "A enviar",
  errEmail: "Introduza um endereço de email como nome@exemplo.com.",
  sent: (email) =>
    `Se ${email} pertencer a uma conta da equipa, a ligação de acesso vai a caminho. Abra-a neste dispositivo. Só funciona uma vez.`,
  tooMany: "Foram pedidas demasiadas ligações. Aguarde um minuto e tente novamente.",
  failed: "Não foi possível enviar a ligação. Verifique a ligação à internet e tente novamente.",
  linkFailed:
    "Essa ligação de acesso não funcionou. Pode ter expirado ou já ter sido usada. Peça uma nova abaixo.",
  notStaffTitle: "Sem acesso de equipa",
  notStaff: (email) =>
    `${email} tem sessão iniciada, mas não pertence à equipa de nenhuma marina. Peça um convite ao administrador da sua marina.`,
  signOut: "Terminar sessão",
  signedInAs: (email) => `Sessão iniciada como ${email}`,
};
