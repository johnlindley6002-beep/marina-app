import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Marina, RelettingTerms } from "@/data/marinas";
import type { OwnedBerth, ReletSplit } from "@/lib/data";

// Everything the wizard's steps read and write, handed to each step as one
// object so the five steps can live in their own files.
export type ReletScope = {
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
  nights: number;
  today: string;
  boatRemoval: boolean;
  setBoatRemoval: Dispatch<SetStateAction<boolean>>;
  consent: boolean;
  setConsent: Dispatch<SetStateAction<boolean>>;
  outsideArrangementConfirmed: boolean;
  setOutsideArrangementConfirmed: Dispatch<SetStateAction<boolean>>;
  termsAccepted: boolean;
  setTermsAccepted: Dispatch<SetStateAction<boolean>>;
  boatReady: boolean;
  setBoatReady: Dispatch<SetStateAction<boolean>>;
  berthReady: boolean;
  setBerthReady: Dispatch<SetStateAction<boolean>>;
  error: string | null;
  headingRef: RefObject<HTMLHeadingElement | null>;
  terms: RelettingTerms;
  estimate: ReletSplit | null;
  berth: OwnedBerth;
  marina: Marina;
};
