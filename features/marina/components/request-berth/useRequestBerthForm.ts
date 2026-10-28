import { countNights } from "@/lib/dates";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { calculateQuote, type Marina } from "@/data/marinas";
import {
  EMPTY_DOCUMENTS,
  loadBoatProfile,
  type BoatDocuments,
} from "@/features/my-boat/lib/boatProfile";
import { useBoats } from "@/components/providers/BoatProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { useUnits } from "@/components/providers/UnitsProvider";
import { loadLastEnquiry, saveLastEnquiry } from "@/features/marina/lib/tripStore";
import { ACCOUNT_DATA_SOURCE, requestArrival, submitEnquiry, upsertBoat } from "@/lib/data";
import { useAuth } from "@/components/providers/AuthProvider";
import { guestError } from "@/features/account/lib/errors";
import { effectiveDeparture, PLAN_KEYS, type StayPlan } from "@/features/marina/lib/stayPlan";
import {
  type FormData,
  type CrewMember,
  emptyCrewMember,
} from "@/features/marina/lib/enquiry/types";
import { toEnquiryInput, toLastEnquiry } from "@/features/marina/lib/enquiry/payload";
import { validate, type Errors } from "@/features/marina/lib/enquiry/validate";
import { buildSummary } from "@/features/marina/lib/enquiry/summary";

export type RequestBerthProps = {
  marina: Marina;
  plan: StayPlan;
  onPlanChange: (patch: Partial<StayPlan>) => void;
  selectedBerthId?: string | null;
  rebookToken?: number;
};

