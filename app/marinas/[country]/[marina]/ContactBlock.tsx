import type { Marina } from "../../../../data/marinas";
import { telHref } from "./EmergencyNumbers";

const itemLink =
  "inline-flex min-h-11 items-center text-lg text-ink underline decoration-brass decoration-2 underline-offset-[6px]";

// The one prominent contact block: phone, VHF, email and postal address,
// each reachable in one tap on a phone. All values come from the marina entry.
export default function ContactBlock({ marina }: { marina: Marina }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    marina.address
  )}`;

  return (
    <div id="contact-details" className="hairline-top mt-12 scroll-mt-24 pt-8">
      <h3 className="type-heading type-h3 text-ink">Contact the marina</h3>
      <dl className="mt-6 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-ink/70">Phone</dt>
          <dd className="tabular">
            <a href={telHref(marina.phone)} className={itemLink}>
              {marina.phone}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink/70">VHF</dt>
          <dd className="flex min-h-11 items-center text-lg text-ink">
            Channel {marina.vhfChannel}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink/70">Email</dt>
          <dd>
            <a href={`mailto:${marina.email}`} className={itemLink}>
              {marina.email}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink/70">Postal address</dt>
          <dd className="text-lg text-ink">
            <address className="not-italic">{marina.address}</address>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-11 items-center text-base text-ink underline underline-offset-4"
            >
              Open in maps
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
