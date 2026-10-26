import type { Dictionary } from "../../types";
import { plural } from "../../format";

const night = (n: number) => plural("es", n, { one: "noche", other: "noches" });

export const stay: Dictionary["stay"] = {
  season: {
    low: "Temporada baja (de enero a marzo y de octubre a diciembre)",
    high: "Temporada alta (de abril a septiembre)",
    both: "las dos temporadas",
  },
  plan: {
    heading: "Planifique su estancia",
    intro:
      "Las fechas y las medidas del barco determinan el plano, la estimación y la solicitud de abajo.",
    arrivalDate: "Fecha de llegada",
    departureDate: "Fecha de salida",
    lengthOverall: (unit) => `Eslora total (${unit})`,
    lengthHint: "Incluidos bauprés, pescantes y auxiliar",
    beam: (unit) => `Manga (${unit})`,
    draft: (unit) => `Calado (${unit})`,
    dimensionError: "Introduzca un número mayor que 0, por ejemplo 12,5.",
    departureAfterArrival:
      "La salida debe ser posterior a la llegada. Elija una fecha de salida más tardía.",
    openEnded: "Estancia sin fecha de salida",
    sizesDiffer: (boat) => `Estas medidas difieren de las guardadas para ${boat}.`,
    updateSavedBoat: "Actualizar el barco guardado",
    usingSaved: (boat) => `Usando su barco guardado, ${boat}.`,
    manageBoat: "Gestionar en Mi barco",
    saveLead: "Guarde su barco en",
    saveLink: "Mi barco",
    saveTail: "y estas medidas se rellenarán la próxima vez.",
    stayOpenEnded: "Estancia sin fecha de salida, con precio y búsqueda por noche.",
    stayBothSeasons: (nights, low, high) =>
      `${nights} noches, en las dos temporadas (${low} en temporada baja, ${high} en temporada alta).`,
    staySingleSeason: (nights, season) => `${nights} ${night(nights)}, ${season}.`,
    stayEnterDates: "Introduzca las fechas de llegada y de salida.",
    stayLabel: "Estancia: ",
  },
  decision: {
    fitQuestion: "¿Cabe mi barco?",
    spaceQuestion: "¿Hay sitio?",
    costQuestion: "¿Cuánto cuesta?",
    notChecked: "Sin comprobar",
    notCheckedYet: "Aún sin comprobar",
    askMarina: "Consulte a la marina",
    notEstimatedYet: "Aún sin estimar",
    enterDimensions: "Introduzca eslora, manga y calado.",
    fitYes: "Sí, cabe",
    fitNo: "No, no cabe en los amarres estándar",
    fitDetail: (cls, length) =>
      `Amarre de clase ${cls} para ${length}. La manga y el calado están dentro de los límites de la marina.`,
    fitMegaYacht: "Es el amarre reservado a megayates, en el pantalán exterior.",
    reasonLength: "Es más largo que los amarres estándar. Contacte con la marina.",
    reasonBeam: (beam) =>
      `Su manga de ${beam} es mayor que la del amarre estándar para esta eslora. Contacte con la marina.`,
    reasonDraft: (draft, max) =>
      `Su calado de ${draft} supera el máximo de la marina, ${max}. Contacte con la marina.`,
    spaceNoFit: "Los amarres estándar no sirven para su barco.",
    enterDatesAndLength: "Introduzca las fechas y la eslora total.",
    outsideClasses: "Su eslora está fuera de las clases de amarre estándar.",
    noPlan: (cls) =>
      `El plano de demostración aún no muestra amarres de clase ${cls}. La marina confirma la disponibilidad por correo electrónico.`,
    spaceYes: "Sí, hay amarres disponibles",
    spaceNone: "Ninguno disponible para su tamaño",
    availabilityNote:
      "Datos de demostración, no en tiempo real. La marina confirma la disponibilidad por correo electrónico.",
    costContact: "Contacte con la marina para pedir presupuesto.",
    costAbout: (amount) => `Unos ${amount}`,
    costAboutFirstNight: (amount) => `Unos ${amount} por la primera noche`,
    nightlyRate: "Tarifa por noche",
    nightsCount: (n) => `${n} ${night(n)}`,
    costDetail: (period, cls, vat) => `${period}, clase ${cls}, sin ${vat} % de IVA ni consumos.`,
    seeBreakdown: "Ver el desglose",
    costOutsideClasses:
      "Su eslora está fuera de las clases estándar. Contacte con la marina para pedir presupuesto.",
    promptDates: "Añada sus fechas para ver si cabe, si hay sitio y el precio.",
    promptDatesAndLength:
      "Añada sus fechas y la eslora total para ver si cabe, si hay sitio y el precio.",
    promptLength: "Añada la eslora total para ver si cabe, si hay sitio y el precio.",
  },
  estimate: {
    heading: "Su estimación",
    fromLine: (price) =>
      `Desde ${price} por noche, según la eslora y la temporada. Añada sus fechas y la eslora total para obtener su estimación.`,
    extras: "Extras",
    extrasHint: "Elija lo que necesite. Cada extra se suma al desglose de abajo.",
    shorePower: "Electricidad",
    shorePowerHint: (amps) => `Con contador, facturada por consumo (hasta ${amps} A)`,
    amperageLabel: "Amperaje de la electricidad",
    amperagePlaceholder: "Amperaje…",
    amperageError: "Elija el amperaje de la electricidad, por ejemplo 16 A o 32 A.",
    water: "Agua",
    waterHint: "Con contador, facturada por consumo",
    pumpOut: "Vaciado de aguas residuales",
    pumpOutHint: (price) => `${price} por operación`,
    perOperation: "Por operación",
    fuel: "Combustible a la llegada",
    diesel: (price) => `Gasóleo ${price}/L`,
    petrol: (price) => `Gasolina 95 ${price}/L`,
    fuelPrices: (prices) => `${prices}, facturado en el muelle de combustible`,
    fuelAtDock: "Gasóleo y gasolina, precio en el muelle de combustible",
    laundry: "Lavandería",
    laundryHint: (wash, dry) => `Lavado ${wash}, secado ${dry} por carga, fichas en recepción`,
    busyPeriod: "Período de mucha demanda, así que la disponibilidad puede ser menor.",
    classBerth: (cls) => `Amarre de clase ${cls}`,
    nightlyOpenEnded: "tarifa por noche (estancia sin fecha de salida)",
    berthId: (id) => `Amarre ${id}`,
    nightsAtRate: (nights, rate) => `${nights} ${night(nights)} a ${rate} por noche`,
    berthSubtotal: "Subtotal del amarre",
    totalFirstNight: "Primera noche estimada",
    total: "Total estimado",
    vatNote: (vat) =>
      `Sin ${vat} % de IVA ni consumos. Precio orientativo, confirmado por la marina.`,
    requestBerth: "Solicitar un amarre",
    requestNote:
      "Esto envía una solicitud. La marina confirma la disponibilidad por correo electrónico.",
    outsideClasses:
      "Su eslora está fuera de las clases de amarre estándar. Contacte con la marina para pedir presupuesto.",
    enterDatesAndLength:
      "Introduzca arriba las fechas y la eslora para ver una estimación de precio.",
    allRates: "Todas las tarifas",
    hideRates: "Ocultar tarifas",
  },
  recap: {
    heading: "Su estancia y salida",
    basedOn: (arrival, boat) =>
      `Según su última solicitud (${arrival}${boat ? `, ${boat}` : ""}), guardada en este dispositivo.`,
    settleUp: "Estimación de la liquidación",
    departureDate: "Fecha de salida",
    departureTime: "Hora de salida",
    chooseDeparture: "Elija una fecha de salida posterior a la llegada para ver la estimación.",
    classSeason: (cls, season) => `Clase ${cls} · ${season}`,
    estimatedTotal: "Total estimado",
    estimateOnly: (vat) =>
      `Solo una estimación, sin ${vat} % de IVA ni consumos. La marina confirma el total final.`,
    leaving: "¿Se va? Avise a la marina",
    leavingNote: "Abre un correo ya redactado con su barco y su salida.",
    notifyDeparture: "Avisar de la salida",
    comingBack: "¿Vuelve?",
    comingBackNote: "El mismo barco y los mismos servicios, con las fechas en blanco.",
    rebook: "Repetir esta estancia",
  },
  wallet: {
    optional: "Todo opcional. Los documentos se muestran en persona a la llegada.",
    moreAbout: "Más sobre guardar estos datos",
    hide: "Ocultar",
    moreAboutBody:
      "Guarde estos datos con su barco para reutilizarlos, o déjelos en blanco y entréguelos al personal de la marina. Solo se guarda el texto, en este navegador.",
    bring: (min) =>
      `Traiga: el documento de matrícula del barco (en Portugal se exigen los originales, no copias plastificadas), el justificante del seguro de responsabilidad civil (mínimo ${min}, a ser posible con certificado en portugués) y el título del patrón.`,
    registrationNumber: "Número de matrícula",
    insuranceProvider: "Aseguradora",
    insurancePolicy: "Número de póliza",
    insuranceExpiry: "Vencimiento del seguro",
    expiresBefore: "Vence antes de la fecha de llegada.",
    competence: "Título del patrón",
    vhfLicence: "Licencia de VHF",
    includeInEnquiry: "Incluir estos datos en mi correo de solicitud",
  },
  arrival: {
    heading: "¿Llega hoy?",
    intro: (marina) =>
      `Cada botón abre un correo ya redactado para ${marina}. No se envía nada hasta que pulse enviar.`,
    arrivingNow: "Estoy llegando",
    digitalCheckIn: "Registro digital",
  },
};
