"use client";

import { useEffect, useState } from "react";
import {
  loadBoats,
  newBoatId,
  saveBoatProfile,
  saveBoats,
  type SavedBoat,
} from "../../lib/boatProfile";

const CHANGE_EVENT = "aldock-boats-changed";

type Props = {
  // When provided, the saved-boat controls include "Save this boat".
  current?: Omit<SavedBoat, "id">;
  heading?: string;
  onSelect: (boat: SavedBoat) => void;
};

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";

export default function BoatSwitcher({ current, heading, onSelect }: Props) {
  const [boats, setBoats] = useState<SavedBoat[]>([]);
  const [activeId, setActiveId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Several switchers can be on one page, so they re-read storage when
  // any of them changes it.
  useEffect(() => {
    function refresh() {
      const store = loadBoats();
      setBoats(store.boats);
      setActiveId(store.activeId ?? "");
    }
    refresh();
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  function persist(nextBoats: SavedBoat[], nextActive: string) {
    setBoats(nextBoats);
    setActiveId(nextActive);
    saveBoats({ boats: nextBoats, activeId: nextActive || null });
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  function handleChange(id: string) {
    setError(null);
    setMessage(null);
    if (!id) {
      persist(boats, "");
      return;
    }
    const boat = boats.find((b) => b.id === id);
    if (!boat) return;
    persist(boats, id);
    saveBoatProfile({ loa: boat.loa, beam: boat.beam, draft: boat.draft });
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
      setError("Enter length, beam and draft to save this boat.");
      return;
    }
    const existing = boats.find(
      (b) => b.name.trim().toLowerCase() === name.toLowerCase()
    );
    const boat: SavedBoat = {
      ...current,
      name,
      id: existing?.id ?? newBoatId(),
    };
    persist(
      existing
        ? boats.map((b) => (b.id === boat.id ? boat : b))
        : [...boats, boat],
      boat.id
    );
    setError(null);
    setMessage(
      existing
        ? "Boat and documents updated."
        : "Boat and documents saved on this device."
    );
  }

  function handleDelete() {
    if (!activeId) return;
    persist(
      boats.filter((b) => b.id !== activeId),
      ""
    );
    setError(null);
    setMessage("Boat removed.");
  }

  if (boats.length === 0 && !current) return null;

  const matchesSaved =
    !!current &&
    boats.some(
      (b) => b.name.trim().toLowerCase() === current.name.trim().toLowerCase()
    );

  return (
    <div className="mt-4 border border-neutral-200/80 bg-neutral-50 p-4">
      {heading ? (
        <p className="mb-3 text-sm font-normal text-navy">{heading}</p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        {boats.length > 0 ? (
          <label className="block min-w-[200px] flex-1 text-sm">
            <span className={labelClass}>Saved boats</span>
            <select
              value={activeId}
              onChange={(e) => handleChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Choose a saved boat…</option>
              {boats.map((boat) => (
                <option key={boat.id} value={boat.id}>
                  {boat.name}
                  {boat.loa ? ` — ${boat.loa} m` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {current ? (
          <button
            type="button"
            onClick={handleSave}
            className="border border-navy/30 px-4 py-2 text-sm font-normal tracking-wide text-navy hover:border-navy"
          >
            {matchesSaved
              ? "Update saved boat"
              : boats.length > 0
                ? "Save as new boat"
                : "Save this boat"}
          </button>
        ) : null}

        {activeId ? (
          <button
            type="button"
            onClick={handleDelete}
            className="px-2 py-2 text-sm font-normal text-neutral-400 hover:text-red-600"
          >
            Remove
          </button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 text-xs font-light text-red-600">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-2 text-xs font-light text-neutral-500">{message}</p>
      ) : null}
      <p className="mt-2 text-xs font-light text-neutral-400">
        Boats are stored only in this browser — no account needed.
      </p>
    </div>
  );
}
