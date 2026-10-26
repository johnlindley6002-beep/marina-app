import type { Dictionary } from "../../types";

export const chrome: Dictionary["chrome"] = {
  skipToContent: "Saltar al contenido",
  privacyNote:
    "aldock no tiene cuentas. Los datos del barco, las marinas guardadas y su última solicitud se guardan solo en este navegador. Cuando envía una solicitud, su propia aplicación de correo la envía directamente a la marina y aldock no recibe copia. Los números de pasaporte y otros datos privados son opcionales y se pueden dar al personal en persona.",
  nav: {
    main: "Principal",
    breadcrumb: "Ruta de navegación",
    footer: "Pie de página",
    ownerHome: "Mi amarre",
  },
  account: {
    account: "Cuenta",
    staffArea: "Área del personal",
    signOut: "Cerrar sesión",
    menuFor: (name) => `Menú de la cuenta de ${name}`,
  },
  mode: { label: "Modo", guest: "Visitante", owner: "Titular" },
  gate: {
    back: "Volver a las marinas",
    signInTitle: "Inicie sesión para continuar",
    signedOutDemo:
      "No ha iniciado sesión. Esto es una demostración: use el selector de abajo a la izquierda para entrar con una cuenta de ejemplo.",
    notAvailable:
      "No ha iniciado sesión. El inicio de sesión no está disponible en esta vista previa.",
    ownerTitle: "El modo titular no está disponible",
    ownerLocked:
      "El modo titular está disponible cuando una marina vincula su amarre a su cuenta. No puede añadirlo usted mismo.",
    staffTitle: "Área del personal",
    staffLocked:
      "El área del personal es para el personal de la marina que ha aceptado la invitación de su marina.",
  },
  share: {
    share: "Compartir",
    copied: "Enlace copiado",
    failed: "No se pudo copiar. Copie la dirección de la barra del navegador.",
  },
  discovery: {
    region: "Región",
    any: "Cualquiera",
    priceBand: "Rango de precio",
    boatLength: (unit) => `Eslora del barco (${unit})`,
    facilities: "Instalaciones",
    noMatch: "Ninguna marina coincide con estos filtros. Pruebe con menos filtros.",
    protection: "Abrigo",
    startEnquiry: "Hacer una solicitud",
    remove: "Quitar",
  },
};
