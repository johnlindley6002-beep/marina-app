"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { marinas } from "../../data/marinas";
import { siteConfig } from "../../data/site";
import { formatLongDate } from "../../lib/formatDate";
import { getOwnedBerths } from "../../lib/mockData";
import { formatLength } from "../../lib/units";
import { useAuth } from "../components/AuthProvider";
import ChartDivider from "../components/ChartDivider";
import RoleGate from "../components/RoleGate";
import { useUnits } from "../components/UnitsProvider";
import OwnerUpdates from "./OwnerUpdates";
import RelettingLedger from "./RelettingLedger";

const copy = siteConfig.relet;

function OwnerBody() {
  const { user, mode, setMode } = useAuth();
  const { units } = useUnits();
  const berths = useMemo(() => getOwnedBerths(user?.id ?? null), [user?.id]);
  const termsHref =
    marinas.find((m) => m.id === berths[0]?.marinaId)?.reletting?.termsHref ??
    "/legal/reletting-terms";

  // Opening My berth puts an owner into Owner mode, so the navigation matches.
  // It runs once per visit, so choosing Guest afterwards is not undone.
  const enteredOwnerMode = useRef(false);
  useEffect(() => {
    if (enteredOwnerMode.current || !user) return;
    enteredOwnerMode.current = true;
    if (mode !== "owner") setMode("owner");
  }, [user, mode, setMode]);

  return (
    <div className="section px-5 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="type-display [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
          My berth
        </h1>
        {siteConfig.mockMode ? (
          <p className="mt-3 text-sm text-ink/70">{siteConfig.accounts.mockNote}</p>
        ) : null}

        {berths.map((berth) => {
          const boat = berth.boatOnFile;
          return (
            <section
              key={berth.linkId}
              className="mt-12"
              aria-label={`Berth ${berth.berthId}`}
            >
              <h2 className="type-heading type-h2 text-ink">
                Berth {berth.berthId}
              </h2>
              <p className="mt-1 flex flex-wrap items-center text-ink/75">
                <Link
                  href={`/marinas/${berth.countrySlug}/${berth.marinaId}`}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
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
              <Link
                href="/owner/relet"
                className="mt-8 inline-flex min-h-12 items-center rounded-[3px] bg-brass px-8 text-base font-medium text-ink transition-[filter] hover:brightness-105"
              >
                {copy.primaryAction}
              </Link>
            </section>
          );
        })}

        <section className="mt-24" aria-labelledby="absences-heading">
          <ChartDivider className="mb-10" />
          <h2 id="absences-heading" className="type-heading type-h2 text-ink">
            Your absences
          </h2>
          <RelettingLedger />
        </section>

        <section className="mt-24" aria-labelledby="updates-heading">
          <ChartDivider className="mb-10" />
          <h2 id="updates-heading" className="type-heading type-h2 text-ink">
            Updates
          </h2>
          <OwnerUpdates />
        </section>

        <footer className="mt-24">
          <ChartDivider className="mb-8" />
          <p className="measure text-sm text-ink/70">{copy.legalFooter}</p>
          <Link
            href={termsHref}
            className="mt-2 inline-flex min-h-11 items-center text-sm text-ink underline underline-offset-4"
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
