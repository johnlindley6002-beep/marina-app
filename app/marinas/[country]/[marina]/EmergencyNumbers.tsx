import type { Marina } from "../../../../data/marinas";

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

export default function EmergencyNumbers({ marina }: { marina: Marina }) {
  const { phones, vhf } = marina.emergency;
  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-normal tracking-[0.25em] text-navy/60 uppercase">
          Emergency &amp; key numbers
        </p>
        <div className="mt-6 grid gap-8 sm:grid-cols-2">
          <ul className="space-y-3">
            {phones.map((phone) => (
              <li
                key={phone.label}
                className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-3 text-sm"
              >
                <span className="font-light text-neutral-600">
                  {phone.label}
                </span>
                <a
                  href={telHref(phone.number)}
                  className="font-normal text-navy underline underline-offset-4"
                >
                  {phone.number}
                </a>
              </li>
            ))}
          </ul>
          <ul className="space-y-3">
            {vhf.map((channel) => (
              <li
                key={channel.channel}
                className="flex items-baseline justify-between gap-4 border-b border-neutral-100 pb-3 text-sm"
              >
                <span className="font-light text-neutral-600">
                  {channel.label}
                </span>
                <span className="font-normal text-navy">
                  VHF channel {channel.channel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
