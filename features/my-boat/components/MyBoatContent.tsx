"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { marinas } from "@/data/marinas";
import { clearFrequentCrew } from "@/features/my-boat/lib/boatProfile";
import { resetMockPreArrival } from "@/lib/data";
import { formatLength } from "@/lib/units";
import { useFormat } from "@/components/providers/useFormat";
import { useBoats } from "@/components/providers/BoatProvider";
import Disclosure from "@/components/ui/Disclosure";
import { useLanguage } from "@/components/providers/LanguageProvider";
import SavedMarinas from "@/features/discovery/components/SavedMarinas";
import PageHeader from "@/components/layout/PageHeader";
import UnitSegmented from "@/components/ui/UnitSegmented";
import { useUnits } from "@/components/providers/UnitsProvider";
import DocumentWallet from "@/features/marina/components/DocumentWallet";
import BoatEditor from "./BoatEditor";
import UpcomingStays from "./UpcomingStays";

const inputClass = "field";
const labelClass = "field-label";

export default function MyBoatContent() {
  const { t } = useLanguage();
  const copy = t.myBoat;
  const { moneyCompact } = useFormat();
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
  const insuranceLabel = moneyCompact(marinas[0]?.insuranceMinimumEur ?? 0);

  return (
    <div className="section">
      <div className="page-column page-reading">
        <PageHeader title={copy.title}>{copy.intro}</PageHeader>
        <Disclosure label={copy.whereStored} openLabel={copy.hideWhereStored}>
          <p className="measure pb-2 text-ink-soft">{copy.deviceNote}</p>
        </Disclosure>
        {!storageOk ? (
          <p role="alert" className="measure mt-4 border-l-2 border-error pl-3 text-sm text-error">
            {copy.storageBlocked}
          </p>
        ) : null}
        <p role="status" className="mt-4 min-h-6 text-sm font-medium text-ink">
          {notice}
        </p>

        {marinas[0] ? (
          <Link
            href={`/marinas/${marinas[0].countrySlug}/${marinas[0].id}/pre-arrival`}
            className="surface-lift mt-2 block p-6"
          >
            <p className="font-medium text-ink">{t.preArrival.cta.myBoat}</p>
          </Link>
        ) : null}

        <UpcomingStays />

        <section className="stack-md" aria-labelledby="boats-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 id="boats-heading" className="type-heading type-h2 text-ink">
              {copy.boats}
            </h2>
            {editing === null && ready ? (
              <button type="button" onClick={() => setEditing("new")} className="btn-quiet">
                {copy.addBoat}
              </button>
            ) : null}
          </div>

          {ready && boats.length === 0 && editing === null ? (
            <p className="measure mt-4 text-ink-soft">{copy.noBoats}</p>
          ) : null}

          {boats.length > 0 ? (
            <ul className="mt-4">
              {boats.map((boat) => {
                const active = activeBoat?.id === boat.id;
                return (
                  <li key={boat.id} className="hairline-top py-5 first:border-t-0">
                    <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
                      <div className="min-w-0">
                        <h3 className="type-heading type-h3 flex flex-wrap items-center gap-3 text-ink">
                          {boat.name}
                          {active ? <span className="chip">{copy.activeBoat}</span> : null}
                        </h3>
                        <p className="tabular mt-1 text-ink-soft">
                          {copy.dimensions(
                            formatLength(Number(boat.loa), units),
                            formatLength(Number(boat.beam), units),
                            formatLength(Number(boat.draft), units)
                          )}
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {[
                            boat.type &&
                              (copy.editor.types[boat.type as keyof typeof copy.editor.types] ??
                                boat.type),
                            boat.flag,
                            boat.homePort && copy.homePort(boat.homePort),
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
                              flash(copy.nowActive(boat.name));
                            }}
                            className="btn-quiet"
                          >
                            {copy.useThisBoat}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setEditing(boat.id)}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center text-ink underline underline-offset-4"
                        >
                          {copy.edit}
                          <span className="sr-only"> {boat.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(boat.id)}
                          className="inline-flex min-h-11 items-center text-ink-muted hover:text-error"
                        >
                          {copy.remove}
                          <span className="sr-only"> {boat.name}</span>
                        </button>
                      </div>
                    </div>

                    {confirmRemove === boat.id ? (
                      <div
                        role="alertdialog"
                        aria-label={copy.removeLabel(boat.name)}
                        className="mt-3 flex flex-wrap items-center gap-x-4 text-sm text-ink"
                      >
                        <span>{copy.removeQuestion(boat.name)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            removeBoat(boat.id);
                            setConfirmRemove(null);
                            if (editing === boat.id) setEditing(null);
                            flash(copy.removed(boat.name));
                          }}
                          className="inline-flex min-h-11 items-center font-medium text-error underline underline-offset-4"
                        >
                          {copy.confirmRemove}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRemove(null)}
                          className="inline-flex min-h-11 items-center underline underline-offset-4"
                        >
                          {copy.keepIt}
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
                flash(copy.saved(saved.name));
              }}
            />
          ) : null}
        </section>

        <section className="chapter" aria-labelledby="docs-heading">
          <h2 id="docs-heading" className="type-heading type-h2 text-ink">
            {copy.documents}
          </h2>
          <p className="measure mt-2 text-sm text-ink-muted">{copy.documentsNote}</p>
          {activeBoat ? (
            <>
              <p className="mt-3 text-ink-soft">{copy.forActiveBoat(activeBoat.name)}</p>
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
                  flash(copy.documentsSaved);
                }}
                insuranceMinimumLabel={insuranceLabel}
              />
            </>
          ) : (
            <p className="measure mt-3 text-ink-soft">{copy.addBoatFirst}</p>
          )}
        </section>

        <section className="chapter" aria-labelledby="you-heading">
          <h2 id="you-heading" className="type-heading type-h2 text-ink">
            {copy.aboutYou}
          </h2>
          <p className="measure mt-2 text-sm text-ink-muted">{copy.aboutYouNote}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className={labelClass}>{copy.skipperName}</span>
              <input
                type="text"
                value={skipper.name}
                autoComplete="name"
                onChange={(e) => {
                  saveSkipper({ ...skipper, name: e.target.value });
                  flash(copy.savedOnDevice);
                }}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>{copy.phone}</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={skipper.phone}
                onChange={(e) => {
                  saveSkipper({ ...skipper, phone: e.target.value });
                  flash(copy.savedOnDevice);
                }}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className={labelClass}>{copy.email}</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={skipper.email}
                onChange={(e) => {
                  saveSkipper({ ...skipper, email: e.target.value });
                  flash(copy.savedOnDevice);
                }}
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <section className="chapter" aria-labelledby="units-heading">
          <h2 id="units-heading" className="type-heading type-h2 text-ink">
            {copy.units}
          </h2>
          <p className="measure mt-2 text-sm text-ink-muted">{copy.unitsNote}</p>
          <div className="mt-4">
            <UnitSegmented tone="light" />
          </div>
        </section>

        <SavedMarinas showEmpty headingLevel="h2" />

        <section className="chapter" aria-labelledby="clear-heading">
          <h2 id="clear-heading" className="type-heading type-h2 text-ink">
            {copy.dataHeading}
          </h2>
          <Disclosure
            label={t.marinaPage.approach.dataHandled}
            openLabel={t.marinaPage.approach.hideDataHandled}
          >
            <p className="measure pb-2 text-ink-soft">{t.chrome.privacyNote}</p>
          </Disclosure>
          {confirmClear ? (
            <div role="alertdialog" aria-label={copy.clearLabel} className="mt-4">
              <p className="measure text-ink">{copy.clearWarning}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4">
                <button
                  type="button"
                  onClick={() => {
                    clearAll();
                    resetMockPreArrival();
                    clearFrequentCrew();
                    setConfirmClear(false);
                    setEditing(null);
                    flash(copy.cleared);
                  }}
                  className="inline-flex min-h-11 items-center font-medium text-error underline underline-offset-4"
                >
                  {copy.confirmClear}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="inline-flex min-h-11 items-center underline underline-offset-4"
                >
                  {copy.keepData}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              className="btn-secondary mt-4 hover:border-error hover:text-error"
            >
              {copy.clearAll}
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
