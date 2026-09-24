"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { useUnits } from "../../../components/UnitsProvider";
import { loadLastEnquiry, saveLastEnquiry } from "../../../../lib/tripStore";
import { effectiveDeparture, PLAN_KEYS, type StayPlan } from "../../../../lib/stayPlan";
import { formatLength } from "../../../../lib/units";

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

  if (!form.arrival) errors.arrival = "Choose your arrival date in Plan your stay.";
  if (!form.eta) errors.eta = "Enter your expected arrival time, for example 15:30.";

  if (!form.openEnded) {
    if (!form.departure) errors.departure = "Choose your departure date in Plan your stay, or tick open-ended stay.";
    if (!form.etd) errors.etd = "Enter your expected departure time, for example 10:00.";
    if (
      form.arrival &&
      form.departure &&
      new Date(form.departure) <= new Date(form.arrival)
    ) {
      errors.departure = "Departure must be after arrival. Choose a later departure date in Plan your stay.";
    }
  }

  if (!form.boatName.trim()) errors.boatName = "Enter your boat's name.";
  if (!form.vesselType) errors.vesselType = "Choose a vessel type: sail, motor, catamaran or other.";
  if (!form.loa || Number(form.loa) <= 0) errors.loa = "Enter your boat's length overall, for example 12.5.";
  if (!form.beam || Number(form.beam) <= 0) errors.beam = "Enter your boat's beam, for example 4.2.";
  if (!form.draft || Number(form.draft) <= 0) errors.draft = "Enter your boat's draft, for example 1.8.";
  if (!form.flagCountry) errors.flagCountry = "Choose the country your boat is registered in.";

  if (!form.skipperName.trim()) errors.skipperName = "Enter the skipper's full name.";
  if (!form.phone.trim()) errors.phone = "Enter a phone number the marina can reach you on, including the country code.";
  if (!form.email.trim()) {
    errors.email = "Enter your email address so the marina can reply.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter an email address like name@example.com.";
  }
  if (!form.peopleOnBoard || Number(form.peopleOnBoard) <= 0) {
    errors.peopleOnBoard = "Enter how many people will be on board (1 or more).";
  }

  if (form.shorePower && !form.amperage) {
    errors.amperage = "Choose a shore power amperage in Price estimate & extras.";
  }

  if (!form.euStatus) errors.euStatus = "Answer Yes or No so the marina knows which paperwork applies.";
  if (form.euStatus === "no") {
    if (!form.lastPort.trim()) errors.lastPort = "Enter the port you are arriving from.";
    if (!form.nextPort.trim()) errors.nextPort = "Enter the port you are heading to next.";
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

  lines.push(`BERTH ENQUIRY - ${marina.name.toUpperCase()}`);
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
    lines.push("ESTIMATE (excl. VAT and utilities, to be confirmed by the marina)");
    lines.push(`Berth class: ${quote.marinaClass}`);
    quote.berthLines.forEach((l) =>
      lines.push(
        `${l.nights} night(s) × ${formatEur(l.rateEur)} (${SEASON_LABELS[l.season]}) = ${formatEur(l.subtotalEur)}`
      )
    );
    quote.addOnLines.forEach((l) => {
      const parts = [l.amountEur !== null ? formatEur(l.amountEur) : "", l.note ?? ""];
      lines.push(`${l.label}: ${parts.filter(Boolean).join(" - ")}`);
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
        lines.push(`${i + 1}. ${parts.join(" - ")}`);
      });
    }
  }

  return lines.join("\n").trim();
}

const inputClass =
  "mt-2 w-full border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";
const labelClass =
  "text-sm font-medium text-ink/80";
const errorClass = "mt-1 text-xs text-error";

function RequiredMark() {
  return <span className="text-error"> *</span>;
}

type Props = {
  marina: Marina;
  plan: StayPlan;
  onPlanChange: (patch: Partial<StayPlan>) => void;
  selectedBerthId?: string | null;
  rebookToken?: number;
};

