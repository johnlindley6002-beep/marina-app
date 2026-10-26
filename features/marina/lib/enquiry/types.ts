import type { VesselUseValues } from "@/features/marina/components/VesselUseFields";

export type VesselType = "sail" | "motor" | "catamaran" | "other";
export type Amperage = string;
export type EuStatus = "yes" | "no" | "";

export type PersonType = "crew" | "guest";

export type CrewMember = {
  personType: PersonType;
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  role: string;
  joinDate: string;
};

export const emptyCrewMember = (): CrewMember => ({
  personType: "crew",
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  passportNumber: "",
  role: "",
  joinDate: "",
});

export type FormData = {
  arrival: string;
  eta: string;
  departure: string;
  etd: string;
  openEnded: boolean;

  boatName: string;
  vesselType: VesselType | "";
  loa: string;
  beam: string;
  draft: string;
  flagCountry: string;
  berthId: string;

  skipperName: string;
  phone: string;
  email: string;
  homePort: string;
  peopleOnBoard: string;

  shorePower: boolean;
  amperage: Amperage | "";
  water: boolean;
  helpMooring: boolean;
  helpSlipping: boolean;
  pumpOut: boolean;
  fuel: boolean;
  laundry: boolean;

  euStatus: EuStatus;
  lastPort: string;
  nextPort: string;
  crew: CrewMember[];
} & VesselUseValues;
