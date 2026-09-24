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
import { useLanguage } from "../../../components/LanguageProvider";

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
// and page loads, not a fresh random draw each time. Purely simulated,
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
  onBerthSelect?: (berthId: string | null) => void;
  // Controlled mode: the parent owns the inputs, validation, price summary
  // and contact CTA; the map only renders availability for these values.
  controlled?: { arrival: string; departure: string; lengthM: string };
};

// Sums each night's actual season rate, rather than assuming the whole
// stay is one season, which is correct for a stay that spans the Apr/Sep or
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
  onBerthSelect,
  controlled,
}: Props) {
  const { t } = useLanguage();
  const [arrival, setArrival] = useState(initialArrival);
  const [departure, setDeparture] = useState(initialDeparture);
  const [length, setLength] = useState(initialLength);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selectedBerthId, setSelectedBerthId] = useState<string | null>(null);

  const allBerths = useMemo(() => getAllBerths(), []);

  const runSearch = (arrivalValue: string, departureValue: string, lengthValue: string) => {
    setSelectedBerthId(null);
    onBerthSelect?.(null);

    if (!lengthValue || Number(lengthValue) <= 0) {
      setError(t.berthSearch.errorLength);
      setResult(null);
      return;
    }

    if (!arrivalValue || !departureValue) {
      setError(t.berthSearch.errorDates);
      setResult(null);
      return;
    }

    const arrivalDate = new Date(arrivalValue);
    const departureDate = new Date(departureValue);

    if (departureDate <= arrivalDate) {
      setError(t.berthSearch.errorDeparture);
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
    if (controlled) {
      runSearch(controlled.arrival, controlled.departure, controlled.lengthM);
      return;
    }
    if (initialArrival && initialDeparture && initialLength) {
      runSearch(initialArrival, initialDeparture, initialLength);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlled?.arrival, controlled?.departure, controlled?.lengthM]);

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

  const arrivalValue = controlled ? controlled.arrival : arrival;
  const departureValue = controlled ? controlled.departure : departure;
  const lengthValue = controlled ? controlled.lengthM : length;

  const mailtoHref = (() => {
    const subject = t.berthSearch.mailSubject;
    const lines = [t.berthSearch.mailGreeting, "", t.berthSearch.mailIntro];
    if (arrivalValue && departureValue && lengthValue) {
      lines.push("");
      lines.push(`${t.berthSearch.mailArrival}: ${arrivalValue}`);
      lines.push(`${t.berthSearch.mailDeparture}: ${departureValue}`);
      lines.push(`${t.berthSearch.mailBoatLength}: ${lengthValue} m`);
      if (selectedBerth) {
        lines.push(`${t.berthSearch.mailBerth}: ${selectedBerth.id}`);
      }
    }
    lines.push("");
    lines.push(t.berthSearch.mailSignoff);
    const body = lines.join("\n");
    return `mailto:${marinaEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  })();

  return (
    <div className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10">
      <h2 className="text-lg font-normal tracking-tight text-navy">
        {t.berthSearch.heading}
      </h2>
      <p className="mt-2 text-sm font-light text-neutral-500">
        {t.berthSearch.subheading(marinaName)}
      </p>
      <p className="mt-1 text-xs font-light text-neutral-400">
        {t.berthSearch.illustrative}
      </p>

      {!controlled ? (
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-4">
        <label className="block text-sm">
          <span className="text-xs font-normal tracking-wide text-navy/60 uppercase">
            {t.berthSearch.arrival}
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
            {t.berthSearch.departure}
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
            {t.berthSearch.boatLength}
          </span>
          <input
            type="number"
            min="1"
            step="0.1"
            value={length}
            onChange={(event) => setLength(event.target.value)}
            placeholder={t.berthSearch.lengthPlaceholder}
            className="mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none"
          />
        </label>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-navy px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
          >
            {t.berthSearch.searchButton}
          </button>
        </div>
      </form>
      ) : null}

      {error && !controlled ? (
        <p className="mt-4 text-sm font-light text-red-600">{error}</p>
      ) : null}

      {result && result.boatClass && matchingBerths.length === 0 ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          {t.berthSearch.noClass(result.boatClass)}
        </p>
      ) : null}

      {result && result.boatClass && matchingBerths.length > 0 && availableBerths.length === 0 ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          {t.berthSearch.noAvailable}
        </p>
      ) : null}

      {result && !result.boatClass ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          {t.berthSearch.noFit}
        </p>
      ) : null}

      {result && result.boatClass && totalNights > 0 && !controlled ? (
        <p className="mt-4 text-sm font-light text-neutral-500">
          {result.lowNights > 0 && result.highNights > 0
            ? t.berthSearch.seasonBoth(result.lowNights, result.highNights)
            : result.highNights > 0
              ? t.berthSearch.seasonHigh
              : t.berthSearch.seasonLow}
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
                  clickable
                    ? () => {
                        setSelectedBerthId(berth.id);
                        onBerthSelect?.(berth.id);
                      }
                    : undefined
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
            {t.berthSearch.legendAvailable}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.occupied }}
            />
            {t.berthSearch.legendOccupied}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.unfit }}
            />
            {t.berthSearch.legendUnfit}
          </span>
          <span className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: STATUS_FILL.neutral }}
            />
            {t.berthSearch.legendNeutral}
          </span>
        </div>
      </div>

      {!result && !controlled ? (
        <p className="mt-6 text-sm font-light text-neutral-400">
          {t.berthSearch.hintBeforeSearch}
        </p>
      ) : null}

      {selectedBerth && result?.boatClass && selectedPrice !== null && !controlled ? (
        <div className="mt-6 border-t border-neutral-200 pt-6">
          <p className="text-sm font-light text-neutral-500">
            {t.berthSearch.priceBerthLine(
              selectedBerth.id,
              selectedBerth.sizeClass,
              totalNights
            )}
          </p>
          <p className="mt-2 text-xl font-normal text-navy">
            €{selectedPrice.toFixed(2)}
          </p>
          <p className="mt-1 text-xs font-light text-neutral-400">
            {t.berthSearch.vatNote(Math.round(vatRate * 100))}
          </p>
        </div>
      ) : null}

      {!controlled ? (
      <div className="mt-6 border-t border-neutral-200 pt-6">
        <p className="text-sm font-light text-neutral-500">
          {t.berthSearch.ctaHeading(marinaName)}
        </p>
        <a
          href={mailtoHref}
          className="mt-3 inline-block bg-navy-accent px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75]"
        >
          {t.berthSearch.ctaButton}
        </a>
      </div>
      ) : null}
    </div>
  );
}
