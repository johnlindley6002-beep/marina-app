"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { MarinaClass } from "../../../../data/marinas";
import {
  getAllBerths,
  getPontoonSpine,
  pontoons,
  MAP_WIDTH,
  MAP_HEIGHT,
  type Berth,
} from "../../../../data/berths";
import { classifyBoatLength, getSeason } from "../../../../data/marinas";

const VIEW_BOX = `0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`;

const MAP_COLORS = {
  water: "#d3e2e6",
  land: "#e6e2d8",
  breakwater: "#54626d",
};

const BREAKWATER_THICKNESS = 60;
const LAND_TOP_HEIGHT = 40;
const LAND_CORNER_WIDTH = 150;
const LAND_CORNER_HEIGHT = 200;

// Fixed pseudo-random pattern so availability is stable across renders
// and page loads, not a fresh random draw each time. Purely simulated —
// not connected to any real booking system.
function isSimulatedAvailable(berthId: string): boolean {
  let hash = 0;
  for (let i = 0; i < berthId.length; i++) {
    hash = (hash * 31 + berthId.charCodeAt(i)) >>> 0;
  }
  return hash % 3 !== 0;
}

type BerthStatus = "neutral" | "available" | "occupied" | "unfit";

const STATUS_FILL: Record<BerthStatus, string> = {
  neutral: "#d4d4d4",
  available: "#4d9d6f",
  occupied: "#9c8a8a",
  unfit: "#e5e5e5",
};

type SearchResult = {
  boatClass: MarinaClass | null;
  lowNights: number;
  highNights: number;
  totalPrice: number | null;
};

type Props = {
  marinaName: string;
  marinaEmail: string;
  transientRates: Record<MarinaClass, { low: number; high: number }>;
  vatRate: number;
  initialArrival?: string;
  initialDeparture?: string;
  initialLength?: string;
};

