"use client";

import { COUNTRIES } from "@/lib/countries";
import { buildPtIdentificationSet, NAVIGATION_ZONES } from "@/features/prearrival/lib/portugal";
import Field from "@/components/ui/Field";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { BoatScope } from "./BoatScope";

export default function BoatIdentityFields({ scope }: { scope: BoatScope }) {
  const { draft, setDraft, errors, copy, boats, chooseSaved, isPt } = scope;
  const { t } = useLanguage();
  return (
    <>
      {boats.length > 0 ? (
        <div className="mt-6 max-w-md">
          <Field label={copy.chooseSaved} htmlFor="boat-saved">
            <select
              id="boat-saved"
              value={draft.boatId ?? ""}
              onChange={(e) => chooseSaved(e.target.value)}
              className="field"
            >
              <option value="">{copy.chooseSavedPlaceholder}</option>
              {boats.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      ) : null}

      <p className="mt-6 text-sm font-medium text-ink-soft">{copy.orNewBoat}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={copy.nameLabel}
          htmlFor="boat-name"
          required
          error={errors["boatIdentity.name"]}
        >
          <input
            id="boat-name"
            type="text"
            value={draft.boatIdentity.name}
            onChange={(e) =>
              setDraft((d) => ({ ...d, boatIdentity: { ...d.boatIdentity, name: e.target.value } }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.registrationLabel}
          htmlFor="boat-reg"
          required
          error={errors["boatIdentity.registrationNumber"]}
        >
          <input
            id="boat-reg"
            type="text"
            value={draft.boatIdentity.registrationNumber}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatIdentity: { ...d.boatIdentity, registrationNumber: e.target.value },
              }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.flagLabel}
          htmlFor="boat-flag"
          required
          error={errors["boatIdentity.flagCountry"]}
        >
          <select
            id="boat-flag"
            value={draft.boatIdentity.flagCountry}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatIdentity: { ...d.boatIdentity, flagCountry: e.target.value },
              }))
            }
            className="field"
          >
            <option value="">{t.enquiry.select}</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.callSignLabel} htmlFor="boat-callsign">
          <input
            id="boat-callsign"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            type="text"
            value={draft.boatIdentity.callSign}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatIdentity: { ...d.boatIdentity, callSign: e.target.value },
              }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.portOfRegistryLabel}
          htmlFor="boat-port"
          required
          error={errors["boatIdentity.portOfRegistry"]}
        >
          <input
            id="boat-port"
            type="text"
            value={draft.boatIdentity.portOfRegistry}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                boatIdentity: { ...d.boatIdentity, portOfRegistry: e.target.value },
              }))
            }
            className="field"
          />
        </Field>
        {isPt ? (
          <Field label={copy.zoneLabel} htmlFor="boat-zone">
            <select
              id="boat-zone"
              value={draft.boatIdentity.navigationZoneType ?? ""}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  boatIdentity: {
                    ...d.boatIdentity,
                    navigationZoneType: e.target.value
                      ? (Number(e.target.value) as 1 | 2 | 3 | 4 | 5)
                      : null,
                  },
                }))
              }
              className="field"
            >
              <option value="">{t.enquiry.select}</option>
              {NAVIGATION_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {isPt && draft.boatIdentity.name ? (
        <p className="tabular mt-3 text-xs text-ink-muted">
          {buildPtIdentificationSet(
            draft.boatIdentity.name,
            draft.boatIdentity.registrationNumber || draft.boatIdentity.name
          )}
        </p>
      ) : null}
    </>
  );
}