export function useRequestBerthForm({
  marina,
  plan,
  onPlanChange,
  selectedBerthId,
  rebookToken = 0,
}: RequestBerthProps) {
  const { units } = useUnits();
  const { locale, t } = useLanguage();
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
    vesselUse: "private",
    operatingEntity: "",
    companyRegistration: "",
    contractName: "",
    contractRole: "",
    insuranceConfirmed: false,
    professionalCrewCount: "",
    guestCount: "",
  });

  // Dates, dimensions, ETA/ETD and priced extras live in the shared plan;
  // everything else is local to this form.
  const form: FormData = useMemo(() => ({ ...localForm, ...plan }), [localForm, plan]);
  // setForm reads the latest form from this ref. It is synced in an effect that
  // is declared before every other effect, so it is current whenever they run.
  const formRef = useRef(form);
  useEffect(() => {
    formRef.current = form;
  });

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
  }, [selectedBerthId, setForm]);

  // Pre-fill from the active boat: into empty fields on first load, and over
  // the boat details when the visitor switches boats (here or in My boat).
  const {
    ready: boatsReady,
    activeBoat,
    skipper: savedSkipper,
    saveBoat,
    saveSkipper,
  } = useBoats();
  const { user } = useAuth();
  // With accounts on, a request goes to the marina through the person's account.
  const accountMode = ACCOUNT_DATA_SOURCE === "supabase";
  const [sendState, setSendState] = useState<"idle" | "sending" | "sent">("idle");
  const [sendError, setSendError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [mailtoHref, setMailtoHref] = useState("");
  const appliedBoatId = useRef<string | null | undefined>(undefined);
  const skipperApplied = useRef(false);
  const [rememberSkipper, setRememberSkipper] = useState(false);

  useEffect(() => {
    if (!boatsReady) return;
    const id = activeBoat?.id ?? null;
    const first = appliedBoatId.current === undefined;
    if (!first && appliedBoatId.current === id) return;
    appliedBoatId.current = id;

    if (activeBoat) {
      setDocs(activeBoat.documents ?? { ...EMPTY_DOCUMENTS });
      const vesselType =
        (["sail", "motor", "catamaran", "other"] as const).find((v) => v === activeBoat.type) ?? "";
      setForm((f) =>
        first
          ? {
              ...f,
              boatName: f.boatName || activeBoat.name,
              vesselType: f.vesselType || vesselType,
              loa: f.loa || activeBoat.loa,
              beam: f.beam || activeBoat.beam,
              draft: f.draft || activeBoat.draft,
              flagCountry: f.flagCountry || activeBoat.flag,
              homePort: f.homePort || activeBoat.homePort,
            }
          : {
              ...f,
              boatName: activeBoat.name,
              vesselType,
              loa: activeBoat.loa,
              beam: activeBoat.beam,
              draft: activeBoat.draft,
              flagCountry: activeBoat.flag,
              homePort: activeBoat.homePort,
            }
      );
    } else if (first) {
      const profile = loadBoatProfile();
      setForm((f) => ({
        ...f,
        loa: f.loa || profile.loa,
        beam: f.beam || profile.beam,
        draft: f.draft || profile.draft,
      }));
    }
  }, [boatsReady, activeBoat, setForm]);

  // The skipper's saved contact details fill empty fields once.
  useEffect(() => {
    if (!boatsReady || skipperApplied.current) return;
    skipperApplied.current = true;
    if (savedSkipper.name || savedSkipper.phone || savedSkipper.email) {
      setRememberSkipper(true);
      setForm((f) => ({
        ...f,
        skipperName: f.skipperName || savedSkipper.name,
        phone: f.phone || savedSkipper.phone,
        email: f.email || savedSkipper.email,
      }));
    }
  }, [boatsReady, savedSkipper, setForm]);

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
          (["sail", "motor", "catamaran", "other"] as const).find((v) => v === last.vesselType) ??
          "",
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
  }, [rebookToken, marina.id, setForm]);

  useEffect(() => {
    if (submitted) setErrors(validate(form, t.enquiry.errors));
  }, [form, submitted, t]);

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
    const diff = countNights(form.arrival, form.departure);
    return diff > 0 ? diff : null;
  }, [form.arrival, form.departure, form.openEnded]);

  const quote = useMemo(() => {
    const loaNum = Number(form.loa);
    if (!form.arrival || !(loaNum > 0)) return null;
    const departure = effectiveDeparture(plan);
    return calculateQuote(
      marina,
      {
        loa: loaNum,
        beam: Number(form.beam),
        multihull: form.vesselType === "catamaran",
        arrival: form.arrival,
        departure,
      },
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
    form.beam,
    form.vesselType,
    form.arrival,
    form.shorePower,
    form.water,
    form.pumpOut,
    form.fuel,
    form.laundry,
  ]);

  const listedCrew = form.crew.filter((c) => c.fullName.trim() && c.personType === "crew").length;
  const listedGuests = form.crew.filter(
    (c) => c.fullName.trim() && c.personType === "guest"
  ).length;

  const planErrorLabels: string[] = [];
  if (errors.arrival || errors.departure) planErrorLabels.push(t.enquiry.planLabels.dates);
  if (errors.loa || errors.beam || errors.draft) planErrorLabels.push(t.enquiry.planLabels.size);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const validationErrors = validate(form, t.enquiry.errors);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitTick((n) => n + 1);
      return;
    }

    if (accountMode && !user) {
      setNeedsSignIn(true);
      return;
    }
    setNeedsSignIn(false);

    const text = buildSummary(form, marina, nights, quote, includeDocs ? docs : null, locale);
    if (rememberSkipper) {
      saveSkipper({
        name: form.skipperName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
      });
    }
    saveLastEnquiry(toLastEnquiry(form, marina));
    const mailto = `mailto:${marina.email}?subject=${encodeURIComponent(
      "Berth enquiry - Marina de Cascais"
    )}&body=${encodeURIComponent(text)}`;

    if (accountMode) {
      // The request is linked to the person and to the boat they chose, so the
      // boat is saved to the account first if it is not there yet.
      setSendState("sending");
      setSendError("");
      const boat =
        activeBoat ??
        saveBoat({
          name: form.boatName.trim(),
          type: form.vesselType,
          loa: form.loa,
          beam: form.beam,
          draft: form.draft,
          flag: form.flagCountry,
          homePort: form.homePort,
          documents: includeDocs ? docs : undefined,
        });
      const boatSaved = await upsertBoat(boat);
      const result = boatSaved
        ? await requestArrival(
            marina.id,
            boat.id,
            toEnquiryInput(form, marina, includeDocs ? docs : null)
          )
        : ({ ok: false, error: "boat_not_found" } as const);
      if (!result.ok) {
        setSendState("idle");
        setSendError(guestError(t.accounts, result.error));
        return;
      }
      setSendState("sent");
      setSummary(text);
      setCopied(false);
      setMailtoHref(mailto);
      return;
    }

    // In addition to the mailto below (which is still the record of the
    // enquiry), submit it to the mock layer so staff can act on it in real
    // time instead of only replying by email later.
    submitEnquiry(toEnquiryInput(form, marina, includeDocs ? docs : null));

    setSummary(text);
    setCopied(false);

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

  return {
    accountMode,
    activeBoat,
    addCrewRow,
    appliedBoatId,
    boatsReady,
    copied,
    docs,
    errors,
    form,
    formElRef,
    formRef,
    handleCopy,
    handleSubmit,
    includeDocs,
    listedCrew,
    listedGuests,
    localForm,
    mailtoHref,
    marina,
    needsSignIn,
    nights,
    onPlanChange,
    plan,
    planErrorLabels,
    quote,
    rebookToken,
    rememberSkipper,
    removeCrewRow,
    saveSkipper,
    savedSkipper,
    selectedBerthId,
    sendError,
    sendState,
    setDocs,
    setField,
    setForm,
    setIncludeDocs,
    setRememberSkipper,
    skipperApplied,
    submitTick,
    submitted,
    summary,
    units,
    updateCrew,
  };
}

export type RequestBerthCtx = ReturnType<typeof useRequestBerthForm>;
