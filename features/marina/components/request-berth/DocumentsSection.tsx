"use client";

import { EMPTY_DOCUMENTS } from "@/features/my-boat/lib/boatProfile";
import BoatSwitcher from "@/features/my-boat/components/BoatSwitcher";
import DocumentWallet from "@/features/marina/components/DocumentWallet";
import { useFormat } from "@/components/providers/useFormat";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { RequestBerthCtx } from "./useRequestBerthForm";

export default function DocumentsSection({ ctx }: { ctx: RequestBerthCtx }) {
  const { docs, form, includeDocs, marina, setDocs, setForm, setIncludeDocs } = ctx;
  const { t } = useLanguage();
  const { moneyCompact } = useFormat();
  return (
    <>
      <fieldset>
        <legend className="type-heading text-xl text-ink">{t.enquiry.documents.legend}</legend>
        <DocumentWallet
          documents={docs}
          onChange={setDocs}
          insuranceMinimumLabel={moneyCompact(marina.insuranceMinimumEur)}
          arrival={form.arrival}
          includeInEnquiry={includeDocs}
          onIncludeChange={setIncludeDocs}
        />
        <BoatSwitcher
          heading={t.enquiry.documents.switcherHeading}
          current={{
            name: form.boatName,
            type: form.vesselType,
            loa: form.loa,
            beam: form.beam,
            draft: form.draft,
            flag: form.flagCountry,
            homePort: form.homePort,
            documents: docs,
          }}
          onSelect={(boat) => {
            setDocs(boat.documents ?? { ...EMPTY_DOCUMENTS });
            setForm((f) => ({
              ...f,
              boatName: boat.name,
              vesselType:
                (["sail", "motor", "catamaran", "other"] as const).find((v) => v === boat.type) ??
                "",
              loa: boat.loa,
              beam: boat.beam,
              draft: boat.draft,
              flagCountry: boat.flag,
              homePort: boat.homePort,
            }));
          }}
        />
      </fieldset>
    </>
  );
}
