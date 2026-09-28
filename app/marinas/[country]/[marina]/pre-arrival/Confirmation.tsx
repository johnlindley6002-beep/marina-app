"use client";

import Link from "next/link";
import { useState } from "react";
import type { Marina } from "../../../../../data/marinas";
import { saveFrequentPerson } from "../../../../../lib/boatProfile";
import { getDocumentRequirements } from "../../../../../lib/prearrival/documentRules";
import type { PreArrivalCheckIn } from "../../../../../lib/mockData";
import { useBoats, type BoatInput } from "../../../../components/BoatProvider";
import DocumentButtons from "../../../../components/DocumentButtons";
import { useLanguage } from "../../../../components/LanguageProvider";

function boatTypeFor(propulsion: string, isMultihull: boolean): string {
  if (isMultihull) return "catamaran";
  return propulsion === "power" ? "motor" : "sail";
}

function SaveToMyBoat({ checkIn }: { checkIn: PreArrivalCheckIn }) {
  const { t } = useLanguage();
  const copy = t.preArrival.confirmation;
  const { saveBoat, saveSkipper } = useBoats();
  const [saved, setSaved] = useState(false);

  function save() {
    const { boatIdentity, boatSpecs, owner, documents, people } = checkIn.draft;
    const input: BoatInput = {
      name: boatIdentity.name,
      type: boatTypeFor(boatSpecs.propulsion, boatSpecs.isMultihull),
      loa: boatSpecs.lengthOverall,
      beam: boatSpecs.beam,
      draft: boatSpecs.draught,
      flag: boatIdentity.flagCountry,
      homePort: boatIdentity.portOfRegistry,
      documents: {
        registrationNumber: documents.registration.number,
        insuranceProvider: documents.thirdPartyInsurance.insurer,
        insurancePolicy: documents.thirdPartyInsurance.number,
        insuranceExpiry: documents.thirdPartyInsurance.expiryDate,
        competenceCertificate: documents.skipperLicence.number,
        vhfLicence: documents.radioStationLicence.number,
      },
    };
    saveBoat(input);
    for (const person of people) {
      saveFrequentPerson({
        familyName: person.familyName,
        givenNames: person.givenNames,
        nationality: person.nationality,
        dateOfBirth: person.dateOfBirth,
        idType: person.idType,
      });
    }
    if (owner.fullName || owner.email || owner.phone) {
      saveSkipper({ name: owner.fullName, phone: owner.phone, email: owner.email });
    }
    setSaved(true);
  }

  if (saved) {
    return <p className="mt-4 text-sm text-ink/75">{copy.savedNote}</p>;
  }
  return (
    <div className="surface-lift mt-8 p-6">
      <p className="font-medium text-ink">{copy.saveOfferHeading}</p>
      <p className="mt-1 text-sm text-ink/75">{copy.saveOfferBody}</p>
      <button type="button" onClick={save} className="btn-secondary mt-4">
        {copy.saveOfferBtn}
      </button>
    </div>
  );
}

export default function Confirmation({
  marina,
  checkIn,
}: {
  marina: Marina;
  checkIn: PreArrivalCheckIn;
}) {
  const { t } = useLanguage();
  const copy = t.preArrival.confirmation;
  const documentItems = t.preArrival.documents.items;
  const requiredDocs = getDocumentRequirements(checkIn.draft).filter((r) => r.required);

  return (
    <div className="section-tight">
      <div className="page-column page-reading">
        <h1 className="type-title text-ink">{copy.heading}</h1>

        <div className="surface-lift mt-8 p-6">
          <p className="type-label">{copy.referenceLabel}</p>
          <p className="tabular mt-1 text-2xl font-medium text-ink">{checkIn.referenceCode}</p>
        </div>

        <div className="mt-8">
          <p className="type-heading type-h3 text-ink">{copy.whatNextHeading}</p>
          <p className="mt-2 text-ink/75">{copy.whatNextBody}</p>
        </div>

        <div className="mt-8">
          <p className="type-heading type-h3 text-ink">{copy.bringHeading}</p>
          <ul className="mt-3 space-y-1 text-sm text-ink/75">
            {requiredDocs.map((req) => (
              <li key={req.key}>{documentItems[req.key]}</li>
            ))}
          </ul>
        </div>

        <DocumentButtons checkIn={checkIn} marina={marina} className="mt-8" />

        <SaveToMyBoat checkIn={checkIn} />

        <Link
          href={`/marinas/${marina.countrySlug}/${marina.id}`}
          className="btn-secondary mt-10 inline-block"
        >
          {copy.backToMarina}
        </Link>
      </div>
    </div>
  );
}
