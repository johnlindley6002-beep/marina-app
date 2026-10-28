import type { Dictionary } from "../../types";

export const accounts: Dictionary["accounts"] = {
  gate: {
    signInTitle: "Inicia sesión para continuar",
    signInBody: "Inicia sesión con tu correo para ver esta página.",
    signInLink: "Iniciar sesión",
  },
  privacyNote:
    "aldock guarda en tu cuenta lo que guardas: tus barcos, documentos y datos del patrón, y las solicitudes que envías a una marina. Solo tú y la marina a la que envías una solicitud pueden verlos. Los números de pasaporte y otros datos privados son opcionales y se pueden dar al personal en persona. Sin iniciar sesión, los datos del barco y las marinas guardadas se quedan en este navegador.",
  nav: {
    signIn: "Iniciar sesión",
    myArrivals: "Mis llegadas",
  },
  login: {
    title: "Iniciar sesión",
    intro:
      "Escribe tu correo y te enviamos un enlace. Ábrelo para iniciar sesión. No hay contraseña. Si eres nuevo, el mismo enlace crea tu cuenta.",
    emailLabel: "Correo electrónico",
    send: "Enviarme un enlace de acceso",
    sending: "Enviando",
    errEmail: "Escribe un correo como nombre@ejemplo.com.",
    sentTitle: "Revisa tu correo",
    sentBody: (email) =>
      `Hemos enviado un enlace de acceso a ${email}. Ábrelo en este dispositivo. Funciona una vez y caduca a la hora.`,
    useAnother: "Usar otro correo",
    tooMany: "Se han pedido demasiados enlaces. Espera un minuto e inténtalo de nuevo.",
    failed: "No hemos podido enviar el enlace. Comprueba tu conexión e inténtalo de nuevo.",
    linkProblem:
      "Ese enlace no ha funcionado. Puede haber caducado o ya se ha usado. Envíate uno nuevo abajo.",
    previewNote:
      "El acceso por correo está desactivado en esta vista previa. Usa el selector Mock, abajo a la izquierda, para entrar con una cuenta de ejemplo.",
    signedIn: (name) => `Has iniciado sesión como ${name}.`,
    continue: "Continuar",
    privacy: "Usamos tu correo solo para iniciar tu sesión y para que la marina te responda aquí.",
  },
  profile: {
    nationality: "Nacionalidad",
    nationalityChoose: "Elige un país",
    euStatus: "UE o no UE",
    euStatusChoose: "Elegir",
    eu: "UE",
    nonEu: "No UE",
    euNote:
      "Dónde resides a efectos de aduanas y fronteras. Ayuda a la marina a preparar tu llegada.",
    emailFixed: "Es el correo con el que inicias sesión. No se puede cambiar aquí.",
    saved: "Guardado en tu cuenta.",
    saveFailed: "No se ha podido guardar en tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
  },
  myBoat: {
    intro:
      "Guarda tu barco una vez y todos los formularios de aldock se rellenan solos. Tus barcos, documentos y datos del patrón se guardan en tu cuenta y te acompañan en todos tus dispositivos.",
    deviceNote:
      "Solo tú y la marina a la que envías una solicitud pueden verlo. Los documentos del barco son notas, nunca archivos.",
    removeQuestion: (name) => `¿Quitar ${name} y sus documentos de tu cuenta?`,
    saved: (name) => `${name} guardado en tu cuenta.`,
    documentsSaved: "Documentos guardados en tu cuenta.",
    savedOnDevice: "Guardado en tu cuenta.",
    dataHeading: "Tus datos guardados",
    clearWarning:
      "Esto quita tus barcos y documentos de tu cuenta, y las marinas guardadas y la última consulta de este dispositivo. Se conservan tu nombre, teléfono, unidades e idioma.",
    clearAll: "Borrar mis barcos y datos guardados",
    cleared: "Se han quitado tus barcos y datos guardados.",
    syncFailed:
      "Tu último cambio no se ha podido guardar en tu cuenta. Comprueba tu conexión e inténtalo de nuevo.",
    signInPrompt:
      "Inicia sesión para guardar tus barcos en tu cuenta y usarlos en cualquier dispositivo. Lo que guardes antes de iniciar sesión pasa a tu cuenta.",
    signInLink: "Iniciar sesión",
  },
  request: {
    intro: (marina) => `Envía tu solicitud a ${marina}. La marina responde aquí, en Mis llegadas.`,
    note: "La marina confirma un amarre para tus fechas y responde en Mis llegadas.",
    goesToMarina: "Tu solicitud llega a la marina a través de tu cuenta.",
    send: "Enviar solicitud",
    sending: "Enviando",
    signInTitle: "Inicia sesión para enviar una solicitud",
    signInBody:
      "Las solicitudes llegan a la marina a través de tu cuenta, para que puedas seguir la respuesta en Mis llegadas.",
    signInLink: "Iniciar sesión",
    sentTitle: "Solicitud enviada",
    sentBody: (marina) =>
      `${marina} tiene tu solicitud. Aparece como Solicitada en Mis llegadas hasta que la marina responda.`,
    viewArrivals: "Ver mis llegadas",
    emailToo: "Enviar también un correo a la marina",
    emailTooNote: "Opcional. Tu aplicación de correo envía una copia de la solicitud.",
    summaryNote:
      "Es una copia de lo que has enviado. También puedes enviarla por correo a la marina.",
  },
  arrivals: {
    title: "Mis llegadas",
    intro: "Tus solicitudes de amarre y en qué punto está cada una. La marina responde aquí.",
    previewNote:
      "Esta vista previa no tiene servicio de cuentas, así que las solicitudes no se guardan. El acceso y las solicitudes funcionan en el sitio real.",
    empty: "Todavía no has enviado ninguna solicitud. Busca una marina y solicita un amarre.",
    findMarina: "Buscar una marina",
    loading: "Cargando tus solicitudes",
    loadFailed:
      "No hemos podido cargar tus solicitudes. Comprueba tu conexión e inténtalo de nuevo.",
    refresh: "Reintentar",
    list: "Tus solicitudes",
    status: {
      requested: "Solicitada",
      confirmed: "Confirmada",
      declined: "Rechazada",
      arrived: "Llegada",
      departed: "Salida",
      dates_proposed: "Otras fechas propuestas",
    },
    help: {
      requested: "La marina tiene tu solicitud y responderá aquí.",
      confirmed: (berth) => `La marina ha confirmado tu estancia. Tu amarre es el ${berth}.`,
      confirmedNoBerth: "La marina ha confirmado tu estancia y te dirá el amarre a tu llegada.",
      declined: "La marina no puede aceptar esta solicitud.",
      arrived: (berth) =>
        berth ? `Has hecho el registro en el amarre ${berth}.` : "Has hecho el registro.",
      departed: "Esta estancia ha terminado.",
      dates_proposed: "La marina no puede aceptar tus fechas y ha propuesto otras.",
    },
    boat: "Barco",
    stay: "Estancia",
    sent: (date) => `Enviada el ${date}`,
    reason: (text) => `Motivo: ${text}`,
    note: (text) => `Nota de la marina: ${text}`,
    proposedTitle: "Fechas propuestas por la marina",
    accept: "Aceptar estas fechas",
    accepting: "Enviando",
    accepted: "Has aceptado las nuevas fechas. La marina confirmará un amarre.",
    openEnded: (from) => `Desde el ${from}, sin fecha de salida`,
    range: (from, to) => `${from} a ${to}`,
  },
  errors: {
    not_signed_in: "Inicia sesión para continuar.",
    too_many_requests:
      "Ya tienes cinco solicitudes esperando respuesta. Espera a que la marina responda antes de enviar otra.",
    boat_not_found:
      "No encontramos ese barco en tu cuenta. Guárdalo en Mi barco e inténtalo de nuevo.",
    invalid_dates:
      "Revisa las fechas. La llegada no puede ser en el pasado y la salida no puede ser anterior.",
    too_many_boats: "Puedes tener hasta 20 barcos en tu cuenta.",
    no_proposal: "La marina no tiene otras fechas esperándote.",
    not_found: "No encontramos esa solicitud.",
    unknown: "Algo ha salido mal. Comprueba tu conexión e inténtalo de nuevo.",
  },
};
