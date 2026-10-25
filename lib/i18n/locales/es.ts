import type { DeepPartial, Dictionary } from "../types";

// TODO(i18n): ES and FR cover navigation, footer, home, search, rates
// headings, results, the shared contact/units/favourites labels, and (for
// preArrival) the page chrome, step names and the three calm voyage info
// panels. The rest of preArrival (every field label) falls back to English
// until fully translated, the same as everything else not listed here.
export const es: DeepPartial<Dictionary> = {
  nav: {
    home: "Inicio",
    marinas: "Marinas",
    aboutUs: "Sobre nosotros",
    contact: "Contacto",
    search: "Buscar",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    myBoat: "Mi barco",
  },
  footer: {
    tagline: "Reserva tu amarre, sin complicaciones",
    company: "Empresa",
    product: "Producto",
    contact: "Contacto",
    aboutUs: "Sobre nosotros",
    marinas: "Marinas",
    copyright: (year) => `© ${year} aldock. Todos los derechos reservados.`,
  },
  home: {
    tagline: "Reserva tu amarre, sin complicaciones",
    valueProp: "Encuentra y reserva tu amarre en las marinas de Portugal.",
    browseMarinas: "O explora las marinas",
    aboutHeading: "La reserva de amarres, reinventada",
    aboutBody:
      "aldock aporta claridad a la reserva de amarres y a la comunicación con quienes visitan la marina. Creemos que reservar un amarre debería ser tan tranquilo como una mañana en aguas calmas.",
    contactHeading: "Hablemos",
    contactBody:
      "¿Dudas sobre amarres, reservas o colaboraciones? Estaremos encantados de ayudarte.",
    destinationLabel: "¿Hacia dónde navegas?",
    destinationPlaceholder: "Marina, región o país",
    addFilters: "Añadir fechas y eslora",
    hideFilters: "Ocultar fechas y eslora",
    findMarinas: "Buscar marinas",
    featuredHeading: "Marina destacada",
    moreMarinas: "Más marinas",
  },
  results: {
    heading: "Marinas",
    forQuery: (query) => `Marinas para «${query}»`,
    count: (n) => `${n} ${n === 1 ? "marina" : "marinas"}`,
    none: "Ninguna marina coincide con tu búsqueda. Prueba con una marina, una región o un país.",
    from: "desde",
  },
  homeSearch: {
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora total (m)",
    searchButton: "Buscar amarres",
  },
  countryPage: {
    heading: (country) => `Marinas en ${country}`,
    viewMarina: "Ver marina →",
  },
  breadcrumbs: { marinas: "Marinas" },
  berthSearch: {
    heading: "Amarres disponibles",
    arrival: "Llegada",
    departure: "Salida",
    boatLength: "Eslora total (m)",
    searchButton: "Buscar",
    illustrative: "La disponibilidad de amarres que se muestra es solo ilustrativa por ahora.",
    ctaButton: "Contactar con la marina",
  },
  rates: {
    eyebrow: "Tarifas",
    heading: "Tarifas de tránsito",
    colClass: "Clase",
    colLength: "Eslora",
    colLow: "Temporada baja €/noche",
    colHigh: "Temporada alta €/noche",
  },
  contact: { heading: "Contacto", phone: "Teléfono", email: "Correo electrónico" },
  facilities: { heading: "Instalaciones y servicios" },
  language: { label: "Idioma" },
  units: { label: "Unidades", metric: "Metros", imperial: "Pies" },
  dock: {
    open: "Contactar con la marina",
    close: "Cerrar",
    heading: "Contactar con la marina",
    call: "Llamar",
    vhf: "Canal VHF",
    email: "Correo electrónico",
    message: "Escribir a la marina",
  },
  favourites: {
    save: "Guardar marina",
    saved: "Guardada",
    savedHeading: "Tus marinas guardadas",
  },
  preArrival: {
    cta: {
      arrivalActions: "Completar el registro previo a la llegada",
      myBoat: "Iniciar el registro previo a la llegada",
    },
    page: {
      title: "Registro previo a la llegada",
      subtitle:
        "Responda una vez y la llegada será confirmar y listo. No se envía nada hasta que pulse Enviar al final.",
      autosaveNote: "Guardado en este dispositivo a medida que avanza.",
      resumeBanner: "Continuando donde lo dejó.",
      startOver: "Empezar de nuevo",
      back: "Atrás",
      continueBtn: "Continuar",
      stepOf: (step, total) => `Paso ${step} de ${total}`,
    },
    steps: {
      boat: "Su embarcación",
      voyage: "Su travesía",
      crew: "Quién va a bordo",
      documents: "Documentos",
      stay: "Su estancia",
      review: "Revisar y enviar",
    },
    voyage: {
      infoOutsideSchengenTitle: "Llegada desde fuera de Schengen",
      infoOutsideSchengenBody:
        "Debe pasar el control fronterizo con la GNR a la llegada. La marina le ayudará. Todos a bordo necesitan pasaporte válido.",
      infoNonEUFlagTitle: "Embarcación con pabellón no comunitario",
      infoNonEUFlagBody:
        "Una embarcación con pabellón no comunitario puede permanecer en Admisión Temporal de la UE hasta 18 meses sin IVA de importación, solo para uso privado, si el propietario reside fuera de la UE. No cubre el chárter.",
      infoNonEUFlagResidentWarning:
        "El propietario indicado en el paso 1 reside en la UE, por lo que la Admisión Temporal no suele estar disponible. Consulte con aduanas.",
      infoNonEUMovementTitle: "Cruce hacia o desde fuera de la UE",
      infoNonEUMovementBody:
        "La marina debe comunicar este movimiento a las autoridades marítima, fronteriza y aduanera (Latitude 32). Este formulario recoge lo necesario para ese aviso.",
    },
  },
};