export default function RequestBerthForm({
  marina,
  plan,
  onPlanChange,
  selectedBerthId,
  rebookToken = 0,
}: Props) {
  const { units } = useUnits();
  const [localForm, setLocalForm] = useState<FormData>({
    arrival: "",
    eta: "",
    departure: "",
    etd: "",
    openEnded: false,
    boatName: "",
    vesselType: "",
    loa: "",
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

  // Dates, dimensions, ETA/ETD and priced extras live in the shared plan;
  // everything else is local to this form.
  const form: FormData = useMemo(
    () => ({ ...localForm, ...plan }),
    [localForm, plan]
  );
  const formRef = useRef(form);
  formRef.current = form;

  const setForm = useCallback(
    (updater: FormData | ((f: FormData) => FormData)) => {
      const current = formRef.current;
      const next = typeof updater === "function" ? updater(current) : updater;
      const planPatch: Record<string, unknown> = {};
      const localPatch: Record<string, unknown> = {};
      (Object.keys(next) as (keyof FormData)[]).forEach((key) => {
        if (next[key] === current[key]) return;
        if (PLAN_KEYS.has(key)) planPatch[key] = next[key];
        else localPatch[key] = next[key];
      });
      if (Object.keys(planPatch).length > 0) {
        onPlanChange(planPatch as Partial<StayPlan>);
      }
      if (Object.keys(localPatch).length > 0) {
        setLocalForm((f) => ({ ...f, ...(localPatch as Partial<FormData>) }));
      }
    },
    [onPlanChange]
  );

  const [docs, setDocs] = useState<BoatDocuments>({ ...EMPTY_DOCUMENTS });
  const [includeDocs, setIncludeDocs] = useState(false);
  const formElRef = useRef<HTMLFormElement>(null);
  const [submitTick, setSubmitTick] = useState(0);
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

  // After a failed submit, move focus to the first field that needs fixing,
  // or to the note that points at the Plan panel.
  useEffect(() => {
    if (submitTick === 0) return;
    const frame = requestAnimationFrame(() => {
      const target =
        formElRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        formElRef.current?.querySelector<HTMLElement>('[role="alert"][tabindex]');
      target?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [submitTick]);

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
    const departure = effectiveDeparture(plan);
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
    plan,
    form.loa,
    form.arrival,
    form.shorePower,
    form.water,
    form.pumpOut,
    form.fuel,
    form.laundry,
  ]);

  const planErrorLabels: string[] = [];
  if (errors.arrival || errors.departure) planErrorLabels.push("dates");
  if (errors.loa || errors.beam || errors.draft) planErrorLabels.push("boat length, beam and draft");

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
    if (Object.keys(validationErrors).length > 0) {
      setSubmitTick((n) => n + 1);
      return;
    }

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
      "Berth enquiry - Marina de Cascais"
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
      // Clipboard API unavailable: nothing more we can do here.
    }
  }

  return (
    <div
      id="request-berth"
      className="surface-lift scroll-mt-24 p-6 sm:p-8 md:p-10"
    >
      <h2 className="type-heading type-h3 text-ink">
        Request a berth
      </h2>
      <p className="mt-2 text-sm text-ink/70">
        Send {marina.name} everything they need to confirm your visit. This
        opens a pre-filled email. Nothing is submitted to a server.
      </p>

      <form ref={formElRef} onSubmit={handleSubmit} noValidate className="mt-8 space-y-12">
        {/* 1. Your visit */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
            Your visit
          </legend>
          <p className="mt-4 text-sm text-ink/75">
            <span className={labelClass}>Your stay: </span>
            {form.arrival
              ? `${form.arrival} → ${form.openEnded ? "open-ended" : form.departure || "-"}`
              : "not set yet"}
            {nights ? ` · ${nights} night${nights === 1 ? "" : "s"}` : ""}
            {Number(form.loa) > 0
              ? ` · length ${formatLength(Number(form.loa), units)}`
              : ""}
            {Number(form.beam) > 0
              ? `, beam ${formatLength(Number(form.beam), units)}`
              : ""}
            {Number(form.draft) > 0
              ? `, draft ${formatLength(Number(form.draft), units)}`
              : ""}
          </p>
          <p className="mt-1 text-xs text-ink/70">
            Dates and boat size come from{" "}
            <a
              href="#plan-your-stay"
              className="text-ink underline underline-offset-4"
            >
              Plan your stay
            </a>{" "}
            above to edit them.
          </p>
          <div className="mt-4 grid max-w-md gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className={labelClass}>
                ETA
                <RequiredMark />
              </span>
              <input
                type="time"
                value={form.eta}
                aria-invalid={!!errors.eta}
                aria-describedby={errors.eta ? "err-eta" : undefined}
                onChange={(e) => setField("eta", e.target.value)}
                className={inputClass}
              />
              {errors.eta ? (
                <p id="err-eta" role="alert" className={errorClass}>
                  {errors.eta}
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                ETD
                {!form.openEnded ? <RequiredMark /> : null}
              </span>
              <input
                type="time"
                value={form.etd}
                aria-invalid={!!errors.etd}
                aria-describedby={errors.etd ? "err-etd" : undefined}
                onChange={(e) => setField("etd", e.target.value)}
                disabled={form.openEnded}
                className={`${inputClass} disabled:bg-paper-deep disabled:text-ink/70`}
              />
              {errors.etd ? (
                <p id="err-etd" role="alert" className={errorClass}>
                  {errors.etd}
                </p>
              ) : null}
            </label>
          </div>
        </fieldset>

        {/* 2. Your boat */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
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
                aria-invalid={!!errors.boatName}
                aria-describedby={errors.boatName ? "err-boatName" : undefined}
                onChange={(e) => setField("boatName", e.target.value)}
                className={inputClass}
              />
              {errors.boatName ? (
                <p id="err-boatName" role="alert" className={errorClass}>
                  {errors.boatName}
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Vessel type
                <RequiredMark />
              </span>
              <select
                value={form.vesselType}
                aria-invalid={!!errors.vesselType}
                aria-describedby={errors.vesselType ? "err-vesselType" : undefined}
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
              {errors.vesselType ? (
                <p id="err-vesselType" role="alert" className={errorClass}>
                  {errors.vesselType}
                </p>
              ) : null}
              {form.vesselType === "catamaran" ? (
                <p className="mt-1 text-xs text-ink/70">
                  Catamarans may need a wider, pricier berth.
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Flag / country of registration
                <RequiredMark />
              </span>
              <select
                value={form.flagCountry}
                aria-invalid={!!errors.flagCountry}
                aria-describedby={errors.flagCountry ? "err-flagCountry" : undefined}
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
              {errors.flagCountry ? (
                <p id="err-flagCountry" role="alert" className={errorClass}>
                  {errors.flagCountry}
                </p>
              ) : null}
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
              <p className="mt-1 text-xs text-ink/70">
                Auto-filled if you selected one above
              </p>
            </label>
          </div>
        </fieldset>

        {/* 3. Skipper & contact */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
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
                aria-invalid={!!errors.skipperName}
                aria-describedby={errors.skipperName ? "err-skipperName" : undefined}
                onChange={(e) => setField("skipperName", e.target.value)}
                className={inputClass}
              />
              {errors.skipperName ? (
                <p id="err-skipperName" role="alert" className={errorClass}>
                  {errors.skipperName}
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Phone
                <RequiredMark />
              </span>
              <input
                type="tel"
                value={form.phone}
                aria-invalid={!!errors.phone}
                aria-describedby={errors.phone ? "err-phone" : undefined}
                onChange={(e) => setField("phone", e.target.value)}
                className={inputClass}
              />
              {errors.phone ? (
                <p id="err-phone" role="alert" className={errorClass}>
                  {errors.phone}
                </p>
              ) : null}
            </label>

            <label className="block text-sm">
              <span className={labelClass}>
                Email
                <RequiredMark />
              </span>
              <input
                type="email"
                value={form.email}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "err-email" : undefined}
                onChange={(e) => setField("email", e.target.value)}
                className={inputClass}
              />
              {errors.email ? (
                <p id="err-email" role="alert" className={errorClass}>
                  {errors.email}
                </p>
              ) : null}
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
                aria-invalid={!!errors.peopleOnBoard}
                aria-describedby={errors.peopleOnBoard ? "err-peopleOnBoard" : undefined}
                onChange={(e) => setField("peopleOnBoard", e.target.value)}
                className={inputClass}
              />
              {errors.peopleOnBoard ? (
                <p id="err-peopleOnBoard" role="alert" className={errorClass}>
                  {errors.peopleOnBoard}
                </p>
              ) : null}
            </label>
          </div>
        </fieldset>

        {/* 4. Assistance */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
            Services &amp; assistance
          </legend>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="checkbox"
                checked={form.helpMooring}
                onChange={(e) => setField("helpMooring", e.target.checked)}
              />
              Help mooring on arrival
            </label>
            <label className="flex items-center gap-2 text-sm text-ink/75">
              <input
                type="checkbox"
                checked={form.helpSlipping}
                onChange={(e) => setField("helpSlipping", e.target.checked)}
              />
              Help slipping lines on departure
            </label>
          </div>
          <p className="mt-4 text-xs text-ink/70">
            Extras chosen in Price estimate &amp; extras:{" "}
            {[
              form.shorePower
                ? `shore power${form.amperage ? ` (${form.amperage}A)` : ""}`
                : "",
              form.water ? "water" : "",
              form.pumpOut ? "pump-out" : "",
              form.fuel ? "fuel" : "",
              form.laundry ? "laundry" : "",
            ]
              .filter(Boolean)
              .join(", ") || "none"}
            .
          </p>
        </fieldset>

        {/* 5. Vessel status */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
            Vessel status
          </legend>
          <p className="mt-4 text-sm text-ink/75">
            Is your vessel EU-flagged AND is all crew EU/Schengen, arriving
            from another EU port?
            <RequiredMark />
          </p>
          <div className="mt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setField("euStatus", "yes")}
              className={`min-h-11 px-6 text-sm font-medium ${
                form.euStatus === "yes"
                  ? "bg-ink text-white"
                  : "border border-hairline text-ink/75 hover:border-ink/40"
              }`}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setField("euStatus", "no")}
              className={`min-h-11 px-6 text-sm font-medium ${
                form.euStatus === "no"
                  ? "bg-ink text-white"
                  : "border border-hairline text-ink/75 hover:border-ink/40"
              }`}
            >
              No
            </button>
          </div>
          {errors.euStatus ? (
                <p id="err-euStatus" role="alert" className={errorClass}>
                  {errors.euStatus}
                </p>
              ) : null}

          {form.euStatus === "yes" ? (
            <div className="mt-4 space-y-1 text-sm text-ink/70">
              {marina.vesselStatusNotes.euReminders.map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          ) : null}

          {form.euStatus === "no" ? (
            <div className="mt-6 border-t border-hairline pt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className={labelClass}>
                    Last port
                    <RequiredMark />
                  </span>
                  <input
                    type="text"
                    value={form.lastPort}
                    aria-invalid={!!errors.lastPort}
                    aria-describedby={errors.lastPort ? "err-lastPort" : undefined}
                    onChange={(e) => setField("lastPort", e.target.value)}
                    className={inputClass}
                  />
                  {errors.lastPort ? (
                <p id="err-lastPort" role="alert" className={errorClass}>
                  {errors.lastPort}
                </p>
              ) : null}
                </label>

                <label className="block text-sm">
                  <span className={labelClass}>
                    Next port
                    <RequiredMark />
                  </span>
                  <input
                    type="text"
                    value={form.nextPort}
                    aria-invalid={!!errors.nextPort}
                    aria-describedby={errors.nextPort ? "err-nextPort" : undefined}
                    onChange={(e) => setField("nextPort", e.target.value)}
                    className={inputClass}
                  />
                  {errors.nextPort ? (
                <p id="err-nextPort" role="alert" className={errorClass}>
                  {errors.nextPort}
                </p>
              ) : null}
                </label>
              </div>

              <div className="mt-6">
                <p className={labelClass}>
                  Crew list
                  <RequiredMark />
                </p>
                <p className="mt-2 text-xs text-ink/70">
                  Required: name, nationality and role. Date of birth,
                  passport number and join date are optional. Passport
                  numbers and other private details can be given to the
                  marina staff in person instead.
                </p>
                <div className="mt-3 space-y-4">
                  {form.crew.map((member, index) => (
                    <div
                      key={index}
                      className="grid gap-3 border border-hairline p-4 sm:grid-cols-2 lg:grid-cols-6"
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
                          className="px-2 text-xs font-medium text-ink/70 hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Remove crew member"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {errors.crew ? (
                <p id="err-crew" role="alert" className={errorClass}>
                  {errors.crew}
                </p>
              ) : null}
                <button
                  type="button"
                  onClick={addCrewRow}
                  className="mt-3 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-2"
                >
                  + Add crew member
                </button>
              </div>

              <div className="mt-6 space-y-1 text-xs text-ink/70">
                {marina.vesselStatusNotes.internationalNotes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            </div>
          ) : null}
        </fieldset>

        {/* 6. Document wallet */}
        <fieldset>
          <legend className="type-heading text-xl text-ink">
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
            heading="Boats & documents: save this boat or switch to another"
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

        {planErrorLabels.length > 0 ? (
          <p role="alert" tabIndex={-1} className="text-sm text-error">
            Please complete {planErrorLabels.join(" and ")} in{" "}
            <a href="#plan-your-stay" className="underline underline-offset-4">
              Plan your stay
            </a>
            .
          </p>
        ) : null}
        {errors.amperage ? (
          <p role="alert" className="text-sm text-error">
            Choose a shore power amperage in{" "}
            <a href="#price-estimate" className="underline underline-offset-4">
              Price estimate &amp; extras
            </a>
            .
          </p>
        ) : null}

        <div>
          <p className="text-sm font-medium text-ink/80">
            Cancellation policy
          </p>
          <p className="mt-2 text-sm text-ink/75">
            {marina.cancellationPolicy ??
              "Cancellation terms are confirmed by the marina. Ask when they reply to your enquiry."}
          </p>
          <p className="mt-4 text-sm text-ink/75">
            This sends an enquiry; the marina confirms availability by email.
          </p>
          <p className="mt-2 text-sm text-ink/70">
            Your details go only to the marina, by email.{" "}
            <a href="#privacy" className="underline underline-offset-4">
              Read the privacy note
            </a>
            .
          </p>
          <button
            type="submit"
            className="mt-6 bg-brass px-8 py-3 text-base font-medium text-ink transition-[filter] hover:brightness-105"
          >
            Send enquiry
          </button>
        </div>
      </form>

      {summary ? (
        <div className="mt-10 border-t border-hairline pt-8">
          <h3 className="text-sm font-medium tracking-tight text-ink">
            Enquiry summary
          </h3>
          <p className="mt-2 text-xs text-ink/70">
            Your email app should have opened with this pre-filled. If it
            didn&apos;t, copy the text below and send it manually.
          </p>
          <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap border border-hairline bg-paper-deep p-4 text-xs text-ink/75">
            {summary}
          </pre>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-4 bg-ink-2 px-6 py-3 text-sm font-medium text-white hover:bg-ink"
          >
            {copied ? "Copied!" : "Copy to clipboard"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
