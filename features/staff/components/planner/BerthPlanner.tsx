"use client";

import { useMemo, useState, type DragEvent } from "react";
import { getPrimaryMarina } from "@/data/marinas";
import { addDaysIso, effectiveEnquiryDeparture, formatLongDate, todayIso } from "@/lib/dates";
import {
  getBerthStatusesFor,
  getEnquiries,
  getPlannerBerths,
  reassignEnquiryBerth,
  type BerthOperationalInfo,
  type Enquiry,
  type PlannerBerth,
  useStaffData,
} from "@/lib/data";
import { berthFitProblems, type FitProblem } from "../../lib/berthFit";
import { formatWeekday } from "../../lib/format";
import { berthRow, plannerDates, PLANNER_DAYS, type CellKind } from "../../lib/timeline";
import { useStaffAction } from "../../lib/useStaffAction";
import SupabaseOnly from "../SupabaseOnly";
import { useStaffId, useStaffSession } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";

const NO_BERTHS: PlannerBerth[] = [];
const NO_ENQUIRIES: Enquiry[] = [];
const NO_STATUSES: Record<string, Record<string, BerthOperationalInfo>> = {};

const CELL_CLASS: Record<CellKind, string> = {
  stay: "bg-ink text-paper",
  holder: "bg-stone text-ink",
  relet: "bg-brass text-ink",
  free: "bg-surface text-ink",
  oos: "bg-error/25 text-ink",
};

const KINDS: CellKind[] = ["stay", "holder", "relet", "free", "oos"];

type Pending = { enquiry: Enquiry; berth: PlannerBerth; problems: FitProblem[] };

