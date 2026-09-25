"use client";

export type VesselUse = "private" | "bareboat" | "crewed" | "commercial" | "";

export const VESSEL_USE_LABELS: Record<Exclude<VesselUse, "">, string> = {
  private: "Private pleasure",
  bareboat: "Bareboat charter",
  crewed: "Crewed charter",
  commercial: "Commercial or company-owned",
};

export type VesselUseValues = {
  vesselUse: VesselUse;
  operatingEntity: string;
  companyRegistration: string;
  contractName: string;
  contractRole: string;
  insuranceConfirmed: boolean;
  professionalCrewCount: string;
  guestCount: string;
};

export type VesselUseErrors = Partial<Record<keyof VesselUseValues, string>>;

export const isCommercialUse = (use: VesselUse) =>
  use !== "" && use !== "private";

const inputClass =
  "field";
const labelClass = "field-label";
const errorClass = "field-error";

function Required() {
  return <span className="text-error"> *</span>;
}

type Props = {
  values: VesselUseValues;
  errors: VesselUseErrors;
  skipperName: string;
  notes: string[];
  disclaimer: string;
  onChange: <K extends keyof VesselUseValues>(
    key: K,
    value: VesselUseValues[K]
  ) => void;
};

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className={errorClass}>
      {message}
    </p>
  );
}

// One selector. Private pleasure (the common case) reveals nothing; any other
// answer reveals the commercial / charter details block.
export default function VesselUseFields({
  values,
  errors,
  skipperName,
  notes,
  disclaimer,
  onChange,
}: Props) {
  const use = values.vesselUse;
  const commercial = isCommercialUse(use);

  return (
    <div>
      <label className="block text-sm">
        <span className={labelClass}>
          Vessel use
          <Required />
        </span>
        <select
          value={use}
          aria-invalid={!!errors.vesselUse}
          aria-describedby={errors.vesselUse ? "err-vesselUse" : "vessel-use-help"}
          onChange={(e) => onChange("vesselUse", e.target.value as VesselUse)}
          className={`${inputClass} max-w-md`}
        >
          {use === "" ? <option value="">Select…</option> : null}
          {(Object.keys(VESSEL_USE_LABELS) as Exclude<VesselUse, "">[]).map(
            (key) => (
              <option key={key} value={key}>
                {VESSEL_USE_LABELS[key]}
              </option>
            )
          )}
        </select>
        <FieldError id="err-vesselUse" message={errors.vesselUse} />
      </label>
      <p id="vessel-use-help" className="mt-2 text-xs text-ink/70">
        Most visiting boats are private pleasure craft. Other choices ask for a
        few company details.
      </p>

      {commercial ? (
        <div className="hairline-top mt-6 pt-6">
          <h3 className="type-heading type-h3 text-ink">
            Commercial / charter details
          </h3>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={labelClass}>
                Operating entity
                <Required />
              </span>
              <input
                type="text"
                value={values.operatingEntity}
                aria-invalid={!!errors.operatingEntity}
                aria-describedby={errors.operatingEntity ? "err-operatingEntity" : undefined}
                onChange={(e) => onChange("operatingEntity", e.target.value)}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-ink/70">
                The charter operator or owning company name.
              </span>
              <FieldError id="err-operatingEntity" message={errors.operatingEntity} />
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Company registration / VAT (NIF) number
                <Required />
              </span>
              <input
                type="text"
                value={values.companyRegistration}
                aria-invalid={!!errors.companyRegistration}
                aria-describedby={errors.companyRegistration ? "err-companyRegistration" : undefined}
                onChange={(e) => onChange("companyRegistration", e.target.value)}
                className={inputClass}
              />
              <FieldError id="err-companyRegistration" message={errors.companyRegistration} />
            </label>
          </div>

          {use === "bareboat" ? (
            <p className="mt-4 text-sm text-ink/75">
              <span className={labelClass}>Responsible contracting party: </span>
              the bareboat charterer, who is the skipper
              {skipperName.trim() ? ` (${skipperName.trim()})` : " named in Skipper & contact"}
              .
            </p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelClass}>
                  Responsible contracting party, name
                  <Required />
                </span>
                <input
                  type="text"
                  value={values.contractName}
                  aria-invalid={!!errors.contractName}
                  aria-describedby={errors.contractName ? "err-contractName" : undefined}
                  onChange={(e) => onChange("contractName", e.target.value)}
                  className={inputClass}
                />
                <FieldError id="err-contractName" message={errors.contractName} />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>
                  Their role
                  <Required />
                </span>
                <input
                  type="text"
                  value={values.contractRole}
                  placeholder="For example operator or company representative"
                  aria-invalid={!!errors.contractRole}
                  aria-describedby={errors.contractRole ? "err-contractRole" : undefined}
                  onChange={(e) => onChange("contractRole", e.target.value)}
                  className={inputClass}
                />
                <FieldError id="err-contractRole" message={errors.contractRole} />
              </label>
            </div>
          )}

          {use === "crewed" ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className={labelClass}>
                  Professional crew on board
                  <Required />
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={values.professionalCrewCount}
                  aria-invalid={!!errors.professionalCrewCount}
                  aria-describedby={errors.professionalCrewCount ? "err-professionalCrewCount" : undefined}
                  onChange={(e) => onChange("professionalCrewCount", e.target.value)}
                  className={inputClass}
                />
                <FieldError id="err-professionalCrewCount" message={errors.professionalCrewCount} />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>
                  Guests / passengers on board
                  <Required />
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={values.guestCount}
                  aria-invalid={!!errors.guestCount}
                  aria-describedby={errors.guestCount ? "err-guestCount" : undefined}
                  onChange={(e) => onChange("guestCount", e.target.value)}
                  className={inputClass}
                />
                <FieldError id="err-guestCount" message={errors.guestCount} />
              </label>
            </div>
          ) : null}

          <div className="mt-4">
            <label className="flex items-start gap-3 text-sm text-ink/80">
              <input
                type="checkbox"
                checked={values.insuranceConfirmed}
                aria-invalid={!!errors.insuranceConfirmed}
                aria-describedby={errors.insuranceConfirmed ? "err-insuranceConfirmed" : undefined}
                onChange={(e) => onChange("insuranceConfirmed", e.target.checked)}
                className="mt-1"
              />
              <span>
                Commercial third-party liability insurance is in place
                <Required />
              </span>
            </label>
            <FieldError id="err-insuranceConfirmed" message={errors.insuranceConfirmed} />
          </div>

          <div className="mt-6 space-y-1 text-sm text-ink/75">
            {notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
            <p className="pt-1 text-xs text-ink/70">{disclaimer}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
