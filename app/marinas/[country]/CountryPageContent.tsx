"use client";

import { useEffect, useMemo, useState } from "react";
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
import MarinaRow from "../../components/MarinaRow";
import LengthInput from "../../components/LengthInput";
import { useUnits } from "../../components/UnitsProvider";
import { withUnit } from "../../../lib/units";
import { useLanguage } from "../../components/LanguageProvider";

const inputClass =
  "mt-2 w-full border border-hairline px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none";
const labelClass = "text-sm font-medium text-ink/80";

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
    <section className="px-5 py-14 md:px-8 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-ink/70">{countryName}</p>
        <h1 className="type-display mt-2 text-ink [font-size:clamp(2rem,1.2rem+3vw,3.2rem)]">
          {t.countryPage.heading(countryName)}
        </h1>

        <div className="surface-lift mt-10 p-6 md:p-8">
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
                    className="flex items-center gap-2 text-sm text-ink/75"
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
          <p className="measure mt-10 text-ink/75">
            No marinas match these filters. Try loosening them.
          </p>
        ) : (
          <ul className="mt-10 max-w-3xl">
            {filtered.map((marina) => (
              <MarinaRow key={marina.id} marina={marina} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
