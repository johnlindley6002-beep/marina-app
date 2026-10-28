"use client";

import { useState } from "react";
import { todayIso } from "@/lib/dates";
import {
  confirmWithBerth,
  declineWithReason,
  getSuggestedBerths,
  proposeOtherDates,
  useStaffData,
  type BerthSuggestion,
  type Enquiry,
  type RequestOutcome,
} from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useUnits } from "@/components/providers/UnitsProvider";
import { staffError } from "../lib/errors";
import { useStaffAction } from "../lib/useStaffAction";
import { useStaffText } from "./StaffLanguageProvider";

const NONE: BerthSuggestion[] = [];

// What staff do with a request: confirm it into a suggested berth in one
// click, decline it with a reason the guest sees, or propose other dates. The
// suggestions are berths that fit the boat and are free for every night of the
// stay, worked out by the database (suggest_berths), not by the screen.
export default function RequestActions({
  enquiry,
  staffId,
}: {
  enquiry: Enquiry;
  staffId: string | null;
}) {
  const { s } = useStaffText();
  const { units } = useUnits();
  const r = s.requests;
  const waiting = enquiry.status === "dates_proposed";
  const { value: suggestions, ready } = useStaffData(
    () => (waiting ? Promise.resolve(NONE) : getSuggestedBerths(enquiry.id)),
    NONE,
    `${enquiry.id}|${enquiry.arrival}|${enquiry.departure}|${enquiry.status}`
  );
  const { busy, error, run, setError } = useStaffAction();
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [from, setFrom] = useState(enquiry.arrival);
  const [to, setTo] = useState(enquiry.departure);
  const [proposeNote, setProposeNote] = useState("");
  const id = `request-${enquiry.id}`;

  // The database answers with a key the screen turns into words.
  const translate = (outcome: RequestOutcome) =>
    outcome.ok
      ? outcome
      : { ok: false as const, error: outcome.key ? staffError(s, outcome.key) : outcome.error };

  function decline() {
    if (!reason.trim()) {
      setError(r.declineNeeded);
      return;
    }
    void run(async () => translate(await declineWithReason(staffId, enquiry.id, reason.trim())));
  }

  function propose() {
    if (!from || from < todayIso() || (to && to < from)) {
      setError(r.proposeNeeded);
      return;
    }
    void run(async () =>
      translate(await proposeOtherDates(enquiry.id, from, to, proposeNote.trim()))
    );
  }

  return (
    <div className="mt-4 space-y-5">
      {waiting ? (
        <p className="text-ink-soft">
          {r.waitingGuest(
            enquiry.proposedDeparture
              ? s.common.range(enquiry.proposedArrival, enquiry.proposedDeparture)
              : `${enquiry.proposedArrival}, ${s.common.openEnded}`
          )}
        </p>
      ) : (
        <section aria-labelledby={`${id}-suggested`}>
          <h3 id={`${id}-suggested`} className="staff-label">
            {r.suggestedTitle}
          </h3>
          <p className="text-xs text-ink-muted">{r.suggestedNote}</p>
          {!ready ? (
            <p role="status" className="mt-2 text-ink-muted">
              {r.finding}
            </p>
          ) : suggestions.length === 0 ? (
            <p className="mt-2 text-ink-soft">{r.noSuggestions}</p>
          ) : (
            <>
              <label className="mt-2 block max-w-md text-sm">
                <span className="staff-label">{r.confirmNote}</span>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="staff-field"
                />
              </label>
              <ul className="mt-2 space-y-2">
                {suggestions.map((berth, index) => (
                  <li
                    key={berth.berthKey}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2"
                  >
                    <p className="tabular text-ink">
                      {r.suggestion(
                        berth.code,
                        berth.sizeClass,
                        formatLength(berth.maxLengthM, units)
                      )}
                      {berth.viaRelet ? (
                        <span className="staff-chip ml-2">{r.offeredByHolder}</span>
                      ) : null}
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void run(async () =>
                          translate(
                            await confirmWithBerth(staffId, enquiry.id, berth.berthKey, note.trim())
                          )
                        )
                      }
                      className={`staff-btn ${index === 0 ? "staff-btn-primary" : ""}`}
                    >
                      {busy ? r.confirming : r.confirmWith(berth.code)}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section aria-labelledby={`${id}-decline`}>
          <h3 id={`${id}-decline`} className="staff-label">
            {r.declineTitle}
          </h3>
          <label className="mt-1 block text-sm">
            <span className="sr-only">{r.declineReason}</span>
            <input
              type="text"
              value={reason}
              placeholder={r.declineReason}
              onChange={(e) => setReason(e.target.value)}
              className="staff-field"
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={decline}
            className="staff-btn staff-btn-danger mt-2"
          >
            {busy ? r.declining : r.declineButton}
          </button>
        </section>

        {waiting ? null : (
          <section aria-labelledby={`${id}-propose`}>
            <h3 id={`${id}-propose`} className="staff-label">
              {r.proposeTitle}
            </h3>
            <div className="mt-1 grid gap-2 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="staff-label">{r.proposeFrom}</span>
                <input
                  type="date"
                  value={from}
                  min={todayIso()}
                  onChange={(e) => setFrom(e.target.value)}
                  className="staff-field"
                />
              </label>
              <label className="block text-sm">
                <span className="staff-label">{r.proposeTo}</span>
                <input
                  type="date"
                  value={to}
                  min={from || todayIso()}
                  onChange={(e) => setTo(e.target.value)}
                  className="staff-field"
                />
              </label>
            </div>
            <label className="mt-2 block text-sm">
              <span className="staff-label">{r.proposeNote}</span>
              <input
                type="text"
                value={proposeNote}
                onChange={(e) => setProposeNote(e.target.value)}
                className="staff-field"
              />
            </label>
            <button type="button" disabled={busy} onClick={propose} className="staff-btn mt-2">
              {busy ? r.proposing : r.proposeButton}
            </button>
          </section>
        )}
      </div>

      {error ? (
        <p role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
