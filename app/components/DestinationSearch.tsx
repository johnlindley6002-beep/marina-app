"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { getSuggestions, type Suggestion } from "../../lib/marinaSearch";
import { loadBoatProfile } from "../../lib/boatProfile";
import { formatLength, withUnit } from "../../lib/units";
import { useLanguage } from "./LanguageProvider";
import LengthInput from "./LengthInput";
import { useUnits } from "./UnitsProvider";

type Initial = { q?: string; arrival?: string; departure?: string; length?: string };

const fieldClass =
  "mt-1 w-full rounded-[3px] border border-hairline bg-paper px-4 py-3 text-base text-ink placeholder:text-ink/65 focus:border-ink";

export default function DestinationSearch({
  initial,
  className = "",
}: {
  initial?: Initial;
  className?: string;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const { units } = useUnits();
  const uid = useId();
  const listId = `${uid}-list`;

  const [q, setQ] = useState(initial?.q ?? "");
  const [arrival, setArrival] = useState(initial?.arrival ?? "");
  const [departure, setDeparture] = useState(initial?.departure ?? "");
  const [length, setLength] = useState(initial?.length ?? "");
  const [filtersOpen, setFiltersOpen] = useState(
    !!(initial?.arrival || initial?.departure || initial?.length)
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  // A saved boat's length fills in when none was given (the toggle label shows it).
  useEffect(() => {
    if (initial?.length) return;
    const saved = loadBoatProfile().loa;
    if (Number(saved) > 0) setLength((current) => current || saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const suggestions: Suggestion[] = open ? getSuggestions(q) : [];

  function choose(suggestion: Suggestion) {
    setQ(suggestion.label);
    setOpen(false);
    setActive(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && active >= 0 && suggestions[active]) {
      event.preventDefault();
      choose(suggestions[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (arrival) params.set("arrival", arrival);
    if (departure) params.set("departure", departure);
    if (Number(length) > 0) params.set("length", length);
    router.push(`/marinas${params.size > 0 ? `?${params}` : ""}`);
  }

  return (
    <form onSubmit={handleSubmit} className={`surface-lift p-4 md:p-5 ${className}`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <label htmlFor={`${uid}-q`} className="block text-sm font-medium text-ink">
            {t.home.destinationLabel}
          </label>
          <input
            id={`${uid}-q`}
            type="text"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              active >= 0 ? `${uid}-opt-${active}` : undefined
            }
            autoComplete="off"
            value={q}
            placeholder={t.home.destinationPlaceholder}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            className={fieldClass}
          />
          {open && suggestions.length > 0 ? (
            <ul
              id={listId}
              role="listbox"
              className="surface-lift absolute z-20 mt-2 w-full overflow-hidden py-1"
            >
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`${uid}-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(suggestion);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={`cursor-pointer px-4 py-2.5 ${
                    index === active ? "bg-paper" : ""
                  }`}
                >
                  <span className="block text-base font-medium text-ink">
                    {suggestion.label}
                  </span>
                  <span className="block text-sm text-ink/70">
                    {suggestion.detail}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn-primary"
        >
          {t.home.findMarinas}
        </button>
      </div>

      <button
        type="button"
        aria-expanded={filtersOpen}
        aria-controls={`${uid}-filters`}
        onClick={() => setFiltersOpen((v) => !v)}
        className="mt-1 inline-flex min-h-11 items-center text-sm text-ink/70 underline underline-offset-4 hover:text-ink"
      >
        {filtersOpen
          ? t.home.hideFilters
          : Number(length) > 0
            ? `${t.home.addFilters} (${formatLength(Number(length), units)})`
            : t.home.addFilters}
      </button>

      {filtersOpen ? (
        <div id={`${uid}-filters`} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-ink">
            {t.homeSearch.arrival}
            <input
              type="date"
              value={arrival}
              onChange={(e) => setArrival(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            {t.homeSearch.departure}
            <input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            {withUnit(t.homeSearch.boatLength, units)}
            <LengthInput
              valueM={length}
              onChangeM={setLength}
              className={fieldClass}
            />
          </label>
        </div>
      ) : null}
    </form>
  );
}
