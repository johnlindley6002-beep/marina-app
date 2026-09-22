export type Marina = {
  id: string;
  name: string;
  location: string;
  address: string;
  coordinates: { lat: number; lng: number };
  berths: { count: number; maxLengthM: number };
  opened: number;
  phone: string;
  email: string;
  vhfChannel: number;
  description: string;
  facilities: string[];
};

export const marinas: Marina[] = [
  {
    id: "cascais",
    name: "Marina de Cascais",
    location: "Cascais, Portuguese Riviera, ~35 km west of Lisbon",
    address: "Casa de São Bernardo, 2750-800 Cascais, Portugal",
    coordinates: { lat: 38.693, lng: -9.418 },
    berths: { count: 650, maxLengthM: 36 },
    opened: 1999,
    phone: "+351 214 824 800",
    email: "info@marinacascais.pt",
    vhfChannel: 9,
    description:
      "Marina de Cascais is a full-service marina on the Bay of Cascais, just five minutes from the town centre and the largest on the Portuguese Riviera. With around 650 berths for vessels up to 36 metres, it pairs sheltered, modern moorings with a complete range of nautical services alongside the restaurants and shops of the waterfront.",
    facilities: [
      "Fuel dock",
      "70T travel lift",
      "Dry storage",
      "Repairs",
      "24h security",
      "Water & power",
    ],
  },
];
