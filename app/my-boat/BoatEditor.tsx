"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  EMPTY_DOCUMENTS,
  type SavedBoat,
} from "../../lib/boatProfile";
import { COUNTRIES } from "../../lib/countries";
import type { BoatInput } from "../components/BoatProvider";
import LengthInput from "../components/LengthInput";
import { useUnits } from "../components/UnitsProvider";

const TYPES = [
  { value: "sail", label: "Sail" },
  { value: "motor", label: "Motor" },
  { value: "catamaran", label: "Catamaran" },
  { value: "other", label: "Other" },
];

const inputClass =
  "field";
const labelClass = "field-label";
const errorClass = "field-error";

type Errors = Partial<
  Record<"name" | "type" | "loa" | "beam" | "draft" | "flag", string>
>;

type Props = {
  initial?: SavedBoat;
  onSave: (boat: BoatInput) => void;
  onCancel: () => void;
};

function Required() {
  return <span className="text-error"> *</span>;
}

export default function BoatEditor({ initial, onSave, onCancel }: Props) {
  const { label: unit } = useUnits();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState(initial?.type ?? "");
  const [loa, setLoa] = useState(initial?.loa ?? "");
  const [beam, setBeam] = useState(initial?.beam ?? "");
  const [draft, setDraft] = useState(initial?.draft ?? "");
  const [flag, setFlag] = useState(initial?.flag ?? "");
  const [homePort, setHomePort] = useState(initial?.homePort ?? "");
  const [errors, setErrors] = useState<Errors>({});
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (tick === 0) return;
    const frame = requestAnimationFrame(() => {
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [tick]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Errors = {};
    if (!name.trim()) next.name = "Enter a name for this boat.";
    if (!type) next.type = "Choose a vessel type: sail, motor, catamaran or other.";
    if (!(Number(loa) > 0)) next.loa = "Enter the length overall, for example 12.5.";
    if (!(Number(beam) > 0)) next.beam = "Enter the beam, for example 4.2.";
    if (!(Number(draft) > 0)) next.draft = "Enter the draft, for example 1.8.";
    if (!flag) next.flag = "Choose the country the boat is registered in.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setTick((n) => n + 1);
      return;
    }
    onSave({
      id: initial?.id,
      name: name.trim(),
      type,
      loa,
      beam,
      draft,
      flag,
      homePort: homePort.trim(),
      documents: initial?.documents ?? { ...EMPTY_DOCUMENTS },
    });
  }

  const fieldError = (key: keyof Errors) =>
    errors[key] ? (
      <p id={`boat-err-${key}`} role="alert" className={errorClass}>
        {errors[key]}
      </p>
    ) : null;
  const aria = (key: keyof Errors) => ({
    "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? `boat-err-${key}` : undefined,
  });

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      noValidate
      className="surface-lift mt-6 p-6 sm:p-8"
    >
      <h3 className="type-heading type-h3 text-ink">
        {initial ? `Edit ${initial.name}` : "Add a boat"}
      </h3>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm">
          <span className={labelClass}>
            Boat name
            <Required />
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            {...aria("name")}
          />
          {fieldError("name")}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Type
            <Required />
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
            {...aria("type")}
          >
            <option value="">Select…</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {fieldError("type")}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Flag / country of registration
            <Required />
          </span>
          <select
            value={flag}
            onChange={(e) => setFlag(e.target.value)}
            className={inputClass}
            {...aria("flag")}
          >
            <option value="">Select…</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {fieldError("flag")}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Length overall ({unit})
            <Required />
          </span>
          <LengthInput
            valueM={loa}
            onChangeM={setLoa}
            className={inputClass}
            invalid={!!errors.loa}
            describedBy={errors.loa ? "boat-err-loa" : undefined}
          />
          <span className="mt-1 block text-xs text-ink/70">
            Including bowsprit, davits, dinghy
          </span>
          {fieldError("loa")}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Beam ({unit})
            <Required />
          </span>
          <LengthInput
            valueM={beam}
            onChangeM={setBeam}
            className={inputClass}
            invalid={!!errors.beam}
            describedBy={errors.beam ? "boat-err-beam" : undefined}
          />
          {fieldError("beam")}
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Draft ({unit})
            <Required />
          </span>
          <LengthInput
            valueM={draft}
            onChangeM={setDraft}
            className={inputClass}
            invalid={!!errors.draft}
            describedBy={errors.draft ? "boat-err-draft" : undefined}
          />
          {fieldError("draft")}
        </label>

        <label className="block text-sm sm:col-span-2 lg:col-span-1">
          <span className={labelClass}>Home port</span>
          <input
            type="text"
            value={homePort}
            onChange={(e) => setHomePort(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="btn-primary"
        >
          {initial ? "Save changes" : "Save boat"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-11 items-center px-2 text-ink underline underline-offset-4 hover:text-ink-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
