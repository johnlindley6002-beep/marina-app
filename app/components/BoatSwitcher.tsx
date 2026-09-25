"use client";

import Link from "next/link";
import { useState } from "react";
import type { SavedBoat } from "../../lib/boatProfile";
import { formatLength } from "../../lib/units";
import { useBoats } from "./BoatProvider";
import { useUnits } from "./UnitsProvider";

type Props = {
  // When provided, the controls include "Save this boat".
  current?: Omit<SavedBoat, "id">;
  heading?: string;
  onSelect: (boat: SavedBoat) => void;
};

const inputClass =
  "field";
const labelClass = "field-label";

// Pick the active boat, and optionally save what is in the form as a boat.
// The boats themselves live in BoatProvider; the full editor is /my-boat.
export default function BoatSwitcher({ current, heading, onSelect }: Props) {
  const { boats, activeBoat, setActiveId, saveBoat } = useBoats();
  const { units } = useUnits();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(id: string) {
    setError(null);
    setMessage(null);
    if (!id) {
      setActiveId(null);
      return;
    }
    const boat = boats.find((b) => b.id === id);
    if (!boat) return;
    setActiveId(id);
    onSelect(boat);
  }

  function handleSave() {
    if (!current) return;
    const name = current.name.trim();
    if (!name) {
      setMessage(null);
      setError("Give the boat a name to save it.");
      return;
    }
    if (
      !(
        Number(current.loa) > 0 &&
        Number(current.beam) > 0 &&
        Number(current.draft) > 0
      )
    ) {
      setMessage(null);
      setError("Enter the boat's length, beam and draft above, then save.");
      return;
    }
    const existing = boats.find(
      (b) => b.name.trim().toLowerCase() === name.toLowerCase()
    );
    saveBoat({ ...current, name, id: existing?.id });
    setError(null);
    setMessage(
      existing
        ? "Boat and documents updated."
        : "Boat and documents saved on this device."
    );
  }

  if (boats.length === 0 && !current) return null;

  const matchesSaved =
    !!current &&
    boats.some(
      (b) => b.name.trim().toLowerCase() === current.name.trim().toLowerCase()
    );

  return (
    <div className="mt-4 rounded-[3px] bg-paper-deep p-4">
      {heading ? (
        <p className="mb-3 text-sm font-medium text-ink">{heading}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        {boats.length > 0 ? (
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className={labelClass}>Saved boats</span>
            <select
              value={activeBoat?.id ?? ""}
              onChange={(e) => handleChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose a saved boat…</option>
              {boats.map((boat) => (
                <option key={boat.id} value={boat.id}>
                  {boat.name}
                  {Number(boat.loa) > 0
                    ? ` - ${formatLength(Number(boat.loa), units)}`
                    : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {current ? (
          <button
            type="button"
            onClick={handleSave}
            className="btn-secondary"
          >
            {matchesSaved
              ? "Update saved boat"
              : boats.length > 0
                ? "Save as new boat"
                : "Save this boat"}
          </button>
        ) : null}

        <Link
          href="/my-boat"
          className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-ink underline underline-offset-4 hover:text-ink-2"
        >
          Manage boats
        </Link>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-xs text-error">
          {error}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="mt-2 text-xs text-ink/70">
          {message}
        </p>
      ) : null}
    </div>
  );
}
