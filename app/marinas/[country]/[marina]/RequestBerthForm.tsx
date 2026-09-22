"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Marina } from "../../../../data/marinas";
import { COUNTRIES } from "../../../../lib/countries";

type VesselType = "sail" | "motor" | "catamaran" | "other";
type Amperage = "16" | "32" | "63";
type EuStatus = "yes" | "no" | "";

type CrewMember = {
  fullName: string;
  dateOfBirth: string;
  nationality: string;
  passportNumber: string;
  role: string;
  joinDate: string;
};

const emptyCrewMember = (): CrewMember => ({
  fullName: "",
  dateOfBirth: "",
  nationality: "",
  passportNumber: "",
  role: "",
  joinDate: "",
});

type FormData = {
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
};

const VESSEL_TYPE_LABELS: Record<VesselType, string> = {
  sail: "Sail",
  motor: "Motor",
  catamaran: "Catamaran",
  other: "Other",
};

type Errors = Partial<Record<keyof FormData, string>> & { crew?: string };

function validate(form: FormData): Errors {
  const errors: Errors = {};

  if (!form.arrival) errors.arrival = "Required";
  if (!form.eta) errors.eta = "Required";

  if (!form.openEnded) {
    if (!form.departure) errors.departure = "Required";
    if (!form.etd) errors.etd = "Required";
    if (
      form.arrival &&
      form.departure &&
      new Date(form.departure) <= new Date(form.arrival)
    ) {
      errors.departure = "Departure must be after arrival";
    }
  }

  if (!form.boatName.trim()) errors.boatName = "Required";
  if (!form.vesselType) errors.vesselType = "Required";
  if (!form.loa || Number(form.loa) <= 0) errors.loa = "Enter a positive number";
  if (!form.beam || Number(form.beam) <= 0) errors.beam = "Enter a positive number";
  if (!form.draft || Number(form.draft) <= 0) errors.draft = "Enter a positive number";
  if (!form.flagCountry) errors.flagCountry = "Required";

  if (!form.skipperName.trim()) errors.skipperName = "Required";
  if (!form.phone.trim()) errors.phone = "Required";
  if (!form.email.trim()) {
    errors.email = "Required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email address";
  }
  if (!form.peopleOnBoard || Number(form.peopleOnBoard) <= 0) {
    errors.peopleOnBoard = "Required";
  }

  if (form.shorePower && !form.amperage) {
    errors.amperage = "Choose an amperage";
  }

  if (!form.euStatus) errors.euStatus = "Required";
  if (form.euStatus === "no") {
    if (!form.lastPort.trim()) errors.lastPort = "Required";
    if (!form.nextPort.trim()) errors.nextPort = "Required";
    const hasCompleteCrewRow = form.crew.some(
      (c) =>
        c.fullName.trim() &&
        c.dateOfBirth &&
        c.nationality &&
        c.passportNumber.trim() &&
        c.role.trim() &&
        c.joinDate
    );
    if (!hasCompleteCrewRow) {
      errors.crew = "Add at least one complete crew member";
    }
  }

  return errors;
}

