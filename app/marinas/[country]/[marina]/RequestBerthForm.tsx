"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  calculateQuote,
  classifyBoatLength,
  SEASON_LABELS,
  type Marina,
  type Quote,
} from "../../../../data/marinas";
import {
  EMPTY_DOCUMENTS,
  loadBoatProfile,
  loadBoats,
  type BoatDocuments,
} from "../../../../lib/boatProfile";
import { COUNTRIES } from "../../../../lib/countries";
import BoatSwitcher from "../../../components/BoatSwitcher";
import DocumentWallet from "./DocumentWallet";
import LengthInput from "../../../components/LengthInput";
import { useUnits } from "../../../components/UnitsProvider";
import { loadLastEnquiry, saveLastEnquiry } from "../../../../lib/tripStore";

type VesselType = "sail" | "motor" | "catamaran" | "other";
type Amperage = string;
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
        c.fullName.trim() && c.nationality && c.role.trim()
    );
    if (!hasCompleteCrewRow) {
      errors.crew =
        "Add at least one crew member with a name, nationality and role";
    }
  }

  return errors;
}

function formatEurShort(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

function formatEur(amount: number): string {
  return `€${amount.toFixed(2)}`;
}

function buildSummary(
  form: FormData,
  marina: Marina,
  nights: number | null,
  quote: Quote | null,
  docs: BoatDocuments | null
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

  if (quote) {
    lines.push("ESTIMATE (excl. VAT and utilities — to be confirmed by the marina)");
    lines.push(`Berth class: ${quote.marinaClass}`);
    quote.berthLines.forEach((l) =>
      lines.push(
        `${l.nights} night(s) × ${formatEur(l.rateEur)} (${SEASON_LABELS[l.season]}) = ${formatEur(l.subtotalEur)}`
      )
    );
    quote.addOnLines.forEach((l) => {
      const parts = [l.amountEur !== null ? formatEur(l.amountEur) : "", l.note ?? ""];
      lines.push(`${l.label}: ${parts.filter(Boolean).join(" — ")}`);
    });
    lines.push(`Estimated total: ${formatEur(quote.estimatedTotalEur)}`);
    lines.push("");
  }

  if (docs) {
    const docLines = [
      docs.registrationNumber && `Registration number: ${docs.registrationNumber}`,
      docs.insuranceProvider && `Insurance provider: ${docs.insuranceProvider}`,
      docs.insurancePolicy && `Insurance policy: ${docs.insurancePolicy}`,
      docs.insuranceExpiry && `Insurance expiry: ${docs.insuranceExpiry}`,
      docs.competenceCertificate &&
        `Competence certificate: ${docs.competenceCertificate}`,
      docs.vhfLicence && `VHF licence: ${docs.vhfLicence}`,
    ].filter(Boolean) as string[];
    if (docLines.length > 0) {
      lines.push("DOCUMENTS (originals to be shown on arrival)");
      lines.push(...docLines);
      lines.push("");
    }
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
        const parts = [
          c.fullName,
          c.dateOfBirth && `DOB ${c.dateOfBirth}`,
          c.nationality,
          c.passportNumber.trim() && `Passport ${c.passportNumber.trim()}`,
          c.role.trim(),
          c.joinDate && `Joined ${c.joinDate}`,
        ].filter(Boolean);
        lines.push(`${i + 1}. ${parts.join(" — ")}`);
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
  return <span className="text-red-600"> *</span>;
}

type Props = {
  marina: Marina;
  initialArrival?: string;
  initialDeparture?: string;
  initialLength?: string;
  selectedBerthId?: string | null;
  rebookToken?: number;
};

export default function RequestBerthForm({
  marina,
  initialArrival = "",
  initialDeparture = "",
  initialLength = "",
  selectedBerthId,
  rebookToken = 0,
}: Props) {
  const { label: unit } = useUnits();
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

  const [docs, setDocs] = useState<BoatDocuments>({ ...EMPTY_DOCUMENTS });
  const [includeDocs, setIncludeDocs] = useState(false);
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

  // Pre-fill from the saved boat (or the last dimensions typed elsewhere),
  // only into fields the visitor hasn't filled from the search above.
  useEffect(() => {
    const store = loadBoats();
    const active = store.boats.find((b) => b.id === store.activeId);
    if (active) {
      setDocs(active.documents ?? { ...EMPTY_DOCUMENTS });
      const vesselType = (["sail", "motor", "catamaran", "other"] as const).find(
        (v) => v === active.type
      );
      setForm((f) => ({
        ...f,
        boatName: f.boatName || active.name,
        vesselType: f.vesselType || vesselType || "",
        loa: f.loa || active.loa,
        beam: f.beam || active.beam,
        draft: f.draft || active.draft,
        flagCountry: f.flagCountry || active.flag,
        homePort: f.homePort || active.homePort,
      }));
      return;
    }
    const profile = loadBoatProfile();
    setForm((f) => ({
      ...f,
      loa: f.loa || profile.loa,
      beam: f.beam || profile.beam,
      draft: f.draft || profile.draft,
    }));
  }, []);

  // "Rebook this stay": same boat and services as the last enquiry, dates blank.
  useEffect(() => {
    if (rebookToken === 0) return;
    const last = loadLastEnquiry();
    if (last && last.marinaId === marina.id) {
      setSubmitted(false);
      setErrors({});
      setSummary(null);
      setForm((f) => ({
        ...f,
        arrival: "",
        eta: "",
        departure: "",
        etd: "",
        openEnded: false,
        boatName: last.boatName,
        vesselType:
          (["sail", "motor", "catamaran", "other"] as const).find(
            (v) => v === last.vesselType
          ) ?? "",
        loa: last.loa,
        beam: last.beam,
        draft: last.draft,
        flagCountry: last.flag,
        homePort: last.homePort,
        berthId: "",
        ...last.services,
        amperage: last.services.amperage,
      }));
    }
    document
      .getElementById("request-berth")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [rebookToken, marina.id]);

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

  const quote = useMemo(() => {
    const loaNum = Number(form.loa);
    if (!form.arrival || !(loaNum > 0)) return null;
    let departure = form.departure;
    if (form.openEnded) {
      const next = new Date(form.arrival);
      next.setDate(next.getDate() + 1);
      departure = next.toISOString().slice(0, 10);
    }
    return calculateQuote(
      marina,
      { loa: loaNum, arrival: form.arrival, departure },
      {
        shorePower: form.shorePower,
        water: form.water,
        pumpOut: form.pumpOut,
        fuel: form.fuel,
        laundry: form.laundry,
      }
    );
  }, [
    marina,
    form.loa,
    form.arrival,
    form.departure,
    form.openEnded,
    form.shorePower,
    form.water,
    form.pumpOut,
    form.fuel,
    form.laundry,
  ]);

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

    const text = buildSummary(form, marina, nights, quote, includeDocs ? docs : null);
    saveLastEnquiry({
      marinaId: marina.id,
      countrySlug: marina.countrySlug,
      marinaName: marina.name,
      savedAt: new Date().toISOString(),
      arrival: form.arrival,
      eta: form.eta,
      departure: form.openEnded ? "" : form.departure,
      etd: form.openEnded ? "" : form.etd,
      openEnded: form.openEnded,
      boatName: form.boatName,
      vesselType: form.vesselType,
      loa: form.loa,
      beam: form.beam,
      draft: form.draft,
      flag: form.flagCountry,
      homePort: form.homePort,
      berthId: form.berthId,
      services: {
        shorePower: form.shorePower,
        amperage: form.amperage,
        water: form.water,
        helpMooring: form.helpMooring,
        helpSlipping: form.helpSlipping,
        pumpOut: form.pumpOut,
        fuel: form.fuel,
        laundry: form.laundry,
      },
    });
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
    <div
      id="request-berth"
      className="scroll-mt-24 rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10"
    >
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
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
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
                className={`${inputClass} disabled:bg-neutral-50 disabled:text-neutral-500`}
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
                className={`${inputClass} disabled:bg-neutral-50 disabled:text-neutral-500`}
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
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Your boat
          </legend>
          <BoatSwitcher
            current={{
              name: form.boatName,
              type: form.vesselType,
              loa: form.loa,
              beam: form.beam,
              draft: form.draft,
              flag: form.flagCountry,
              homePort: form.homePort,
              documents: docs,
            }}
            onSelect={(boat) => {
              setDocs(boat.documents ?? { ...EMPTY_DOCUMENTS });
              setForm((f) => ({
                ...f,
                boatName: boat.name,
                vesselType: (["sail", "motor", "catamaran", "other"] as const).find(
                  (v) => v === boat.type
                ) ?? "",
                loa: boat.loa,
                beam: boat.beam,
                draft: boat.draft,
                flagCountry: boat.flag,
                homePort: boat.homePort,
              }));
            }}
          />
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
                <p className="mt-1 text-xs font-light text-neutral-500">
                  Catamarans may need a wider, pricier berth.
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Length overall ({unit})
                <RequiredMark />
              </span>
              <LengthInput
                valueM={form.loa}
                onChangeM={(v) => setField("loa", v)}
                className={inputClass}
              />
              <p className="mt-1 text-xs font-light text-neutral-500">
                Including bowsprit, davits, dinghy
              </p>
              {errors.loa ? <p className={errorClass}>{errors.loa}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Beam ({unit})
                <RequiredMark />
              </span>
              <LengthInput
                valueM={form.beam}
                onChangeM={(v) => setField("beam", v)}
                className={inputClass}
              />
              {errors.beam ? <p className={errorClass}>{errors.beam}</p> : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Draft ({unit})
                <RequiredMark />
              </span>
              <LengthInput
                valueM={form.draft}
                onChangeM={(v) => setField("draft", v)}
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
              <p className="mt-1 text-xs font-light text-neutral-500">
                Auto-filled if you selected one above
              </p>
            </label>
          </div>
        </fieldset>

        {/* 3. Skipper & contact */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
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
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
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
                    {marina.serviceFees.amperageOptions.map((amps) => (
                      <option key={amps} value={String(amps)}>
                        {amps}A
                      </option>
                    ))}
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
          <p className="mt-4 text-xs font-light text-neutral-500">
            Power and water are metered and charged separately from the berth
            fee.
          </p>
        </fieldset>

        {/* Price estimate */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Your estimate
          </legend>
          {quote ? (
            <div className="mt-4" aria-live="polite">
              <p className="text-sm font-light text-neutral-500">
                Class {quote.marinaClass} berth ·{" "}
                {form.openEnded
                  ? "nightly rate (open-ended stay)"
                  : `${quote.nights} night${quote.nights === 1 ? "" : "s"}`}
              </p>
              <table className="mt-3 w-full border-collapse text-left text-sm">
                <tbody>
                  {quote.berthLines.map((line) => (
                    <tr
                      key={line.season}
                      className="border-b border-neutral-100 text-neutral-600"
                    >
                      <td className="py-2 pr-4 font-light">
                        {line.nights} × {formatEur(line.rateEur)}
                        <span className="block text-xs text-neutral-500">
                          {SEASON_LABELS[line.season]}
                        </span>
                      </td>
                      <td className="py-2 text-right font-normal text-navy">
                        {formatEur(line.subtotalEur)}
                      </td>
                    </tr>
                  ))}
                  {quote.addOnLines.map((line) => (
                    <tr
                      key={line.label}
                      className="border-b border-neutral-100 text-neutral-600"
                    >
                      <td className="py-2 pr-4 font-light">
                        {line.label}
                        {line.note ? (
                          <span className="block text-xs text-neutral-500">
                            {line.note}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2 text-right font-normal text-navy">
                        {line.amountEur !== null ? formatEur(line.amountEur) : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-3 pr-4 font-normal text-navy">
                      {form.openEnded ? "Estimated first night" : "Estimated total"}
                    </td>
                    <td className="pt-3 text-right text-base font-normal text-navy">
                      {formatEur(quote.estimatedTotalEur)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs font-light text-neutral-500">
                Excl. {Math.round(marina.vatRate * 100)}% VAT and utilities —
                estimate, confirm with marina.
              </p>
            </div>
          ) : (
            <p className="mt-4 text-sm font-light text-neutral-500">
              {Number(form.loa) > 0 && classifyBoatLength(Number(form.loa)) === null
                ? "Your length is outside the standard berth classes — contact the marina for a quote."
                : "Enter your arrival and departure dates and boat length to see a price estimate."}
            </p>
          )}
        </fieldset>

        {/* 5. Vessel status */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
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
            <div className="mt-4 space-y-1 text-sm font-light text-neutral-500">
              {marina.vesselStatusNotes.euReminders.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
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
                <p className="mt-2 text-xs font-light text-neutral-500">
                  Required: name, nationality and role. Date of birth,
                  passport number and join date are optional — passport
                  numbers and other private details can be given to the
                  marina staff in person instead.
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
                        aria-label="Date of birth (optional)"
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
                        placeholder="Passport number (optional)"
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
                          aria-label="Join date (optional)"
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
                          className="px-2 text-xs font-normal text-neutral-500 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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

              <div className="mt-6 space-y-1 text-xs font-light text-neutral-500">
                {marina.vesselStatusNotes.internationalNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          ) : null}
        </fieldset>

        {/* 6. Document wallet */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Document wallet
          </legend>
          <DocumentWallet
            documents={docs}
            onChange={setDocs}
            insuranceMinimumLabel={formatEurShort(marina.insuranceMinimumEur)}
            arrival={form.arrival}
            includeInEnquiry={includeDocs}
            onIncludeChange={setIncludeDocs}
          />
          <BoatSwitcher
            heading="Boats & documents — save this boat or switch to another"
            current={{
              name: form.boatName,
              type: form.vesselType,
              loa: form.loa,
              beam: form.beam,
              draft: form.draft,
              flag: form.flagCountry,
              homePort: form.homePort,
              documents: docs,
            }}
            onSelect={(boat) => {
              setDocs(boat.documents ?? { ...EMPTY_DOCUMENTS });
              setForm((f) => ({
                ...f,
                boatName: boat.name,
                vesselType:
                  (["sail", "motor", "catamaran", "other"] as const).find(
                    (v) => v === boat.type
                  ) ?? "",
                loa: boat.loa,
                beam: boat.beam,
                draft: boat.draft,
                flagCountry: boat.flag,
                homePort: boat.homePort,
              }));
            }}
          />
        </fieldset>

        {/* 7. Pre-arrival checklist */}
        <fieldset>
          <legend className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            Pre-arrival checklist
          </legend>
          <ul className="mt-4 space-y-2">
            {marina.preArrivalChecklist.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-sm font-light text-neutral-600"
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="mt-0.5 h-4 w-4 shrink-0 text-navy"
                  aria-hidden="true"
                >
                  <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        </fieldset>

        <div>
          <p className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            Cancellation policy
          </p>
          <p className="mt-2 text-sm font-light text-neutral-600">
            {marina.cancellationPolicy ??
              "Cancellation terms are confirmed by the marina — ask when they reply to your enquiry."}
          </p>
          <p className="mt-4 text-sm font-light text-neutral-600">
            This sends an enquiry; the marina confirms availability by email.
          </p>
          <button
            type="submit"
            className="mt-6 bg-navy px-8 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
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
          <p className="mt-2 text-xs font-light text-neutral-500">
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