// Sums each night's actual season rate, rather than assuming the whole
// stay is one season — correct for a stay that spans the Apr/Sep or
// Sep/Oct season boundary.
function computeStay(
  arrivalDate: Date,
  departureDate: Date,
  boatClass: MarinaClass,
  transientRates: Record<MarinaClass, { low: number; high: number }>
) {
  let lowNights = 0;
  let highNights = 0;
  let totalPrice = 0;
  const cursor = new Date(arrivalDate);
  while (cursor < departureDate) {
    const season = getSeason(cursor);
    totalPrice += transientRates[boatClass][season];
    if (season === "low") lowNights += 1;
    else highNights += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return { lowNights, highNights, totalPrice };
}

export default function BerthAvailabilityMap({
  marinaName,
  marinaEmail,
  transientRates,
  vatRate,
  initialArrival = "",
  initialDeparture = "",
  initialLength = "",
}: Props) {
  const [arrival, setArrival] = useState(initialArrival);
  const [departure, setDeparture] = useState(initialDeparture);
  const [length, setLength] = useState(initialLength);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);

  const allBerths = useMemo(() => getAllBerths(), []);

  const runSearch = (arrivalValue: string, departureValue: string, lengthValue: string) => {
    setSelectedBerthId(null);

    if (!lengthValue || Number(lengthValue) <= 0) {
      setError("Enter your boat's length in metres.");
      setResult(null);
      return;
    }

    if (!arrivalValue || !departureValue) {
      setError("Choose an arrival and departure date.");
      setResult(null);
      return;
    }

    const arrivalDate = new Date(arrivalValue);
    const departureDate = new Date(departureValue);

    if (departureDate <= arrivalDate) {
      setError("Departure must be after arrival.");
      setResult(null);
      return;
    }

    const boatClass = classifyBoatLength(Number(lengthValue));
    const stay = boatClass
      ? computeStay(arrivalDate, departureDate, boatClass, transientRates)
      : null;

    setError(null);
    setResult({
      boatClass,
      lowNights: stay?.lowNights ?? 0,
      highNights: stay?.highNights ?? 0,
      totalPrice: stay?.totalPrice ?? null,
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    runSearch(arrival, departure, length);
  };

  // Auto-run the search once if we arrived here pre-filled from the
  // homepage search (e.g. /marinas/portugal/cascais?arrival=...).
  useEffect(() => {
    if (initialArrival && initialDeparture && initialLength) {
      runSearch(initialArrival, initialDeparture, initialLength);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusFor = (berth: Berth): BerthStatus => {
    if (!result) return "neutral";
    if (!result.boatClass) return "unfit";
    if (berth.sizeClass !== result.boatClass) return "unfit";
    return isSimulatedAvailable(berth.id) ? "available" : "occupied";
  };

  const matchingBerths = result?.boatClass
    ? allBerths.filter((b) => b.sizeClass === result.boatClass)
    : [];
  const availableBerths = matchingBerths.filter((b) =>
    isSimulatedAvailable(b.id)
  );

  const selectedBerth = selectedBerthId
    ? allBerths.find((b) => b.id === selectedBerthId)
    : null;

  const totalNights = result ? result.lowNights + result.highNights : 0;
  const selectedPrice =
    selectedBerth && result?.totalPrice != null ? result.totalPrice : null;

  const mailtoHref = (() => {
    const subject = "Berth request — Marina de Cascais";
    const lines = [
      "Hello,",
      "",
      "I'd like to enquire about berth availability at Marina de Cascais.",
    ];
    if (arrival && departure && length) {
      lines.push("");
      lines.push(`Arrival: ${arrival}`);
      lines.push(`Departure: ${departure}`);
      lines.push(`Boat length: ${length} m`);
      if (selectedBerth) {
        lines.push(`Berth of interest: ${selectedBerth.id}`);
      }
    }
    lines.push("");
    lines.push("Thanks,");
    const body = lines.join("\n");
    return `mailto:${marinaEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  })();

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        Find a berth
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-500">
        Check simulated availability at {marinaName}.
      </p>
      <p className="mt-1 text-xs font-light text-neutral-400">
        Berth availability shown is illustrative for now.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-4">
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
            placeholder="e.g. 7"
            className="mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-navy px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
          >
            Search
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 text-sm font-light text-red-600">{error}</p>
      ) : null}

      {result && result.boatClass && matchingBerths.length === 0 ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          No Class {result.boatClass} berths modeled yet in this schematic —
          larger vessel classes are coming in a future pass.
        </p>
      ) : null}

      {result && result.boatClass && matchingBerths.length > 0 && availableBerths.length === 0 ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          No available berths match your dates — try different dates.
        </p>
      ) : null}

      {result && !result.boatClass ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          No berth class fits a vessel this length in our current tariff
          (max 45 m) — please contact the marina directly.
        </p>
      ) : null}

      {result && result.boatClass && totalNights > 0 ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          {result.lowNights > 0 && result.highNights > 0
            ? `Your stay spans both seasons — ${result.lowNights} night${
                result.lowNights === 1 ? "" : "s"
              } low season, ${result.highNights} night${
                result.highNights === 1 ? "" : "s"
              } high season.`
            : result.highNights > 0
              ? "Your dates fall in high season (Apr–Sep)."
              : "Your dates fall in low season (Jan–Mar & Oct–Dec)."}
        </p>
      ) : null}

      <div className="mt-8">
        <svg
          viewBox={VIEW_BOX}
          className="w-full rounded-sm"
          role="img"
          aria-label="Schematic map of Marina de Cascais berths"
        >
          {/* Water fills the whole canvas; land and breakwater are drawn on top. */}
          <rect
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            fill={MAP_COLORS.water}
          />

          {/* Land: promenade strip along the top, plus the Casa de São
              Bernardo corner where the west-quay pontoons (P-K) anchor. */}
          <rect
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={LAND_TOP_HEIGHT}
            fill={MAP_COLORS.land}
          />
          <rect
            x={0}
            y={0}
            width={LAND_CORNER_WIDTH}
            height={LAND_CORNER_HEIGHT}
            fill={MAP_COLORS.land}
          />

          {/* Breakwater sea-walls framing the bottom and right edges. */}
          <rect
            x={0}
            y={MAP_HEIGHT - BREAKWATER_THICKNESS}
            width={MAP_WIDTH}
            height={BREAKWATER_THICKNESS}
            fill={MAP_COLORS.breakwater}
          />
          <rect
            x={MAP_WIDTH - BREAKWATER_THICKNESS}
            y={0}
            width={BREAKWATER_THICKNESS}
            height={MAP_HEIGHT}
            fill={MAP_COLORS.breakwater}
          />

          {/* Reception / fuel pier, right edge. */}
          <g>
            <rect
              x={MAP_WIDTH - BREAKWATER_THICKNESS - 60}
              y={470}
              width={60}
              height={26}
              fill="#0a1a2f"
            />
            <text
              x={MAP_WIDTH - BREAKWATER_THICKNESS - 30}
              y={487}
              fontSize={9}
              fontWeight={600}
              fill="#ffffff"
              textAnchor="middle"
            >
              Reception / Fuel
            </text>
          </g>

          {pontoons.map((pontoon) => {
            const spine = getPontoonSpine(pontoon);
            return (
              <g key={pontoon.id}>
                <line
                  x1={spine.x1}
                  y1={spine.y1}
                  x2={spine.x2}
                  y2={spine.y2}
                  stroke="#0a1a2f"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                <text
                  x={spine.x1}
                  y={spine.y1}
                  dx={pontoon.angleDeg === 180 ? 14 : -14}
                  dy={pontoon.angleDeg === 90 ? -10 : 4}
                  fontSize={12}
                  fontWeight={600}
                  fill="#0a1a2f"
                  textAnchor={pontoon.angleDeg === 180 ? "start" : "end"}
                >
                  {pontoon.id}
                </text>
              </g>
            );
          })}

          {allBerths.map((berth) => {
            const status = statusFor(berth);
            const clickable = status === "available";
            const isSelected = berth.id === selectedBerthId;
            return (
              <rect
                key={berth.id}
                x={berth.x - berth.width / 2}
                y={berth.y - berth.height / 2}
                width={berth.width}
                height={berth.height}
                transform={`rotate(${berth.rotationDeg} ${berth.x} ${berth.y})`}
                fill={STATUS_FILL[status]}
                stroke={isSelected ? "#0a1a2f" : "none"}
                strokeWidth={isSelected ? 2 : 0}
                className={clickable ? "cursor-pointer" : undefined}
                onClick={
                  clickable ? () => setSelectedBerthId(berth.id) : undefined
                }
                role={clickable ? "button" : "img"}
                aria-label={`Berth ${berth.id}, Class ${berth.sizeClass}${
                  status === "occupied" ? ", occupied" : ""
                }${clickable ? ", available" : ""}`}
              />
            );
          })}
        </svg>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs font-light text-neutral-500">
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.available }}
            />
            Available & fits
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.occupied }}
            />
            Occupied
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.unfit }}
            />
            Doesn&apos;t fit your boat
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.neutral }}
            />
            Not searched yet
          </span>
        </div>
      </div>

      {!result ? (
        <p className="mt-6 text-sm font-light text-neutral-400">
          Enter your dates and boat length, then search to see berth
          availability.
        </p>
      ) : null}

      {selectedBerth && result?.boatClass && selectedPrice !== null ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-sm font-light text-neutral-500">
            Berth <span className="font-normal text-navy">{selectedBerth.id}</span>{" "}
            · Class {selectedBerth.sizeClass} · {totalNights} night
            {totalNights === 1 ? "" : "s"}
          </p>
          <p className="mt-2 text-xl font-normal text-navy">
            €{selectedPrice.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-light text-neutral-400">
            + {Math.round(vatRate * 100)}% VAT and utilities — estimate,
            confirm with marina.
          </p>
        </div>
      ) : null}

      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm font-light text-neutral-500">
          Questions about a berth at {marinaName}?
        </p>
        <a
          href={mailtoHref}
          className="mt-3 inline-block bg-navy-accent px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75]"
        >
          Contact marina
        </a>
      </div>
    </div>
  );
}
