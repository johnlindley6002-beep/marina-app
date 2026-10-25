"use client";

import {
  VESSEL_USES,
  type Propulsion,
  type VesselUseValue,
} from "@/features/prearrival/lib/schema";
import { VESSEL_USE_LABELS } from "@/features/marina/components/VesselUseFields";
import LengthInput from "@/components/ui/LengthInput";
import Field from "@/components/ui/Field";
import type { BoatScope } from "./BoatScope";

export default function BoatSpecsFields({ scope }: { scope: BoatScope }) {
  const { draft, setDraft, errors, copy, unit, marinaClass, rate } = scope;
  return (
    <>
      <p className="mt-8 text-sm font-medium text-ink-soft">{copy.specificationsHeading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={`${copy.lengthLabel.replace("(m)", `(${unit})`)}`}
          htmlFor="boat-loa"
          required
          error={errors["boatSpecs.lengthOverall"]}
        >
          <LengthInput
            valueM={draft.boatSpecs.lengthOverall}
            onChangeM={(v) =>
              setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, lengthOverall: v } }))
            }
            className="field"
          />
        </Field>
        <Field
          label={`${copy.beamLabel.replace("(m)", `(${unit})`)}`}
          htmlFor="boat-beam"
          required
          error={errors["boatSpecs.beam"]}
        >
          <LengthInput
            valueM={draft.boatSpecs.beam}
            onChangeM={(v) => setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, beam: v } }))}
            className="field"
          />
        </Field>
        <Field
          label={`${copy.draughtLabel.replace("(m)", `(${unit})`)}`}
          htmlFor="boat-draught"
          required
          error={errors["boatSpecs.draught"]}
        >
          <LengthInput
            valueM={draft.boatSpecs.draught}
            onChangeM={(v) =>
              setDraft((d) => ({ ...d, boatSpecs: { ...d.boatSpecs, draught: v } }))
            }
            className="field"
          />
        </Field>
        <Field label={copy.propulsionLabel} htmlFor="boat-propulsion">
          <select
            id="boat-propulsion"
            value={draft.boatSpecs.propulsion}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatSpecs: { ...d.boatSpecs, propulsion: e.target.value as Propulsion },
              }))
            }
            className="field"
          >
            <option value="sail">{copy.propulsionSail}</option>
            <option value="power">{copy.propulsionPower}</option>
            <option value="sail_and_power">{copy.propulsionBoth}</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={draft.boatSpecs.isMultihull}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatSpecs: { ...d.boatSpecs, isMultihull: e.target.checked },
              }))
            }
          />
          {copy.multihullLabel}
        </label>
      </div>

      {marinaClass && rate ? (
        <p className="tabular mt-4 text-ink">
          <span className="chip mr-2">{copy.classLabel(marinaClass)}</span>
          {copy.indicativeNightly(
            `€${(rate.low * (draft.boatSpecs.isMultihull ? 2 : 1)).toFixed(2)}`
          )}
        </p>
      ) : null}

      <div className="mt-6 max-w-xs">
        <Field label={copy.vesselUseLabel} htmlFor="boat-vesseluse">
          <select
            id="boat-vesseluse"
            value={draft.vesselUse}
            onChange={(e) =>
              setDraft((d) => ({ ...d, vesselUse: e.target.value as VesselUseValue }))
            }
            className="field"
          >
            {VESSEL_USES.map((use) => (
              <option key={use} value={use}>
                {VESSEL_USE_LABELS[use]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </>
  );
}