function formatEurShort(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

function buildSummary(
  form: FormData,
  marina: Marina,
  nights: number | null
): string {
  const lines: string[] = [];

  lines.push(`BERTH ENQUIRY — ${marina.name.toUpperCase()}`);
  lines.push("");

  lines.push("YOUR VISIT");
  lines.push(`Arrival: ${form.arrival} (ETA ${form.eta})`);
  if (form.openEnded) {
    lines.push("Departure: open-ended stay");
  } else {
    lines.push(`Departure: ${form.departure} (ETD ${form.etd})`);
    if (nights) lines.push(`Nights: ${nights}`);
  }
  lines.push("");

  lines.push("YOUR BOAT");
  lines.push(`Boat name: ${form.boatName}`);
  lines.push(`Vessel type: ${form.vesselType ? VESSEL_TYPE_LABELS[form.vesselType] : ""}`);
  lines.push(`Length overall: ${form.loa} m`);
  lines.push(`Beam: ${form.beam} m`);
  lines.push(`Draft: ${form.draft} m`);
  lines.push(`Flag: ${form.flagCountry}`);
  if (form.berthId.trim()) lines.push(`Selected berth: ${form.berthId}`);
  lines.push("");

  lines.push("SKIPPER & CONTACT");
  lines.push(`Skipper: ${form.skipperName}`);
  lines.push(`Phone: ${form.phone}`);
  lines.push(`Email: ${form.email}`);
  if (form.homePort.trim()) lines.push(`Home port: ${form.homePort}`);
  lines.push(`People on board: ${form.peopleOnBoard}`);
  lines.push("");

  const services: string[] = [];
  if (form.shorePower) services.push(`Shore power (${form.amperage}A)`);
  if (form.water) services.push("Water");
  if (form.helpMooring) services.push("Help mooring on arrival");
  if (form.helpSlipping) services.push("Help slipping lines on departure");
  if (form.pumpOut) services.push("Pump-out");
  if (form.fuel) services.push("Fuel on arrival");
  if (form.laundry) services.push("Laundry");
  if (services.length > 0) {
    lines.push("SERVICES NEEDED");
    lines.push(...services);
    lines.push("");
  }

  lines.push("VESSEL STATUS");
  lines.push(
    `EU-flagged & EU/Schengen crew, arriving from another EU port: ${
      form.euStatus === "yes" ? "Yes" : "No"
    }`
  );
  if (form.euStatus === "no") {
    lines.push(`Last port: ${form.lastPort}`);
    lines.push(`Next port: ${form.nextPort}`);
    const completeCrew = form.crew.filter((c) => c.fullName.trim());
    if (completeCrew.length > 0) {
      lines.push("");
      lines.push("CREW LIST");
      completeCrew.forEach((c, i) => {
        lines.push(
          `${i + 1}. ${c.fullName} — DOB ${c.dateOfBirth} — ${c.nationality} — Passport ${c.passportNumber} — ${c.role} — Joined ${c.joinDate}`
        );
      });
    }
  }

  return lines.join("\n").trim();
}

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass =
  "text-xs font-normal tracking-wide text-navy/60 uppercase";
const errorClass = "mt-1 text-xs font-light text-red-600";

function RequiredMark() {
  return <span className="text-red-500"> *</span>;
}

type Props = {
  marina: Marina;
  initialArrival?: string;
  initialDeparture?: string;
  initialLength?: string;
  selectedBerthId?: string | null;
};

export default function RequestBerthForm({
  marina,
  initialArrival = "",
  initialDeparture = "",
  initialLength = "",
  selectedBerthId,
}: Props) {
  const [form, setForm] = useState<FormData>({
    arrival: initialArrival,
    eta: "",
    departure: initialDeparture,
    etd: "",
    openEnded: false,
    boatName: "",
    vesselType: "",
    loa: initialLength,
    beam: "",
    draft: "",
    flagCountry: "",
    berthId: selectedBerthId ?? "",
    skipperName: "",
    phone: "",
    email: "",
    homePort: "",
    peopleOnBoard: "",
    shorePower: false,
    amperage: "",
    water: false,
    helpMooring: false,
    helpSlipping: false,
    pumpOut: false,
    fuel: false,
    laundry: false,
    euStatus: "",
    lastPort: "",
    nextPort: "",
    crew: [emptyCrewMember()],
  });

  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Reflect a berth clicked on the map above, without overwriting a
  // manual edit when the map selection is cleared.
  useEffect(() => {
    if (selectedBerthId) {
      setForm((f) => ({ ...f, berthId: selectedBerthId }));
    }
  }, [selectedBerthId]);

  useEffect(() => {
    if (submitted) setErrors(validate(form));
  }, [form, submitted]);

  const nights = useMemo(() => {
    if (form.openEnded || !form.arrival || !form.departure) return null;
    const a = new Date(form.arrival);
    const d = new Date(form.departure);
    const diff = Math.round((d.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }, [form.arrival, form.departure, form.openEnded]);

  function setField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function updateCrew(index: number, patch: Partial<CrewMember>) {
    setForm((f) => ({
      ...f,
      crew: f.crew.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));
  }

  function addCrewRow() {
    setForm((f) => ({ ...f, crew: [...f.crew, emptyCrewMember()] }));
  }

  function removeCrewRow(index: number) {
    setForm((f) => ({
      ...f,
      crew: f.crew.length > 1 ? f.crew.filter((_, i) => i !== index) : f.crew,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const validationErrors = validate(form);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const text = buildSummary(form, marina, nights);
    setSummary(text);
    setCopied(false);

    const mailto = `mailto:${marina.email}?subject=${encodeURIComponent(
      "Berth enquiry — Marina de Cascais"
    )}&body=${encodeURIComponent(text)}`;
    window.location.href = mailto;
  }

  async function handleCopy() {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — nothing more we can do here.
    }
  }

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        Request a berth
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-500">
        Send {marina.name} everything they need to confirm your visit. This
        opens a pre-filled email — nothing is submitted to a server.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-12">
        {/* 1. Your visit */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Your visit
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className={labelClass}>
                Arrival date
                <RequiredMark />
              </span>
              <input
                type="date"
                value={form.arrival}
                onChange={(e) => setField("arrival", e.target.value)}
                className={inputClass}
              />
              {errors.arrival ? <p className={errorClass}>{errors.arrival}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                ETA
                <RequiredMark />
              </span>
              <input
                type="time"
                value={form.eta}
                onChange={(e) => setField("eta", e.target.value)}
                className={inputClass}
              />
              {errors.eta ? <p className={errorClass}>{errors.eta}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Departure date
                {!form.openEnded ? <RequiredMark /> : null}
              </span>
              <input
                type="date"
                value={form.departure}
                onChange={(e) => setField("departure", e.target.value)}
                disabled={form.openEnded}
                className={`${inputClass} disabled:bg-neutral-50 disabled:text-neutral-400`}
              />
              {errors.departure ? <p className={errorClass}>{errors.departure}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                ETD
                {!form.openEnded ? <RequiredMark /> : null}
              </span>
              <input
                type="time"
                value={form.etd}
                onChange={(e) => setField("etd", e.target.value)}
                disabled={form.openEnded}
                className={`${inputClass} disabled:bg-neutral-50 disabled:text-neutral-400`}
              />
              {errors.etd ? <p className={errorClass}>{errors.etd}</p> : null}
            </label>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-light text-neutral-600">
            <input
              type="checkbox"
              checked={form.openEnded}
              onChange={(e) => setField("openEnded", e.target.checked)}
            />
            Open-ended stay (no departure date yet)
          </label>

          <p className="mt-4 text-sm font-light text-neutral-500">
            Nights:{" "}
            <span className="font-normal text-navy">
              {form.openEnded ? "Open-ended" : nights ?? "—"}
            </span>
          </p>
        </fieldset>

        {/* 2. Your boat */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Your boat
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className={labelClass}>
                Boat name
                <RequiredMark />
              </span>
              <input
                type="text"
                value={form.boatName}
                onChange={(e) => setField("boatName", e.target.value)}
                className={inputClass}
              />
              {errors.boatName ? <p className={errorClass}>{errors.boatName}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Vessel type
                <RequiredMark />
              </span>
              <select
                value={form.vesselType}
                onChange={(e) =>
                  setField("vesselType", e.target.value as VesselType | "")
                }
                className={inputClass}
              >
                <option value="">Select…</option>
                {(Object.keys(VESSEL_TYPE_LABELS) as VesselType[]).map((key) => (
                  <option key={key} value={key}>
                    {VESSEL_TYPE_LABELS[key]}
                  </option>
                ))}
              </select>
              {errors.vesselType ? <p className={errorClass}>{errors.vesselType}</p> : null}
              {form.vesselType === "catamaran" ? (
                <p className="mt-1 text-xs font-light text-neutral-400">
                  Catamarans may need a wider, pricier berth.
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Length overall (m)
                <RequiredMark />
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.loa}
                onChange={(e) => setField("loa", e.target.value)}
                className={inputClass}
              />
              <p className="mt-1 text-xs font-light text-neutral-400">
                Including bowsprit, davits, dinghy
              </p>
              {errors.loa ? <p className={errorClass}>{errors.loa}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Beam (m)
                <RequiredMark />
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.beam}
                onChange={(e) => setField("beam", e.target.value)}
                className={inputClass}
              />
              {errors.beam ? <p className={errorClass}>{errors.beam}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Draft (m)
                <RequiredMark />
              </span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={form.draft}
                onChange={(e) => setField("draft", e.target.value)}
                className={inputClass}
              />
              {errors.draft ? <p className={errorClass}>{errors.draft}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Flag / country of registration
                <RequiredMark />
              </span>
              <select
                value={form.flagCountry}
                onChange={(e) => setField("flagCountry", e.target.value)}
                className={inputClass}
              >
                <option value="">Select…</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.flagCountry ? <p className={errorClass}>{errors.flagCountry}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>Selected berth</span>
              <input
                type="text"
                value={form.berthId}
                onChange={(e) => setField("berthId", e.target.value)}
                placeholder="e.g. I-4"
                className={inputClass}
              />
              <p className="mt-1 text-xs font-light text-neutral-400">
                Auto-filled if you selected one above
              </p>
            </label>
          </div>
        </fieldset>

        {/* 3. Skipper & contact */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Skipper &amp; contact
          </legend>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className={labelClass}>
                Skipper full name
                <RequiredMark />
              </span>
              <input
                type="text"
                value={form.skipperName}
                onChange={(e) => setField("skipperName", e.target.value)}
                className={inputClass}
              />
              {errors.skipperName ? <p className={errorClass}>{errors.skipperName}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Phone
                <RequiredMark />
              </span>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputClass}
              />
              {errors.phone ? <p className={errorClass}>{errors.phone}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Email
                <RequiredMark />
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
              />
              {errors.email ? <p className={errorClass}>{errors.email}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>Home port</span>
              <input
                type="text"
                value={form.homePort}
                onChange={(e) => setField("homePort", e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                People on board
                <RequiredMark />
              </span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.peopleOnBoard}
                onChange={(e) => setField("peopleOnBoard", e.target.value)}
                className={inputClass}
              />
              {errors.peopleOnBoard ? <p className={errorClass}>{errors.peopleOnBoard}</p> : null}
            </label>
          </div>
        </fieldset>

        {/* 4. Services needed */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Services needed
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
                <input
                  type="checkbox"
                  checked={form.shorePower}
                  onChange={(e) => setField("shorePower", e.target.checked)}
                />
                Shore power
              </label>
              {form.shorePower ? (
                <div className="mt-2 ml-6">
                  <select
                    value={form.amperage}
                    onChange={(e) =>
                      setField("amperage", e.target.value as Amperage | "")
                    }
                    className={`${inputClass} mt-0 max-w-[160px]`}
                  >
                    <option value="">Amperage…</option>
                    <option value="16">16A</option>
                    <option value="32">32A</option>
                    <option value="63">63A</option>
                  </select>
                  {errors.amperage ? <p className={errorClass}>{errors.amperage}</p> : null}
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.water}
                onChange={(e) => setField("water", e.target.checked)}
              />
              Water
            </label>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.helpMooring}
                onChange={(e) => setField("helpMooring", e.target.checked)}
              />
              Help mooring on arrival
            </label>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.helpSlipping}
                onChange={(e) => setField("helpSlipping", e.target.checked)}
              />
              Help slipping lines on departure
            </label>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.pumpOut}
                onChange={(e) => setField("pumpOut", e.target.checked)}
              />
              Pump-out
            </label>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.fuel}
                onChange={(e) => setField("fuel", e.target.checked)}
              />
              Fuel on arrival
            </label>

            <label className="flex items-center gap-2 text-sm font-light text-neutral-600">
              <input
                type="checkbox"
                checked={form.laundry}
                onChange={(e) => setField("laundry", e.target.checked)}
              />
              Laundry
            </label>
          </div>
          <p className="mt-4 text-xs font-light text-neutral-400">
            Power and water are metered and charged separately from the berth
            fee.
          </p>
        </fieldset>

        {/* 5. Vessel status */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Vessel status
          </legend>
          <p className="mt-4 text-sm font-light text-neutral-600">
            Is your vessel EU-flagged AND is all crew EU/Schengen, arriving
            from another EU port?
            <RequiredMark />
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setField("euStatus", "yes")}
              className={`px-6 py-2 text-sm font-normal tracking-wide ${
                form.euStatus === "yes"
                  ? "bg-navy text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-navy/40"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setField("euStatus", "no")}
              className={`px-6 py-2 text-sm font-normal tracking-wide ${
                form.euStatus === "no"
                  ? "bg-navy text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-navy/40"
              }`}
            >
              No
            </button>
          </div>
          {errors.euStatus ? <p className={errorClass}>{errors.euStatus}</p> : null}

          {form.euStatus === "yes" ? (
            <p className="mt-4 text-sm font-light text-neutral-500">
              Have your boat registration, insurance certificate, and
              skipper&apos;s certificate of competence ready on arrival.
            </p>
          ) : null}

          {form.euStatus === "no" ? (
            <div className="mt-6 border-t border-neutral-200 pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={labelClass}>
                    Last port
                    <RequiredMark />
                  </span>
                  <input
                    type="text"
                    value={form.lastPort}
                    onChange={(e) => setField("lastPort", e.target.value)}
                    className={inputClass}
                  />
                  {errors.lastPort ? <p className={errorClass}>{errors.lastPort}</p> : null}
                </label>

                <label className="block text-sm">
                  <span className={labelClass}>
                    Next port
                    <RequiredMark />
                  </span>
                  <input
                    type="text"
                    value={form.nextPort}
                    onChange={(e) => setField("nextPort", e.target.value)}
                    className={inputClass}
                  />
                  {errors.nextPort ? <p className={errorClass}>{errors.nextPort}</p> : null}
                </label>
              </div>

              <div className="mt-6">
                <p className={labelClass}>
                  Crew list
                  <RequiredMark />
                </p>
                <div className="mt-3 space-y-4">
                  {form.crew.map((member, index) => (
                    <div
                      key={index}
                      className="grid gap-3 border border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-6"
                    >
                      <input
                        type="text"
                        placeholder="Full name"
                        value={member.fullName}
                        onChange={(e) =>
                          updateCrew(index, { fullName: e.target.value })
                        }
                        className={`${inputClass} mt-0`}
                      />
                      <input
                        type="date"
                        aria-label="Date of birth"
                        value={member.dateOfBirth}
                        onChange={(e) =>
                          updateCrew(index, { dateOfBirth: e.target.value })
                        }
                        className={`${inputClass} mt-0`}
                      />
                      <select
                        aria-label="Nationality"
                        value={member.nationality}
                        onChange={(e) =>
                          updateCrew(index, { nationality: e.target.value })
                        }
                        className={`${inputClass} mt-0`}
                      >
                        <option value="">Nationality…</option>
                        {COUNTRIES.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Passport number"
                        value={member.passportNumber}
                        onChange={(e) =>
                          updateCrew(index, { passportNumber: e.target.value })
                        }
                        className={`${inputClass} mt-0`}
                      />
                      <input
                        type="text"
                        placeholder="Role on board"
                        value={member.role}
                        onChange={(e) =>
                          updateCrew(index, { role: e.target.value })
                        }
                        className={`${inputClass} mt-0`}
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          aria-label="Join date"
                          value={member.joinDate}
                          onChange={(e) =>
                            updateCrew(index, { joinDate: e.target.value })
                          }
                          className={`${inputClass} mt-0`}
                        />
                        <button
                          type="button"
                          onClick={() => removeCrewRow(index)}
                          disabled={form.crew.length === 1}
                          className="px-2 text-xs font-normal text-neutral-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove crew member"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.crew ? <p className={errorClass}>{errors.crew}</p> : null}
                <button
                  type="button"
                  onClick={addCrewRow}
                  className="mt-3 text-sm font-normal text-navy underline underline-offset-4 hover:text-navy-accent"
                >
                  + Add crew member
                </button>
              </div>

              <div className="mt-6 space-y-1 text-xs font-light text-neutral-400">
                <p>Passports must be valid at least 3 months beyond departure.</p>
                <p>
                  Non-EU-flagged boats get 18 months Temporary Admission
                  (customs).
                </p>
                <p>EU boats should carry VAT-paid evidence.</p>
              </div>
            </div>
          ) : null}
        </fieldset>

        {/* 6. Documents reminder */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            Documents to bring
          </legend>
          <p className="mt-4 text-sm font-light leading-relaxed text-neutral-600">
            Bring: boat registration (Portugal requires originals, not
            laminated copies), proof of third-party insurance (min{" "}
            {formatEurShort(marina.insuranceMinimumEur)}, certificate in
            Portuguese if possible), and the skipper&apos;s certificate of
            competence.
          </p>
        </fieldset>

        <div>
          <button
            type="submit"
            className="bg-navy px-8 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
          >
            Send enquiry
          </button>
        </div>
      </form>

      {summary ? (
        <div className="mt-10 border-t border-neutral-200 pt-8">
          <h3 className="text-sm font-normal tracking-tight text-navy">
            Enquiry summary
          </h3>
          <p className="mt-2 text-xs font-light text-neutral-400">
            Your email app should have opened with this pre-filled. If it
            didn&apos;t, copy the text below and send it manually.
          </p>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap border border-neutral-200 bg-neutral-50 p-4 text-xs font-light text-neutral-600">
            {summary}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 bg-navy-accent px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75]"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
