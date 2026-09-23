"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  boatFitsMarina,
  getPriceBand,
  FACILITY_LABELS,
  type FacilityKey,
  type Marina,
  type PriceBand,
} from "../../../data/marinas";
import { loadBoatProfile, saveBoatProfile } from "../../../lib/boatProfile";
import BoatSwitcher from "../../components/BoatSwitcher";
import FavouriteButton from "../../components/FavouriteButton";
import LengthInput from "../../components/LengthInput";
import { useUnits } from "../../components/UnitsProvider";
import { withUnit } from "../../../lib/units";
import Image from "next/image";
import { useLanguage } from "../../components/LanguageProvider";

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";

export default function CountryPageContent({
  marinas,
  countryName,
}: {
  marinas: Marina[];
  countryName: string;
}) {
  const { t } = useLanguage();
  const { units } = useUnits();

  const [region, setRegion] = useState("");
  const [priceBand, setPriceBand] = useState<PriceBand | "">("");
  const [facilities, setFacilities] = useState<FacilityKey[]>([]);
  const [loa, setLoa] = useState("");
  const [beam, setBeam] = useState("");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const saved = loadBoatProfile();
    setLoa(saved.loa);
    setBeam(saved.beam);
    setDraft(saved.draft);
  }, []);

  useEffect(() => {
    saveBoatProfile({ loa, beam, draft });
  }, [loa, beam, draft]);

  const regions = useMemo(
    () => Array.from(new Set(marinas.map((m) => m.region))).sort(),
    [marinas]
  );
  const priceBands = useMemo(
    () =>
      Array.from(new Set(marinas.map((m) => getPriceBand(m)))).sort(
        (a, b) => a.length - b.length
      ),
    [marinas]
  );
  const availableFacilities = useMemo(
    () =>
      Array.from(new Set(marinas.flatMap((m) => m.facilities))) as FacilityKey[],
    [marinas]
  );

  function toggleFacility(key: FacilityKey) {
    setFacilities((current) =>
      current.includes(key)
        ? current.filter((f) => f !== key)
        : [...current, key]
    );
  }

  const filtered = marinas.filter((marina) => {
    if (region && marina.region !== region) return false;
    if (priceBand && getPriceBand(marina) !== priceBand) return false;
    if (
      facilities.length > 0 &&
      !facilities.every((f) => marina.facilities.includes(f))
    ) {
      return false;
    }
    const loaNum = Number(loa);
    const beamNum = Number(beam);
    const draftNum = Number(draft);
    if (loaNum > 0 && beamNum > 0 && draftNum > 0) {
      if (!boatFitsMarina(marina, { loa: loaNum, beam: beamNum, draft: draftNum })) {
        return false;
      }
    }
    return true;
  });

  return (
    <section className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
            {countryName}
          </p>
          <h1 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
            {t.countryPage.heading(countryName)}
          </h1>
        </div>

        <div className="mt-12 rounded-sm border border-neutral-200/80 bg-white p-6 md:p-8">
          <BoatSwitcher
            onSelect={(boat) => {
              setLoa(boat.loa);
              setBeam(boat.beam);
              setDraft(boat.draft);
            }}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm">
              <span className={labelClass}>Region</span>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={inputClass}
              >
                <option value="">Any</option>
                {regions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className={labelClass}>Price band</span>
              <select
                value={priceBand}
                onChange={(e) => setPriceBand(e.target.value as PriceBand | "")}
                className={inputClass}
              >
                <option value="">Any</option>
                {priceBands.map((band) => (
                  <option key={band} value={band}>
                    {band}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className={labelClass}>{withUnit("Boat length (m)", units)}</span>
              <LengthInput
                valueM={loa}
                onChangeM={setLoa}
                className={inputClass}
              />
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm">
                <span className={labelClass}>{withUnit("Beam (m)", units)}</span>
                <LengthInput
                valueM={beam}
                onChangeM={setBeam}
                className={inputClass}
              />
              </label>
              <label className="block text-sm">
                <span className={labelClass}>{withUnit("Draft (m)", units)}</span>
                <LengthInput
                valueM={draft}
                onChangeM={setDraft}
                className={inputClass}
              />
              </label>
            </div>
          </div>

          {availableFacilities.length > 0 ? (
            <div className="mt-4">
              <span className={labelClass}>Facilities</span>
              <div className="mt-2 flex flex-wrap gap-3">
                {availableFacilities.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm font-light text-neutral-600"
                  >
                    <input
                      type="checkbox"
                      checked={facilities.includes(key)}
                      onChange={() => toggleFacility(key)}
                    />
                    {FACILITY_LABELS[key]}
                  </label>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-12 text-center text-sm font-light text-neutral-500">
            No marinas match these filters — try loosening them.
          </p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((marina) => (
              <div key={marina.id} className="relative">
                <Link
                  href={`/marinas/${marina.countrySlug}/${marina.id}`}
                  className="group block rounded-sm border border-neutral-200/80 bg-white p-8 transition-colors hover:border-navy/20 md:p-10"
                >
                  <h2 className="flex items-center gap-2 text-lg font-normal tracking-tight text-navy">
                    {marina.name}
                    {marina.clubBurgee ? (
                      <Image
                        src={marina.clubBurgee.src}
                        alt={marina.clubBurgee.name}
                        width={1772}
                        height={1063}
                        className="h-4 w-auto"
                      />
                    ) : null}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed font-light text-neutral-600">
                    {marina.location}
                  </p>
                  <p className="mt-4 text-sm font-light text-navy/70 group-hover:text-navy">
                    {t.countryPage.viewMarina}
                  </p>
                </Link>
                <FavouriteButton
                  marinaId={marina.id}
                  countrySlug={marina.countrySlug}
                  marinaName={marina.name}
                  className="absolute right-4 bottom-4"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
