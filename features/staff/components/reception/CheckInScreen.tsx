"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { formatLongDate } from "@/lib/dates";
import {
  getReceptionRecord,
  markEnquiryArrived,
  markEnquiryDeparted,
  saveReceptionDetails,
  setAuthorityFormalities,
  setDocumentsChecked,
  type ReceptionRecord,
  useStaffData,
} from "@/lib/data";
import {
  checklistFor,
  isEuBoat,
  parseMetres,
  validateBoatDetails,
  type BoatDetailsErrors,
} from "../../lib/reception";
import { serviceList } from "../../lib/services";
import { useStaffAction } from "../../lib/useStaffAction";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffId } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";

type Form = {
  boatName: string;
  loa: string;
  beam: string;
  draft: string;
  flagCountry: string;
  skipperName: string;
  phone: string;
  email: string;
  peopleOnBoard: string;
};

function formFrom(record: ReceptionRecord): Form {
  const e = record.enquiry;
  return {
    boatName: e.boatName,
    loa: e.loa,
    beam: e.beam,
    draft: e.draft,
    flagCountry: e.flagCountry,
    skipperName: e.skipperName,
    phone: e.phone,
    email: e.email,
    peopleOnBoard: e.peopleOnBoard,
  };
}

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  inputMode,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputMode?: "decimal" | "tel" | "email" | "numeric";
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div className="text-sm">
      <label htmlFor={id} className="staff-label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className="staff-field"
      />
      {error ? (
        <p id={`${id}-err`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function CheckIn({ id }: { id: string }) {
  const staffId = useStaffId();
  const { s, dateLocale } = useStaffText();
  const r = s.reception;
  const { value: record, ready } = useStaffData(() => getReceptionRecord(id), null, id);
  const [form, setForm] = useState<Form | null>(null);
  const [errors, setErrors] = useState<BoatDetailsErrors>({});
  const [savedNote, setSavedNote] = useState(false);
  const details = useStaffAction();
  const checks = useStaffAction();
  const moves = useStaffAction();

  // Fill the form once, from the first read; later reads keep what staff typed.
  useEffect(() => {
    if (record && form === null) setForm(formFrom(record));
  }, [record, form]);

  if (!ready) return <div className="min-h-[24rem]" aria-hidden="true" />;
  if (!record || !form) {
    return (
      <div>
        <Link href="/staff/reception" className="staff-btn staff-btn-ghost">
          {r.backToList}
        </Link>
        <p className="staff-empty mt-4">{r.notFound}</p>
      </div>
    );
  }

  const e = record.enquiry;
  const eu = isEuBoat(e);
  const list = checklistFor(eu);
  const set = (key: keyof Form) => (value: string) => {
    setSavedNote(false);
    setForm({ ...form, [key]: value });
  };

  async function saveDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const found = validateBoatDetails(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const metres = (v: string) => {
      const n = parseMetres(v);
      return typeof n === "number" ? n : null;
    };
    const ok = await details.save(() =>
      saveReceptionDetails(id, {
        ...form,
        loa: metres(form.loa),
        beam: metres(form.beam),
        draft: metres(form.draft),
      })
    );
    setSavedNote(ok);
  }

  function toggleDocument(key: string, on: boolean) {
    const next = on
      ? [...new Set([...record!.documentsChecked, key])]
      : record!.documentsChecked.filter((k) => k !== key);
    void checks.save(() => setDocumentsChecked(id, next));
  }

  const errorText = (key: keyof BoatDetailsErrors) =>
    errors[key] === "required" ? r.errBoatName : errors[key] === "number" ? r.errNumber : undefined;
  const services = serviceList(e, s);
  const docs = e.documents;

  return (
    <div>
      <Link href="/staff/reception" className="staff-btn staff-btn-ghost">
        {r.backToList}
      </Link>
      <h1 className="type-heading type-h2 mt-3 text-ink">
        {r.checkInTitle(e.boatName || s.common.unnamedBoat)}
      </h1>
      <p className="mt-1 flex flex-wrap gap-2">
        <span className="staff-badge staff-badge-outline">{eu ? s.common.eu : s.common.nonEu}</span>
        <span className="staff-badge staff-badge-ink">
          {e.arrivalStatus === "arrived"
            ? r.onSite
            : e.arrivalStatus === "departed"
              ? r.departed
              : r.arriving}
        </span>
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="staff-panel" aria-labelledby="checkin-details">
          <h2 id="checkin-details" className="type-heading type-h3 text-ink">
            {r.detailsTitle}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">{r.detailsHelp}</p>
          <form onSubmit={saveDetails} noValidate className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <TextField
                id="ci-boat"
                label={r.boatName}
                value={form.boatName}
                onChange={set("boatName")}
                error={errorText("boatName")}
              />
            </div>
            <TextField
              id="ci-loa"
              label={r.lengthM}
              value={form.loa}
              onChange={set("loa")}
              inputMode="decimal"
              error={errorText("loa")}
            />
            <TextField
              id="ci-beam"
              label={r.beamM}
              value={form.beam}
              onChange={set("beam")}
              inputMode="decimal"
              error={errorText("beam")}
            />
            <TextField
              id="ci-draft"
              label={r.draftM}
              value={form.draft}
              onChange={set("draft")}
              inputMode="decimal"
              error={errorText("draft")}
            />
            <TextField
              id="ci-flag"
              label={r.flag}
              value={form.flagCountry}
              onChange={set("flagCountry")}
            />
            <TextField
              id="ci-skipper"
              label={r.skipper}
              value={form.skipperName}
              onChange={set("skipperName")}
              autoComplete="off"
            />
            <TextField
              id="ci-people"
              label={r.people}
              value={form.peopleOnBoard}
              onChange={set("peopleOnBoard")}
              inputMode="numeric"
            />
            <TextField
              id="ci-phone"
              label={r.phone}
              value={form.phone}
              onChange={set("phone")}
              type="tel"
              inputMode="tel"
              autoComplete="off"
            />
            <TextField
              id="ci-email"
              label={r.email}
              value={form.email}
              onChange={set("email")}
              type="email"
              inputMode="email"
              autoComplete="off"
            />
            <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
              <button type="submit" disabled={details.busy} className="staff-btn staff-btn-primary">
                {details.busy ? s.common.saving : r.saveDetails}
              </button>
              <p role="status" className="text-sm text-ink">
                {savedNote ? s.common.saved : ""}
              </p>
            </div>
            {details.error ? (
              <p role="alert" className="field-error sm:col-span-2">
                {details.error}
              </p>
            ) : null}
          </form>
        </section>

        <div className="space-y-4">
          <section className="staff-panel text-sm" aria-labelledby="checkin-stay">
            <h2 id="checkin-stay" className="type-heading type-h3 text-ink">
              {r.stayTitle}
            </h2>
            <p className="mt-2 text-ink">
              {s.common.range(
                formatLongDate(e.arrival, dateLocale),
                e.openEnded || !e.departure
                  ? s.common.openEnded
                  : formatLongDate(e.departure, dateLocale)
              )}
            </p>
            <p className="text-ink-soft">
              {e.assignedBerthId ? r.berth(e.assignedBerthId) : r.noBerth}
            </p>
            {services.length > 0 ? (
              <p className="mt-1 text-ink-soft">
                {s.arrivals.servicesRequested}: {services.join(", ")}
              </p>
            ) : null}
            {e.flagNote ? <p className="mt-1 text-error">{e.flagNote}</p> : null}

            <h3 className="staff-label mt-4">{r.guestGave}</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="text-ink-muted">{r.registrationNumber}</dt>
              <dd className="text-ink">{docs.registrationNumber || s.common.notGiven}</dd>
              <dt className="text-ink-muted">{r.insurance}</dt>
              <dd className="text-ink">
                {[docs.insuranceProvider, docs.insurancePolicy].filter(Boolean).join(" ") ||
                  s.common.notGiven}
              </dd>
              <dt className="text-ink-muted">{r.insuranceExpiry}</dt>
              <dd className="text-ink">
                {docs.insuranceExpiry
                  ? formatLongDate(docs.insuranceExpiry, dateLocale)
                  : s.common.notGiven}
              </dd>
              <dt className="text-ink-muted">{r.competence}</dt>
              <dd className="text-ink">{docs.competenceCertificate || s.common.notGiven}</dd>
              <dt className="text-ink-muted">{r.vhfLicence}</dt>
              <dd className="text-ink">{docs.vhfLicence || s.common.notGiven}</dd>
            </dl>
          </section>

          <section className="staff-panel text-sm" aria-labelledby="checkin-docs">
            <h2 id="checkin-docs" className="type-heading type-h3 text-ink">
              {r.documentsTitle}
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{eu ? r.documentsEu : r.documentsNonEu}</p>
            <ul className="mt-2">
              {list.map((key) => (
                <li key={key}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      checked={record.documentsChecked.includes(key)}
                      disabled={checks.busy}
                      onChange={(event) => toggleDocument(key, event.target.checked)}
                    />
                    <span className="text-ink">{r.checklist[key]}</span>
                  </label>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-hairline pt-3">
              <label className="flex min-h-11 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={record.authorityDone}
                  disabled={checks.busy}
                  aria-describedby="checkin-authority-help"
                  onChange={(event) =>
                    void checks.save(() => setAuthorityFormalities(id, event.target.checked))
                  }
                />
                <span className="font-medium text-ink">{r.authority}</span>
              </label>
              <p id="checkin-authority-help" className="text-xs text-ink-muted">
                {record.authorityDone && record.authorityAt
                  ? r.authorityDone(formatLongDate(record.authorityAt, dateLocale))
                  : r.authorityHelp}
              </p>
            </div>
            {checks.error ? (
              <p role="alert" className="field-error mt-2">
                {checks.error}
              </p>
            ) : null}
          </section>

          <section className="staff-panel text-sm" aria-labelledby="checkin-moves">
            <h2 id="checkin-moves" className="type-heading type-h3 text-ink">
              {r.actions}
            </h2>
            {e.arrivedAt ? (
              <p className="mt-1 text-ink-soft">
                {r.arrivedAt(formatLongDate(e.arrivedAt, dateLocale))}
              </p>
            ) : null}
            {e.departedAt ? (
              <p className="text-ink-soft">
                {r.departedAt(formatLongDate(e.departedAt, dateLocale))}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={moves.busy || e.status !== "approved" || e.arrivalStatus !== "pending"}
                onClick={() => void moves.run(() => markEnquiryArrived(staffId, e.id))}
                className="staff-btn staff-btn-primary"
              >
                {s.arrivals.markArrived}
              </button>
              <button
                type="button"
                disabled={moves.busy || e.arrivalStatus !== "arrived"}
                onClick={() => void moves.run(() => markEnquiryDeparted(staffId, e.id))}
                className="staff-btn"
              >
                {s.arrivals.markDeparted}
              </button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">{r.departNote}</p>
            {moves.error ? (
              <p role="alert" className="field-error mt-2">
                {moves.error}
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

// One boat's check-in at the desk: details from the enquiry to correct, the
// documents seen (more for a non-EU boat), the authority formalities, and
// arrival and departure. Departing frees the berth.
export default function CheckInScreen({ id }: { id: string }) {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.reception.title}>
      <CheckIn id={id} />
    </SupabaseOnly>
  );
}
