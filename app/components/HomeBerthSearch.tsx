"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { marinas } from "../../data/marinas";
import { useLanguage } from "./LanguageProvider";
import LengthInput from "./LengthInput";
import { useUnits } from "./UnitsProvider";
import { withUnit } from "../../lib/units";

export default function HomeBerthSearch() {
  const router = useRouter();
  const { t } = useLanguage();
  const { units } = useUnits();
  const [arrival, setArrival] = useState("");
  const [departure, setDeparture] = useState("");
  const [length, setLength] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const marina = marinas[0];
    if (!marina) return;

    const params = new URLSearchParams();
    if (arrival) params.set("arrival", arrival);
    if (departure) params.set("departure", departure);
    if (length) params.set("length", length);

    router.push(`/marinas/${marina.countrySlug}/${marina.id}?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-4"
    >
      <label className="sr-only" htmlFor="home-arrival">
        {t.homeSearch.arrival}
      </label>
      <input
        id="home-arrival"
        type="date"
        value={arrival}
        onChange={(event) => setArrival(event.target.value)}
        className="bg-white px-3 py-3 text-sm text-navy focus:outline-none"
      />

      <label className="sr-only" htmlFor="home-departure">
        {t.homeSearch.departure}
      </label>
      <input
        id="home-departure"
        type="date"
        value={departure}
        onChange={(event) => setDeparture(event.target.value)}
        className="bg-white px-3 py-3 text-sm text-navy focus:outline-none"
      />

      <label className="sr-only" htmlFor="home-length">
        {withUnit(t.homeSearch.boatLength, units)}
      </label>
      <LengthInput
        valueM={length}
        onChangeM={setLength}
        placeholder={withUnit(t.homeSearch.boatLength, units)}
        ariaLabel={withUnit(t.homeSearch.boatLength, units)}
        className="bg-white px-3 py-3 text-sm text-navy placeholder:text-neutral-500 focus:outline-none"
      />

      <button
        type="submit"
        className="bg-navy-accent px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75]"
      >
        {t.homeSearch.searchButton}
      </button>
    </form>
  );
}
