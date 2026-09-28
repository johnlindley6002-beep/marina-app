"use client";

import Link from "next/link";
import { marinas } from "../../data/marinas";
import {
  getAllPreArrivalCheckIns,
  getAllPreArrivalDrafts,
  type PreArrivalCheckIn,
} from "../../lib/mockData";
import { todayIso } from "../../lib/formatDate";
import { getReadiness, type ReadinessItem } from "../../lib/prearrival/readiness";
import type { PreArrivalDraft } from "../../lib/prearrival/schema";
import { useMock } from "../../lib/useMock";
import DocumentButtons from "../components/DocumentButtons";
import { useLanguage } from "../components/LanguageProvider";

type Stay = {
  key: string;
  marinaId: string;
  draft: PreArrivalDraft;
  arrivalDate: string;
  kind: "draft" | "submitted";
  checkIn: PreArrivalCheckIn | null;
};

const DAY_MS = 86_400_000;

function daysUntil(dateIso: string): number | null {
  if (!dateIso) return null;
  const target = new Date(dateIso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.round((target - Date.now()) / DAY_MS);
}

// A stay from today or the future is "upcoming"; one with no date yet (a
// fresh, mostly-empty draft) is still shown, since it is still in progress.
function isUpcoming(arrivalDate: string): boolean {
  return !arrivalDate || arrivalDate >= todayIso();
}

function Ring({ complete, total }: { complete: number; total: number }) {
  const size = 44;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fraction = total > 0 ? complete / total : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#B9C2C0" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#0A1A2F"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - fraction)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

function StayCard({ stay }: { stay: Stay }) {
  const { t } = useLanguage();
  const copy = t.preArrival.upcoming;
  const marina = marinas.find((m) => m.id === stay.marinaId);
  const readiness = getReadiness(stay.draft);
  const items: (ReadinessItem & { href: string })[] = readiness.items.map((item) => ({
    ...item,
    href: marina
      ? `/marinas/${marina.countrySlug}/${marina.id}/pre-arrival?step=${item.step}${
          item.personIndex !== undefined ? `&person=${item.personIndex}` : ""
        }`
      : "#",
  }));

  if (marina) {
    for (const [i, person] of stay.draft.people.entries()) {
      const days = daysUntil(person.idExpiryDate);
      if (days !== null && days >= 0 && days <= 30) {
        items.push({
          message: copy.idExpiring(person.givenNames || `#${i + 1}`, days),
          step: 3,
          personIndex: i,
          href: `/marinas/${marina.countrySlug}/${marina.id}/pre-arrival?step=3&person=${i}`,
        });
      }
    }
    const insDays = daysUntil(stay.draft.documents.thirdPartyInsurance.expiryDate);
    if (insDays !== null && insDays >= 0 && insDays <= 30) {
      items.push({
        message: copy.insuranceExpiring(insDays),
        step: 4,
        href: `/marinas/${marina.countrySlug}/${marina.id}/pre-arrival?step=4`,
      });
    }
  }

  if (!marina) return null;

  return (
    <li className="hairline-top py-6 first:border-t-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Ring complete={readiness.complete} total={readiness.total} />
          <div>
            <p className="font-medium text-ink">
              {stay.draft.boatIdentity.name || copy.newBoat} · {marina.name}
            </p>
            <p className="tabular text-sm text-ink/70">
              {stay.arrivalDate || copy.datesNotSet}
              {stay.kind === "submitted" && stay.checkIn
                ? `, ${copy.referenceLabel(stay.checkIn.referenceCode)}`
                : `, ${copy.draftLabel}`}
            </p>
          </div>
        </div>
        <Link
          href={`/marinas/${marina.countrySlug}/${marina.id}/pre-arrival`}
          className="btn-quiet text-sm"
        >
          {stay.kind === "submitted" ? copy.reviewBtn : copy.continueBtn}
        </Link>
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {items.map((item, i) => (
            <li key={i}>
              <Link
                href={item.href}
                className="inline-flex min-h-8 items-center text-sm text-ink/80 underline underline-offset-4"
              >
                {item.message}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70">{copy.nothingOutstanding}</p>
      )}

      {stay.kind === "submitted" && stay.checkIn ? (
        <DocumentButtons checkIn={stay.checkIn} marina={marina} className="mt-4" />
      ) : null}
    </li>
  );
}

export default function UpcomingStays() {
  const { t } = useLanguage();
  const { value: stays, ready } = useMock<Stay[]>(
    () => {
      const drafts = getAllPreArrivalDrafts().map(({ marinaId, draft }) => ({
        key: `draft-${marinaId}`,
        marinaId,
        draft,
        arrivalDate: draft.stay.requestedArrival || draft.voyage.arrivalDateTime.slice(0, 10),
        kind: "draft" as const,
        checkIn: null,
      }));
      const checkIns = getAllPreArrivalCheckIns()
        .filter((c) => !c.checkedInAt)
        .map((c) => ({
          key: `checkin-${c.id}`,
          marinaId: c.marinaId,
          draft: c.draft,
          arrivalDate: c.draft.stay.requestedArrival,
          kind: "submitted" as const,
          checkIn: c,
        }));
      return [...drafts, ...checkIns].filter((s) => isUpcoming(s.arrivalDate));
    },
    [],
    ""
  );

  if (!ready || stays.length === 0) return null;

  return (
    <section className="chapter" aria-labelledby="upcoming-stays-heading">
      <h2 id="upcoming-stays-heading" className="type-heading type-h2 text-ink">
        {t.preArrival.upcoming.heading}
      </h2>
      <ul className="mt-2">
        {stays.map((stay) => (
          <StayCard key={stay.key} stay={stay} />
        ))}
      </ul>
    </section>
  );
}
