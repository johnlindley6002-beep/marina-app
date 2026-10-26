"use client";

import { classifyBoat } from "@/data/marinas";
import { applySavedBoatToDraft } from "@/features/prearrival/lib/boatMapping";
import { useBoats } from "@/components/providers/BoatProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUnits } from "@/components/providers/UnitsProvider";
import type { StepProps } from "./PreArrivalWizard";
import type { BoatScope } from "./BoatScope";
import BoatIdentityFields from "./BoatIdentityFields";
import BoatSpecsFields from "./BoatSpecsFields";
import OwnerFields from "./OwnerFields";

export default function StepBoat({ marina, draft, setDraft, errors }: StepProps) {
  const { t } = useLanguage();
  const copy = t.preArrival.boat;
  const { label: unit } = useUnits();
  const { boats } = useBoats();

  function chooseSaved(boatId: string) {
    const boat = boats.find((b) => b.id === boatId);
    if (!boat) return;
    setDraft((d) => applySavedBoatToDraft(d, boat));
  }

  const lengthM = Number(draft.boatSpecs.lengthOverall) || 0;
  const beamM = Number(draft.boatSpecs.beam) || 0;
  const marinaClass = lengthM > 0 && beamM > 0 ? classifyBoat(lengthM, beamM) : null;
  const rate = marinaClass ? marina.transientRates[marinaClass] : null;
  const isPt = draft.boatIdentity.flagCountry === "Portugal";

  const scope: BoatScope = {
    draft,
    setDraft,
    errors,
    copy,
    unit,
    boats,
    chooseSaved,
    marina,
    marinaClass,
    rate,
    isPt,
  };

  return (
    <div>
      <BoatIdentityFields scope={scope} />
      <BoatSpecsFields scope={scope} />
      <OwnerFields scope={scope} />
    </div>
  );
}
