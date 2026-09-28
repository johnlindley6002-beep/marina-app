"use client";

import { COUNTRIES } from "../../../../../lib/countries";
import { buildPtIdentificationSet, NAVIGATION_ZONES } from "../../../../../lib/prearrival/countries";
import { classifyByLengthAndBeam } from "../../../../../lib/prearrival/pricing";
import { emptyDocuments, VESSEL_USES, type Propulsion, type VesselUseValue } from "../../../../../lib/prearrival/schema";
import { VESSEL_USE_LABELS } from "../VesselUseFields";
import { useBoats } from "../../../../components/BoatProvider";
import { useLanguage } from "../../../../components/LanguageProvider";
import LengthInput from "../../../../components/LengthInput";
import { useUnits } from "../../../../components/UnitsProvider";
import type { StepProps } from "./PreArrivalWizard";
import { Field } from "./WizardBits";

export default function StepBoat({ marina, draft, setDraft, errors }: StepProps) {
  const { t } = useLanguage();
  const copy = t.preArrival.boat;
  const { label: unit } = useUnits();
  const { boats } = useBoats();

  function chooseSaved(boatId: string) {
    const boat = boats.find((b) => b.id === boatId);
    if (!boat) return;
    setDraft((d) => ({
      ...d,
      boatId: boat.id,
      boatIdentity: {
        ...d.boatIdentity,
        name: boat.name,
        flagCountry: boat.flag,
        registrationNumber: d.documents.registration.number || boat.documents?.registrationNumber || "",
        portOfRegistry: d.boatIdentity.portOfRegistry || boat.homePort,
      },
      boatSpecs: {
        ...d.boatSpecs,
        lengthOverall: boat.loa,
        beam: boat.beam,
        draught: boat.draft,
        propulsion: (boat.type === "motor" ? "power" : boat.type === "catamaran" ? "sail_and_power" : "sail") as Propulsion,
        isMultihull: boat.type === "catamaran",
      },
      documents: boat.documents
        ? {
            ...emptyDocuments(),
            registration: { ...d.documents.registration, number: boat.documents.registrationNumber },
            thirdPartyInsurance: {
              ...d.documents.thirdPartyInsurance,
              number: boat.documents.insurancePolicy,
              insurer: boat.documents.insuranceProvider,
              expiryDate: boat.documents.insuranceExpiry,
            },
            skipperLicence: { ...d.documents.skipperLicence, number: boat.documents.competenceCertificate },
            radioStationLicence: { ...d.documents.radioStationLicence, number: boat.documents.vhfLicence },
          }
        : d.documents,
    }));
  }

  const lengthM = Number(draft.boatSpecs.lengthOverall) || 0;
  const beamM = Number(draft.boatSpecs.beam) || 0;
  const marinaClass = lengthM > 0 && beamM > 0 ? classifyByLengthAndBeam(lengthM, beamM) : null;
  const rate = marinaClass ? marina.transientRates[marinaClass] : null;
  const isPt = draft.boatIdentity.flagCountry === "Portugal";

  return (
    <div>
      {boats.length > 0 ? (
        <div className="mt-6 max-w-md">
          <Field label={copy.chooseSaved} htmlFor="boat-saved">
            <select
              id="boat-saved"
              value={draft.boatId ?? ""}
              onChange={(e) => chooseSaved(e.target.value)}
              className="field"
            >
              <option value="">{copy.chooseSavedPlaceholder}</option>
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      <p className="mt-6 text-sm font-medium text-ink/80">{copy.orNewBoat}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={copy.nameLabel} htmlFor="boat-name" required error={errors["boatIdentity.name"]}>
          <input
            id="boat-name"
            type="text"
            value={draft.boatIdentity.name}
            onChange={(e) => setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, name: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.registrationLabel} htmlFor="boat-reg" required error={errors["boatIdentity.registrationNumber"]}>
          <input
            id="boat-reg"
            type="text"
            value={draft.boatIdentity.registrationNumber}
            onChange={(e) =>
              setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, registrationNumber: e.target.value } }))
            }
            className="field"
          />
        </Field>
        <Field label={copy.flagLabel} htmlFor="boat-flag" required error={errors["boatIdentity.flagCountry"]}>
          <select
            id="boat-flag"
            value={draft.boatIdentity.flagCountry}
            onChange={(e) => setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, flagCountry: e.target.value } }))}
            className="field"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.callSignLabel} htmlFor="boat-callsign">
          <input
            id="boat-callsign"
            type="text"
            value={draft.boatIdentity.callSign}
            onChange={(e) => setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, callSign: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.portOfRegistryLabel} htmlFor="boat-port" required error={errors["boatIdentity.portOfRegistry"]}>
          <input
            id="boat-port"
            type="text"
            value={draft.boatIdentity.portOfRegistry}
            onChange={(e) => setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, portOfRegistry: e.target.value } }))}
            className="field"
          />
        </Field>
        {isPt ? (
          <Field label={copy.zoneLabel} htmlFor="boat-zone">
            <select
              id="boat-zone"
              value={draft.boatIdentity.navigationZoneType ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  boatIdentity: {
                    ...d.boatIdentity,
                    navigationZoneType: e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5) : null,
                  },
                }))
              }
              className="field"
            >
              <option value="">Select…</option>
              {NAVIGATION_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {isPt && draft.boatIdentity.name ? (
        <p className="tabular mt-3 text-xs text-ink/70">
          {buildPtIdentificationSet(draft.boatIdentity.name, draft.boatIdentity.registrationNumber || draft.boatIdentity.name)}
        </p>
      ) : null}

      <p className="mt-8 text-sm font-medium text-ink/80">{copy.specificationsHeading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={`${copy.lengthLabel.replace("(m)", `(${unit})`)}`} htmlFor="boat-loa" required error={errors["boatSpecs.lengthOverall"]}>
          <LengthInput
            valueM={draft.boatSpecs.lengthOverall}
            onChangeM={(v) => setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, lengthOverall: v } }))}
            className="field"
          />
        </Field>
        <Field label={`${copy.beamLabel.replace("(m)", `(${unit})`)}`} htmlFor="boat-beam" required error={errors["boatSpecs.beam"]}>
          <LengthInput
            valueM={draft.boatSpecs.beam}
            onChangeM={(v) => setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, beam: v } }))}
            className="field"
          />
        </Field>
        <Field label={`${copy.draughtLabel.replace("(m)", `(${unit})`)}`} htmlFor="boat-draught" required error={errors["boatSpecs.draught"]}>
          <LengthInput
            valueM={draft.boatSpecs.draught}
            onChangeM={(v) => setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, draught: v } }))}
            className="field"
          />
        </Field>
        <Field label={copy.propulsionLabel} htmlFor="boat-propulsion">
          <select
            id="boat-propulsion"
            value={draft.boatSpecs.propulsion}
            onChange={(e) =>
              setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, propulsion: e.target.value as Propulsion } }))
            }
            className="field"
          >
            <option value="sail">{copy.propulsionSail}</option>
            <option value="power">{copy.propulsionPower}</option>
            <option value="sail_and_power">{copy.propulsionBoth}</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink/75">
          <input
            type="checkbox"
            checked={draft.boatSpecs.isMultihull}
            onChange={(e) => setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, isMultihull: e.target.checked } }))}
          />
          {copy.multihullLabel}
        </label>
      </div>

      {marinaClass && rate ? (
        <p className="tabular mt-4 text-ink">
          <span className="chip mr-2">{copy.classLabel(marinaClass)}</span>
          {copy.indicativeNightly(`€${(rate.low * (draft.boatSpecs.isMultihull ? 2 : 1)).toFixed(2)}`)}
        </p>
      ) : null}

      <div className="mt-6 max-w-xs">
        <Field label={copy.vesselUseLabel} htmlFor="boat-vesseluse">
          <select
            id="boat-vesseluse"
            value={draft.vesselUse}
            onChange={(e) => setDraft((d) => ({ ...d, vesselUse: e.target.value as VesselUseValue }))}
            className="field"
          >
            {VESSEL_USES.map((use) => (
              <option key={use} value={use}>
                {VESSEL_USE_LABELS[use]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <p className="mt-8 text-sm font-medium text-ink/80">{copy.ownerHeading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={copy.ownerNameLabel} htmlFor="owner-name" required error={errors["owner.fullName"]}>
          <input
            id="owner-name"
            type="text"
            value={draft.owner.fullName}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, fullName: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.ownerIdLabel} htmlFor="owner-id" required error={errors["owner.idDocumentNumber"]}>
          <input
            id="owner-id"
            type="text"
            value={draft.owner.idDocumentNumber}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, idDocumentNumber: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.ownerResidenceLabel} htmlFor="owner-residence" required error={errors["owner.countryOfResidence"]}>
          <select
            id="owner-residence"
            value={draft.owner.countryOfResidence}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, countryOfResidence: e.target.value } }))}
            className="field"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.ownerTaxNumberLabel} htmlFor="owner-nif">
          <input
            id="owner-nif"
            type="text"
            value={draft.owner.taxNumber}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, taxNumber: e.target.value } }))}
            className="field"
          />
        </Field>
        {draft.owner.countryOfResidence && draft.owner.countryOfResidence !== "Portugal" ? (
          <Field label={copy.ownerAddressLabel} htmlFor="owner-address" required error={errors["owner.address"]}>
            <input
              id="owner-address"
              type="text"
              value={draft.owner.address}
              onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, address: e.target.value } }))}
              className="field"
            />
          </Field>
        ) : null}
        <Field label={copy.ownerEmailLabel} htmlFor="owner-email" required error={errors["owner.email"]}>
          <input
            id="owner-email"
            type="email"
            value={draft.owner.email}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, email: e.target.value } }))}
            className="field"
          />
        </Field>
        <Field label={copy.ownerPhoneLabel} htmlFor="owner-phone" required error={errors["owner.phone"]}>
          <input
            id="owner-phone"
            type="tel"
            value={draft.owner.phone}
            onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, phone: e.target.value } }))}
            className="field"
          />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink/75">
        <input
          type="checkbox"
          checked={draft.owner.isCompany}
          onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, isCompany: e.target.checked } }))}
        />
        {copy.ownerIsCompanyLabel}
      </label>
      {draft.owner.isCompany ? (
        <div className="mt-3 max-w-xs">
          <Field label={copy.ownerCompanyTaxIdLabel} htmlFor="owner-nipc" required error={errors["owner.companyTaxId"]}>
            <input
              id="owner-nipc"
              type="text"
              value={draft.owner.companyTaxId}
              onChange={(e) => setDraft((d) => ({ ...d, owner: { ...d.owner, companyTaxId: e.target.value } }))}
              className="field"
            />
          </Field>
        </div>
      ) : null}
    </div>
  );
}
