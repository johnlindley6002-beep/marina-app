import type { Dictionary } from "../../types";

export const account: Dictionary["account"] = {
  title: "Cuenta",
  signedInAs: (name) => `Sesión iniciada como ${name}.`,
  mockNote: "Demostración: son datos de ejemplo y no se guarda nada en un servidor.",
  profile: "Perfil",
  name: "Nombre",
  email: "Correo electrónico",
  phone: "Teléfono",
  save: "Guardar cambios",
  errName: "Introduzca su nombre.",
  errEmail: "Introduzca un correo electrónico como nombre@ejemplo.com.",
  saved: "Guardado en este dispositivo.",
  saveFailed: "No se pudo guardar. Su navegador bloquea el almacenamiento.",
  skipperNote: "Los datos del patrón con los que se rellenan sus solicitudes se guardan aparte en",
  roles: "Sus funciones",
  roleCopy: {
    voyager: {
      title: "Navegante",
      how: "Se registró como navegante. Es la función por defecto de todos.",
    },
    owner: {
      title: "Titular",
      how: "Se concede porque una marina vinculó un amarre a usted. No se puede añadir ni quitar desde aquí.",
    },
    staff: {
      title: "Personal de la marina",
      how: "Se concede porque una marina le invitó y usted aceptó. No se puede añadir ni quitar desde aquí.",
    },
  },
  howRolesWork: "Cómo funcionan las funciones",
  rules: [
    "Cualquiera puede registrarse como navegante.",
    "La función de titular solo se concede cuando una marina vincula un amarre a usted.",
    "La función de personal solo se concede cuando una marina le invita y usted acepta.",
  ],
  ownerMode: "Modo titular",
  ownerModeBody:
    "Use el selector Visitante y Titular de la barra superior para pasar de reservar como visitante a gestionar el amarre que usted tiene.",
  goToMyBerth: "Ir a Mi amarre",
};
