"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { marinas } from "../../data/marinas";
import { siteConfig } from "../../data/site";
import { formatLongDate } from "../../lib/formatDate";
import {
  getNotifications,
  getOwnedBerths,
  getRelettingDraft,
  getRelettingRequests,
  type MockNotification,
  type RelettingDraft,
  type RelettingRequest,
} from "../../lib/mockData";
import { useMock } from "../../lib/useMock";
import { formatLength } from "../../lib/units";
import { useAuth } from "../components/AuthProvider";
import PageHeader from "../components/PageHeader";
import RoleGate from "../components/RoleGate";
import { useUnits } from "../components/UnitsProvider";
import OwnerCalendar from "./OwnerCalendar";
import OwnerUpdates from "./OwnerUpdates";
import RelettingLedger from "./RelettingLedger";

const copy = siteConfig.relet;
const NO_REQUESTS: RelettingRequest[] = [];
const NO_NOTES: MockNotification[] = [];

function OwnerBody() {
  const { user, mode, setMode } = useAuth();
  const { units } = useUnits();
  const userId = user?.id ?? null;
  const berths = useMemo(() => getOwnedBerths(userId), [userId]);
  const termsHref =
    marinas.find((m) => m.id === berths[0]?.marinaId)?.reletting?.termsHref ??
    "/legal/reletting-terms";

  const { value: requests, ready } = useMock(
    () => getRelettingRequests(userId),
    NO_REQUESTS,
    userId ?? ""
  );
  const { value: notes } = useMock(
    () => getNotifications(userId),
    NO_NOTES,
    userId ?? ""
  );
  const { value: draft } = useMock<RelettingDraft | null>(
    () => getRelettingDraft(userId),
    null,
    userId ?? ""
  );
  const firstTime = ready && requests.length === 0;

  // Opening My berth puts an owner into Owner mode, so the navigation matches.
  // It runs once per visit, so choosing Guest afterwards is not undone.
  const enteredOwnerMode = useRef(false);
  useEffect(() => {
    if (enteredOwnerMode.current || !user) return;
    enteredOwnerMode.current = true;
    if (mode !== "owner") setMode("owner");
  }, [user, mode, setMode]);

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title="My berth" mock />

        {berths.map((berth) => {
          const boat = berth.boatOnFile;
          return (
            <section
              key={berth.linkId}
              className="stack-md"
              aria-label={`Berth ${berth.berthId}`}
            >
              <h2 className="type-heading type-h2 text-ink">
                Berth {berth.berthId}
              </h2>
              <p className="mt-1 flex flex-wrap items-center text-ink/75">
                <Link
                  href={`/marinas/${berth.countrySlug}/${berth.marinaId}`}
                  className="link inline-flex min-h-11 items-center"
                >
                  {berth.marinaName}
                </Link>
                <span>
                  {berth.sizeClass ? `, Class ${berth.sizeClass}` : ""}
                  {`, linked ${formatLongDate(berth.linkedAt)}`}
                </span>
              </p>
              <p className="tabular mt-4 text-ink">
                <span className="font-medium">{boat.name}</span>
                <span className="text-ink/75">
                  {" "}
                  on file: {formatLength(Number(boat.loa), units)} long,{" "}
                  {formatLength(Number(boat.beam), units)} beam,{" "}
                  {formatLength(Number(boat.draft), units)} draft
                </span>
              </p>
              <p className="measure mt-4 text-ink/75">{copy.useRight}</p>

              {firstTime ? (
                <div className="stack-sm">
                  <h3 className="type-heading type-h3 text-ink">
                    {copy.firstTimeTitle}
                  </h3>
                  <p className="measure mt-2 text-ink/75">{copy.firstTimeBody}</p>
                </div>
              ) : null}

              <div className="stack-md flex flex-wrap items-center gap-x-6 gap-y-2">
                <Link href="/owner/relet" className="btn-primary">
                  {draft && draft.mode === "new" && draft.step > 1
                    ? "Continue your offer"
                    : copy.primaryAction}
                </Link>
                {draft && draft.mode === "new" && draft.step > 1 ? (
                  <span className="text-sm text-ink/70">
                    Step {draft.step} of {copy.steps.length}, saved
                  </span>
                ) : null}
                {draft && draft.mode !== "new" ? (
                  <Link href="/owner/relet" className="btn-quiet">
                    Continue changing your request
                  </Link>
                ) : null}
              </div>
            </section>
          );
        })}

        <section className="chapter" aria-labelledby="calendar-heading">
          <h2 id="calendar-heading" className="type-heading type-h2 text-ink">
            Your calendar
          </h2>
          <div className="stack-sm">
            <OwnerCalendar />
          </div>
        </section>

        {!firstTime ? (
          <section className="chapter" aria-labelledby="absences-heading">
            <h2 id="absences-heading" className="type-heading type-h2 text-ink">
              Your absences
            </h2>
            <RelettingLedger />
          </section>
        ) : null}

        {!firstTime || notes.length > 0 ? (
          <section className="chapter" aria-labelledby="updates-heading">
            <h2 id="updates-heading" className="type-heading type-h2 text-ink">
              Updates
            </h2>
            <OwnerUpdates />
          </section>
        ) : null}

        <footer className="chapter">
          <p className="measure text-sm text-ink/70">{copy.legalFooter}</p>
          <Link
            href={termsHref}
            className="link mt-2 inline-flex min-h-11 items-center text-sm text-ink"
          >
            Read the full terms
          </Link>
        </footer>
      </div>
    </div>
  );
}

export default function OwnerContent() {
  return (
    <RoleGate role="owner">
      <OwnerBody />
    </RoleGate>
  );
}
