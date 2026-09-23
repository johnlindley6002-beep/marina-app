"use client";

import { useEffect, useState, type FormEvent } from "react";
import { checkBoatFit, type Marina } from "../../../../data/marinas";
import { loadBoatProfile, saveBoatProfile } from "../../../../lib/boatProfile";
import BoatSwitcher from "../../../components/BoatSwitcher";

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";

type Result =
  | { fits: true; marinaClass: string }
  | { fits: false; reason: "length" | "beam" | "draft" };

export default function BoatFitCheck({ marina }: { marina: Marina }) {
  const [loa, setLoa] = useState("");
  const [beam, setBeam] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    const saved = loadBoatProfile();
    setLoa(saved.loa);
    setBeam(saved.beam);
    setDraft(saved.draft);
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const loaNum = Number(loa);
    const beamNum = Number(beam);
    const draftNum = Number(draft);

    if (
      !loa ||
      !beam ||
      !draft ||
      loaNum <= 0 ||
      beamNum <= 0 ||
      draftNum <= 0
    ) {
      setError("Enter your boat's length, beam, and draft in metres.");
      setResult(null);
      return;
    }

    setError(null);
    saveBoatProfile({ loa, beam, draft });
    setResult(
      checkBoatFit(marina, { loa: loaNum, beam: beamNum, draft: draftNum })
    );
  }

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        Will my boat fit?
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-500">
        Check your boat&apos;s dimensions against {marina.name}&apos;s berth
        classes.
      </p>

      <BoatSwitcher
        onSelect={(boat) => {
          setLoa(boat.loa);
          setBeam(boat.beam);
          setDraft(boat.draft);
          setResult(null);
          setError(null);
        }}
      />

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-4">
        <label className="block text-sm">
          <span className={labelClass}>
            Length overall (m)
            <span className="text-red-500"> *</span>
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={loa}
            onChange={(e) => setLoa(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Beam (m)
            <span className="text-red-500"> *</span>
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={beam}
            onChange={(e) => setBeam(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-sm">
          <span className={labelClass}>
            Draft (m)
            <span className="text-red-500"> *</span>
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-navy px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
          >
            Check fit
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 text-sm font-light text-red-600">{error}</p>
      ) : null}

      {result?.fits ? (
        <p className="mt-4 text-sm font-normal text-navy">
          Fits — Class {result.marinaClass} berths available.
          {result.marinaClass === "IX" ? (
            <span className="block font-light text-neutral-500">
              This is the mega-yacht allocation on the outer pontoon.
            </span>
          ) : null}
        </p>
      ) : null}

      {result && !result.fits ? (
        <p className="mt-4 text-sm font-normal text-navy">
          {result.reason === "length"
            ? "Too long for standard berths — contact the marina."
            : result.reason === "beam"
              ? "Beam exceeds the standard berth for your length — contact the marina."
              : "Too deep for standard berths — contact the marina."}
        </p>
      ) : null}
    </div>
  );
}
