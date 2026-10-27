import type { Dictionary } from "../../types";

export const staffLogin: Dictionary["staffLogin"] = {
  title: "Acceso del personal",
  intro:
    "Introduzca su email de trabajo y le enviaremos un enlace de acceso. Las cuentas del personal se crean por invitación de su marina.",
  email: "Email de trabajo",
  send: "Enviar enlace de acceso",
  sending: "Enviando",
  errEmail: "Introduzca una dirección de email como nombre@ejemplo.com.",
  sent: (email) =>
    `Si ${email} pertenece a una cuenta del personal, el enlace de acceso está en camino. Ábralo en este dispositivo. Solo funciona una vez.`,
  tooMany: "Se han pedido demasiados enlaces. Espere un minuto e inténtelo de nuevo.",
  failed: "No se pudo enviar el enlace. Compruebe su conexión e inténtelo de nuevo.",
  linkFailed:
    "Ese enlace de acceso no ha funcionado. Puede haber caducado o ya se ha usado. Pida uno nuevo abajo.",
  notStaffTitle: "Sin acceso de personal",
  notStaff: (email) =>
    `${email} ha iniciado sesión, pero no forma parte del personal de ninguna marina. Pida una invitación al administrador de su marina.`,
  signOut: "Cerrar sesión",
  signedInAs: (email) => `Sesión iniciada como ${email}`,
};
