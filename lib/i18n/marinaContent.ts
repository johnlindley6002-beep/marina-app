// Marina-specific prose, bilingual. Structured per marina id so more
// marinas can be added to the dictionary later. Kept separate from
// data/marinas.ts, which holds language-agnostic real values (address,
// phone, rates, coordinates, etc).
export const marinaContent = {
  cascais: {
    description: {
      en: "Marina de Cascais is a full-service marina on the Bay of Cascais, just five minutes from the town centre and the largest on the Portuguese Riviera. With around 650 berths for boats up to 36 metres, it pairs sheltered, modern moorings with a complete range of nautical services alongside the restaurants and shops of the waterfront.",
      pt: "A Marina de Cascais é uma marina completa na Baía de Cascais, a apenas cinco minutos do centro da vila e a maior da Riviera Portuguesa. Com cerca de 650 lugares de amarração para embarcações até 36 metros, combina um fundeadouro abrigado e moderno com uma gama completa de serviços náuticos, junto aos restaurantes e lojas da marginal.",
    },
    arrivalInstructions: {
      en: "On arrival, berth on the Reception pier and report to the marina office.",
      pt: "À chegada, atraque no cais de receção e dirija-se ao escritório da marina.",
    },
    gettingThere: {
      byCar: {
        en: "Via the A5 motorway, Cascais exit",
        pt: "Pela autoestrada A5, saída Cascais",
      },
      byTrain: {
        en: "Cascais train station, then a short walk to the marina",
        pt: "Estação de comboios de Cascais, seguido de uma curta caminhada até à marina",
      },
      byAir: {
        en: "~35 km from Lisbon Humberto Delgado Airport",
        pt: "~35 km do Aeroporto Humberto Delgado, em Lisboa",
      },
    },
  },
} as const;
