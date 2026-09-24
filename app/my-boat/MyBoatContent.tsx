"use client";

import { useRef, useState } from "react";
import { marinas } from "../../data/marinas";
import { siteConfig } from "../../data/site";
import { formatLength } from "../../lib/units";
import { useBoats } from "../components/BoatProvider";
import SavedMarinas from "../components/SavedMarinas";
import UnitSegmented from "../components/UnitSegmented";
import { useUnits } from "../components/UnitsProvider";
import DocumentWallet from "../marinas/[country]/[marina]/DocumentWallet";
import BoatEditor from "./BoatEditor";

const inputClass =
  "mt-2 w-full border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";
const labelClass = "text-sm font-medium text-ink/80";

function formatInsurance(amount: number): string {
  if (amount >= 1_000_000) return `€${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `€${(amount / 1_000).toFixed(0)}K`;
  return `€${amount}`;
}

export default function MyBoatContent() {
  const {
    ready,
    storageOk,
    boats,
    activeBoat,
    setActiveId,
    saveBoat,
    removeBoat,
    skipper,
    saveSkipper,
    clearAll,
  } = useBoats();
  const { units } = useUnits();

  // "new", a boat id being edited, or null when the editor is closed.
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 2500);
  }

  const editingBoat =
    editing && editing !== "new" ? boats.find((b) => b.id === editing) : undefined;
  const insuranceLabel = formatInsurance(marinas[0]?.insuranceMinimumEur ?? 0);

  return (
    <div className="section px-5 md:px-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="type-display [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
          My boat
        </h1>
        <p className="measure mt-4 text-lg text-ink/75">{siteConfig.hub.intro}</p>
        <p className="measure mt-2 text-sm text-ink/70">
          {siteConfig.hub.deviceNote}
        </p>
        {!storageOk ? (
          <p
            role="alert"
            className="measure mt-4 border-l-2 border-error pl-3 text-sm text-error"
          >
            Your browser is blocking storage, so what you enter here is kept only
            until you close this tab.
          </p>
        ) : null}
        <p role="status" className="mt-4 min-h-6 text-sm font-medium text-ink">
          {notice}
        </p>

        <section className="mt-12" aria-labelledby="boats-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="boats-heading" className="type-heading type-h2 text-ink">
              Your boats
            </h2>
            {editing === null && ready ? (
              <button
                type="button"
                onClick={() => setEditing("new")}
                className="inline-flex min-h-11 items-center text-ink underline decoration-brass decoration-2 underline-offset-[6px]"
              >
                Add a boat
              </button>
            ) : null}
          </div>

          {ready && boats.length === 0 && editing === null ? (
            <p className="measure mt-4 text-ink/75">
              No boat saved yet. Add yours and the boat-fit check, Plan your
              stay and Request a berth will fill in automatically.
            </p>
          ) : null}

          {boats.length > 0 ? (
            <ul className="mt-4">
              {boats.map((boat) => {
                const active = activeBoat?.id === boat.id;
                return (
                  <li
                    key={boat.id}
                    className="hairline-top py-5 first:border-t-0"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <h3 className="type-heading type-h3 flex flex-wrap items-center gap-3 text-ink">
                          {boat.name}
                          {active ? (
                            <span className="rounded-full border border-ink/30 px-3 py-0.5 font-sans text-xs font-medium">
                              Active boat
                            </span>
                          ) : null}
                        </h3>
                        <p className="tabular mt-1 text-ink/75">
                          {formatLength(Number(boat.loa), units)} long,{" "}
                          {formatLength(Number(boat.beam), units)} beam,{" "}
                          {formatLength(Number(boat.draft), units)} draft
                        </p>
                        <p className="mt-1 text-sm text-ink/70">
                          {[
                            boat.type &&
                              boat.type.charAt(0).toUpperCase() +
                                boat.type.slice(1),
                            boat.flag,
                            boat.homePort && `Home port ${boat.homePort}`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4">
                        {!active ? (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveId(boat.id);
                              flash(`${boat.name} is now your active boat.`);
                            }}
                            className="inline-flex min-h-11 items-center text-ink underline decoration-brass decoration-2 underline-offset-[6px]"
                          >
                            Use this boat
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setEditing(boat.id)}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink underline underline-offset-4"
                        >
                          Edit<span className="sr-only"> {boat.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(boat.id)}
                          className="inline-flex min-h-11 items-center text-ink/70 hover:text-error"
                        >
                          Remove<span className="sr-only"> {boat.name}</span>
                        </button>
                      </div>
                    </div>

                    {confirmRemove === boat.id ? (
                      <div
                        role="alertdialog"
                        aria-label={`Remove ${boat.name}`}
                        className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-ink"
                      >
                        <span>
                          Remove {boat.name} and its documents from this device?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            removeBoat(boat.id);
                            setConfirmRemove(null);
                            if (editing === boat.id) setEditing(null);
                            flash(`${boat.name} was removed.`);
                          }}
                          className="inline-flex min-h-11 items-center font-medium text-error underline underline-offset-4"
                        >
                          Yes, remove
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(null)}
                          className="inline-flex min-h-11 items-center underline underline-offset-4"
                        >
                          Keep it
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {editing !== null ? (
            <BoatEditor
              key={editing}
              initial={editingBoat}
              onCancel={() => setEditing(null)}
              onSave={(input) => {
                const saved = saveBoat(input);
                setEditing(null);
                flash(`${saved.name} saved on this device.`);
              }}
            />
          ) : null}
        </section>

        <section className="hairline-top mt-12 pt-8" aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="type-heading type-h2 text-ink">
            Documents
          </h2>
          <p className="measure mt-2 text-sm text-ink/70">
            {siteConfig.hub.documentsNote}
          </p>
          {activeBoat ? (
            <>
              <p className="mt-3 text-ink/75">
                For your active boat, <strong>{activeBoat.name}</strong>.
              </p>
              <DocumentWallet
                documents={
                  activeBoat.documents ?? {
                    registrationNumber: "",
                    insuranceProvider: "",
                    insurancePolicy: "",
                    insuranceExpiry: "",
                    competenceCertificate: "",
                    vhfLicence: "",
                  }
                }
                onChange={(documents) => {
                  saveBoat({ ...activeBoat, documents });
                  flash("Documents saved on this device.");
                }}
                insuranceMinimumLabel={insuranceLabel}
              />
            </>
          ) : (
            <p className="measure mt-3 text-ink/75">
              Add a boat first, then you can keep its registration, insurance,
              certificate and VHF licence details here.
            </p>
          )}
        </section>

        <section className="hairline-top mt-12 pt-8" aria-labelledby="you-heading">
          <h2 id="you-heading" className="type-heading type-h2 text-ink">
            About you
          </h2>
          <p className="measure mt-2 text-sm text-ink/70">
            Optional. The skipper&apos;s contact details, so you do not retype
            them in every enquiry.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className={labelClass}>Skipper full name</span>
              <input
                type="text"
                value={skipper.name}
                onChange={(e) => {
                  saveSkipper({ ...skipper, name: e.target.value });
                  flash("Saved on this device.");
                }}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Phone</span>
              <input
                type="tel"
                value={skipper.phone}
                onChange={(e) => {
                  saveSkipper({ ...skipper, phone: e.target.value });
                  flash("Saved on this device.");
                }}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                value={skipper.email}
                onChange={(e) => {
                  saveSkipper({ ...skipper, email: e.target.value });
                  flash("Saved on this device.");
                }}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="hairline-top mt-12 pt-8" aria-labelledby="units-heading">
          <h2 id="units-heading" className="type-heading type-h2 text-ink">
            Units
          </h2>
          <p className="measure mt-2 text-sm text-ink/70">
            Applied across the whole site, and remembered on this device.
          </p>
          <div className="mt-4">
            <UnitSegmented tone="light" />
          </div>
        </section>

        <SavedMarinas showEmpty headingLevel="h2" />

        <section className="hairline-top mt-12 pt-8" aria-labelledby="clear-heading">
          <h2 id="clear-heading" className="type-heading type-h2 text-ink">
            Data on this device
          </h2>
          <p className="measure mt-2 text-sm text-ink/70">
            {siteConfig.privacyNote}
          </p>
          {confirmClear ? (
            <div role="alertdialog" aria-label="Clear saved data" className="mt-4">
              <p className="measure text-ink">{siteConfig.hub.clearWarning}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    setConfirmClear(false);
                    setEditing(null);
                    flash("All saved data was removed from this device.");
                  }}
                  className="inline-flex min-h-11 items-center font-medium text-error underline underline-offset-4"
                >
                  Yes, clear everything
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  Keep my data
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="mt-4 inline-flex min-h-11 items-center border border-ink/30 px-5 text-sm font-medium text-ink hover:border-error hover:text-error"
            >
              Clear all saved data on this device
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