function Planner() {
  const staffId = useStaffId();
  const marinaId = useStaffSession().session?.marinaIds[0] ?? getPrimaryMarina().id;
  const { s, dateLocale } = useStaffText();
  const p = s.planner;
  const [start, setStart] = useState(todayIso());
  const [pontoon, setPontoon] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState("");
  const action = useStaffAction();

  const { value: berths } = useStaffData(getPlannerBerths, NO_BERTHS);
  const { value: enquiries } = useStaffData(
    () => getEnquiries(staffId),
    NO_ENQUIRIES,
    staffId ?? ""
  );
  const dates = useMemo(() => plannerDates(start), [start]);
  const { value: statusPairs } = useStaffData(
    () => getBerthStatusesFor(dates.map((dateIso) => ({ marinaId, dateIso }))),
    NO_STATUSES,
    `${marinaId}|${start}`
  );

  const statusesByDate = useMemo(() => {
    const out: Record<string, Record<string, BerthOperationalInfo>> = {};
    for (const date of dates) out[date] = statusPairs[`${marinaId}|${date}`] ?? {};
    return out;
  }, [dates, statusPairs, marinaId]);

  const pontoons = useMemo(() => [...new Set(berths.map((b) => b.pontoon))], [berths]);
  const shownPontoon = pontoon ?? pontoons[0] ?? "";
  const rows = berths.filter((b) => b.pontoon === shownPontoon);
  const byCode = useMemo(() => new Map(berths.map((b) => [b.code, b])), [berths]);
  const byId = useMemo(() => new Map(enquiries.map((e) => [e.id, e])), [enquiries]);

  const windowEnd = addDaysIso(start, PLANNER_DAYS);
  const arrivals = enquiries
    .filter(
      (e) =>
        e.status === "approved" &&
        e.arrivalStatus !== "departed" &&
        e.arrival < windowEnd &&
        effectiveEnquiryDeparture(e) > start
    )
    .sort((a, b) => a.arrival.localeCompare(b.arrival));

  async function assign(enquiry: Enquiry, berth: PlannerBerth) {
    setPending(null);
    const ok = await action.run(() => reassignEnquiryBerth(staffId, enquiry.id, berth.code));
    setNotice(ok ? p.assigned(enquiry.boatName || s.common.unnamedBoat, berth.code) : "");
  }

  function request(enquiry: Enquiry, code: string) {
    const berth = byCode.get(code);
    if (!berth || enquiry.assignedBerthId === code) return;
    setNotice("");
    action.setError(null);
    const problems = berthFitProblems(
      {
        loa: Number(enquiry.loa) || 0,
        beam: Number(enquiry.beam) || 0,
        draft: Number(enquiry.draft) || 0,
      },
      berth
    );
    if (problems.length > 0) setPending({ enquiry, berth, problems });
    else void assign(enquiry, berth);
  }

  function onDrop(event: DragEvent<HTMLTableRowElement>, code: string) {
    event.preventDefault();
    const enquiry = byId.get(event.dataTransfer.getData("text/plain"));
    if (enquiry) request(enquiry, code);
  }

  const problemText = (problem: FitProblem) =>
    problem.measure === "length"
      ? p.fitLength(problem.boat, problem.berth)
      : problem.measure === "beam"
        ? p.fitBeam(problem.boat, problem.berth)
        : p.fitDraft(problem.boat, problem.berth);

  return (
    <div>
      <h1 className="type-heading type-h2 text-ink">{p.title}</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-muted">{p.intro}</p>

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="staff-label">{p.start}</span>
          <input
            type="date"
            value={start}
            onChange={(e) => e.target.value && setStart(e.target.value)}
            className="staff-field max-w-[11rem]"
          />
        </label>
        <label className="text-sm">
          <span className="staff-label">{p.pontoon}</span>
          <select
            value={shownPontoon}
            onChange={(e) => setPontoon(e.target.value)}
            className="staff-field max-w-[11rem]"
          >
            {pontoons.map((id) => (
              <option key={id} value={id}>
                {p.pontoonName(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="staff-label mb-0">{p.legend}</span>
        {KINDS.map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-5 rounded-sm border border-ink/25 ${CELL_CLASS[kind]}`}
              aria-hidden="true"
            />
            {p.kinds[kind]}
          </span>
        ))}
      </div>

      <section className="staff-panel mt-4" aria-labelledby="planner-arrivals">
        <h2 id="planner-arrivals" className="type-heading type-h3 text-ink">
          {p.arrivalsTitle(arrivals.length)}
        </h2>
        {arrivals.length === 0 ? (
          <p className="staff-empty mt-2">{p.noArrivals}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {arrivals.map((e) => (
              <li
                key={e.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("text/plain", e.id);
                  event.dataTransfer.effectAllowed = "move";
                }}
                className="flex cursor-grab flex-wrap items-end justify-between gap-3 rounded-md border border-hairline bg-surface p-2"
                title={p.dragHint}
              >
                <div className="min-w-0 text-sm">
                  <p className="font-medium text-ink">{e.boatName || s.common.unnamedBoat}</p>
                  <p className="tabular text-xs text-ink-muted">
                    {s.common.range(
                      formatLongDate(e.arrival, dateLocale),
                      e.openEnded ? s.common.openEnded : formatLongDate(e.departure, dateLocale)
                    )}{" "}
                    · {e.loa} m · {e.beam} m · {e.draft} m
                  </p>
                </div>
                <label className="text-sm">
                  <span className="staff-label">{p.moveTo}</span>
                  <select
                    value={e.assignedBerthId ?? ""}
                    disabled={action.busy}
                    onChange={(event) => request(e, event.target.value)}
                    className="staff-field max-w-[12rem]"
                  >
                    <option value="">{p.unassigned}</option>
                    {pontoons.map((id) => (
                      <optgroup key={id} label={p.pontoonName(id)}>
                        {berths
                          .filter((b) => b.pontoon === id)
                          .map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.code} ({s.common.classLabel(b.sizeClass)})
                            </option>
                          ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}

        {pending ? (
          <div role="alert" className="mt-3 rounded-md border border-error/50 bg-paper p-3 text-sm">
            <p className="font-medium text-ink">
              {p.fitTitle(pending.enquiry.boatName || s.common.unnamedBoat, pending.berth.code)}
            </p>
            <ul className="mt-1 text-ink-soft">
              {pending.problems.map((problem) => (
                <li key={problem.measure}>{problemText(problem)}</li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={action.busy}
                onClick={() => void assign(pending.enquiry, pending.berth)}
                className="staff-btn staff-btn-danger"
              >
                {p.assignAnyway}
              </button>
              <button type="button" onClick={() => setPending(null)} className="staff-btn">
                {s.common.cancel}
              </button>
            </div>
          </div>
        ) : null}
        <p role="status" className="mt-2 text-sm text-ink">
          {notice}
        </p>
        {action.error ? (
          <p role="alert" className="field-error mt-1">
            {action.error}
          </p>
        ) : null}
      </section>

      <div
        className="staff-panel mt-4 overflow-x-auto p-0"
        tabIndex={0}
        role="region"
        aria-label={p.tableLabel(shownPontoon)}
      >
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 bg-surface px-2 py-1 text-left">
                {p.berthColumn}
              </th>
              {dates.map((date) => {
                const { weekday, day } = formatWeekday(date, dateLocale);
                return (
                  <th key={date} scope="col" className="min-w-11 px-1 py-1 text-center font-medium">
                    <span className="block text-ink-muted">{weekday}</span>
                    <span className="tabular block text-ink">{day}</span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((berth) => (
              <tr
                key={berth.code}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => onDrop(event, berth.code)}
                className="border-t border-hairline"
              >
                <th
                  scope="row"
                  className="sticky left-0 bg-surface px-2 py-1 text-left font-medium whitespace-nowrap"
                >
                  {berth.code} <span className="font-normal text-ink-muted">{berth.sizeClass}</span>
                </th>
                {berthRow(berth.code, dates, statusesByDate).map((cell) => {
                  const guest = cell.enquiryId ? byId.get(cell.enquiryId) : undefined;
                  const label = guest?.boatName
                    ? `${p.kinds[cell.kind]}, ${guest.boatName}`
                    : p.kinds[cell.kind];
                  return (
                    <td
                      key={cell.date}
                      className={`h-9 max-w-11 overflow-hidden border-l border-hairline px-1 whitespace-nowrap ${CELL_CLASS[cell.kind]}`}
                      title={label}
                    >
                      <span className="sr-only">{label}</span>
                      {cell.starts && guest ? (
                        <span aria-hidden="true">{guest.boatName}</span>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Berths as rows and the next fourteen days as columns: guest stays, berth
// holders, released relet nights and free gaps. An arrival goes on a berth by
// dragging it onto a row or with its berth menu; a boat too big for the berth
// asks first.
export default function BerthPlanner() {
  const { s } = useStaffText();
  return (
    <SupabaseOnly title={s.planner.title}>
      <Planner />
    </SupabaseOnly>
  );
}
