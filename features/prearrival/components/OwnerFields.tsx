"use client";

import { COUNTRIES } from "@/lib/countries";
import Field from "@/components/ui/Field";
import type { BoatScope } from "./BoatScope";

export default function OwnerFields({ scope }: { scope: BoatScope }) {
  const { draft, setDraft, errors, copy } = scope;
  return (
    <>
      <p className="mt-8 text-sm font-medium text-ink-soft">{copy.ownerHeading}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label={copy.ownerNameLabel}
          htmlFor="owner-name"
          required
          error={errors["owner.fullName"]}
        >
          <input
            id="owner-name"
            type="text"
            value={draft.owner.fullName}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, fullName: e.target.value } }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.ownerIdLabel}
          htmlFor="owner-id"
          required
          error={errors["owner.idDocumentNumber"]}
        >
          <input
            id="owner-id"
            type="text"
            value={draft.owner.idDocumentNumber}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, idDocumentNumber: e.target.value } }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.ownerResidenceLabel}
          htmlFor="owner-residence"
          required
          error={errors["owner.countryOfResidence"]}
        >
          <select
            id="owner-residence"
            value={draft.owner.countryOfResidence}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, countryOfResidence: e.target.value } }))
            }
            className="field"
          >
            <option value="">Select…</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label={copy.ownerTaxNumberLabel} htmlFor="owner-nif">
          <input
            id="owner-nif"
            type="text"
            value={draft.owner.taxNumber}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, taxNumber: e.target.value } }))
            }
            className="field"
          />
        </Field>
        {draft.owner.countryOfResidence && draft.owner.countryOfResidence !== "Portugal" ? (
          <Field
            label={copy.ownerAddressLabel}
            htmlFor="owner-address"
            required
            error={errors["owner.address"]}
          >
            <input
              id="owner-address"
              type="text"
              value={draft.owner.address}
              onChange={(e) =>
                setDraft((d) => ({ ...d, owner: { ...d.owner, address: e.target.value } }))
              }
              className="field"
            />
          </Field>
        ) : null}
        <Field
          label={copy.ownerEmailLabel}
          htmlFor="owner-email"
          required
          error={errors["owner.email"]}
        >
          <input
            id="owner-email"
            type="email"
            value={draft.owner.email}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, email: e.target.value } }))
            }
            className="field"
          />
        </Field>
        <Field
          label={copy.ownerPhoneLabel}
          htmlFor="owner-phone"
          required
          error={errors["owner.phone"]}
        >
          <input
            id="owner-phone"
            type="tel"
            value={draft.owner.phone}
            onChange={(e) =>
              setDraft((d) => ({ ...d, owner: { ...d.owner, phone: e.target.value } }))
            }
            className="field"
          />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={draft.owner.isCompany}
          onChange={(e) =>
            setDraft((d) => ({ ...d, owner: { ...d.owner, isCompany: e.target.checked } }))
          }
        />
        {copy.ownerIsCompanyLabel}
      </label>
      {draft.owner.isCompany ? (
        <div className="mt-3 max-w-xs">
          <Field
            label={copy.ownerCompanyTaxIdLabel}
            htmlFor="owner-nipc"
            required
            error={errors["owner.companyTaxId"]}
          >
            <input
              id="owner-nipc"
              type="text"
              value={draft.owner.companyTaxId}
              onChange={(e) =>
                setDraft((d) => ({ ...d, owner: { ...d.owner, companyTaxId: e.target.value } }))
              }
              className="field"
            />
          </Field>
        </div>
      ) : null}
    </>
  );
}
