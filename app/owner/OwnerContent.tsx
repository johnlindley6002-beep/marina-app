"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { siteConfig } from "../../data/site";
import { getOwnedBerths } from "../../lib/mockData";
import { formatLength } from "../../lib/units";
import { useAuth } from "../components/AuthProvider";
import RoleGate from "../components/RoleGate";
import { useUnits } from "../components/UnitsProvider";

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? iso : dateFormat.format(parsed);
}

function OwnerBody() {
  const { user, mode, setMode } = useAuth();
  const { units } = useUnits();
  const berths = useMemo(() => getOwnedBerths(user?.id ?? null), [user?.id]);

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
        <p className="measure mt-4 text-lg text-ink/75">
          The berth you hold and the boat the marina has on file for it.
        </p>
        {siteConfig.mockMode ? (
          <p className="mt-2 text-sm text-ink/70">{siteConfig.accounts.mockNote}</p>
        ) : null}

        <ul className="mt-12">
          {berths.map((berth) => {
            const boat = berth.boatOnFile;
            return (
              <li key={berth.linkId} className="hairline-top py-8 first:border-t-0 first:pt-0">
                <h2 className="type-heading type-h2 text-ink">
                  Berth {berth.berthId}
                </h2>
                <p className="mt-1 text-ink/75">
                  <Link
                    href={`/marinas/${berth.countrySlug}/${berth.marinaId}`}
                    className="underline underline-offset-4"
                  >
                    {berth.marinaName}
                  </Link>
                </p>

                <dl className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-ink/70">Pontoon</dt>
                    <dd className="mt-1 font-medium text-ink">{berth.pontoon}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink/70">Berth class</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {berth.sizeClass ? `Class ${berth.sizeClass}` : "Not listed"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-ink/70">Linked by the marina</dt>
                    <dd className="mt-1 font-medium text-ink">
                      {formatDate(berth.linkedAt)}
                    </dd>
                  </div>
                </dl>

                <h3 className="type-heading type-h3 mt-10 text-ink">
                  Boat on file
                </h3>
                <p className="mt-1 text-lg font-medium text-ink">{boat.name}</p>
                <p className="tabular mt-1 text-ink/75">
                  {formatLength(Number(boat.loa), units)} long,{" "}
                  {formatLength(Number(boat.beam), units)} beam,{" "}
                  {formatLength(Number(boat.draft), units)} draft
                </p>
                <p className="mt-1 text-sm text-ink/70">
                  {[
                    boat.type.charAt(0).toUpperCase() + boat.type.slice(1),
                    boat.flag,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </li>
            );
          })}
        </ul>

        <section
          className="hairline-top mt-4 pt-8"
          aria-labelledby="away-heading"
        >
          <h2 id="away-heading" className="type-heading type-h2 text-ink">
            Away dates and reletting
          </h2>
          <p className="measure mt-2 text-ink/75">
            {siteConfig.accounts.awayDatesPlaceholder}
          </p>
        </section>
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
