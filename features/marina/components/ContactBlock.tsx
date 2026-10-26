"use client";

import type { Marina } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";
import { telHref } from "./EmergencyNumbers";

const itemLink = "btn-quiet text-lg";

// The one prominent contact block: phone, VHF, email and postal address,
// each reachable in one tap on a phone. All values come from the marina entry.
export default function ContactBlock({ marina }: { marina: Marina }) {
  const { t } = useLanguage();
  const copy = t.marinaPage.contact;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    marina.address
  )}`;

  return (
    <div id="contact-details" className="stack-lg scroll-mt-24">
      <hr className="mb-10 border-hairline" />
      <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
      <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink-muted">{t.contact.phone}</dt>
          <dd className="tabular">
            <a href={telHref(marina.phone)} className={itemLink}>
              {marina.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{copy.vhf}</dt>
          <dd className="flex min-h-11 items-center text-lg text-ink">
            {copy.channel(marina.vhfChannel)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{t.contact.email}</dt>
          <dd>
            <a href={`mailto:${marina.email}`} className={itemLink}>
              {marina.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{copy.postal}</dt>
          <dd className="text-lg text-ink">
            <address className="not-italic">{marina.address}</address>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center text-base text-ink underline underline-offset-4"
            >
              {copy.openInMaps}
              <span className="sr-only"> {copy.opensInNewTab}</span>
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
