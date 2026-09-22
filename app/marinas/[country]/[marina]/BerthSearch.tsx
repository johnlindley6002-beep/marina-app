"use client";

import { useState, type FormEvent } from "react";

export default function BerthSearch({ marinaName }: { marinaName: string }) {
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [length, setLength] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [nights, setNights] = useState<number | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNights(null);

    if (!length || Number(length) <= 0) {
      setError("Enter your boat's length in metres.");
      return;
    }

    if (!arrival || !departure) {
      setError("Choose an arrival and departure date.");
      return;
    }

    const arrivalDate = new Date(arrival);
    const departureDate = new Date(departure);

    if (departureDate <= arrivalDate) {
      setError("Departure must be after arrival.");
      return;
    }

    const nightsCount = Math.round(
      (departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    setError(null);
    setNights(nightsCount);
  };

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        Find a berth
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-500">
        Check availability at {marinaName}.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm">
          <span className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            Arrival
          </span>
          <input
            type="date"
            value={arrival}
            onChange={(event) => setArrival(event.target.value)}
            className="mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            Departure
          </span>
          <input
            type="date"
            value={departure}
            onChange={(event) => setDeparture(event.target.value)}
            className="mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none"
          />
        </label>

        <label className="block text-sm">
          <span className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            Boat length (m)
          </span>
          <input
            type="number"
            min="1"
            step="0.1"
            value={length}
            onChange={(event) => setLength(event.target.value)}
            placeholder="e.g. 12"
            className="mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none"
          />
        </label>

        <div className="sm:col-span-3">
          <button
            type="submit"
            className="bg-navy px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
          >
            Check availability
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 text-sm font-light text-red-600">{error}</p>
      ) : null}

      {nights !== null ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-sm font-light text-neutral-500">
            Estimated stay:{" "}
            <span className="font-normal text-navy">
              {nights} night{nights === 1 ? "" : "s"}
            </span>
          </p>
          <p className="mt-1 text-sm font-light text-neutral-400">
            Pricing coming soon.
          </p>
        </div>
      ) : null}
    </div>
  );
}
