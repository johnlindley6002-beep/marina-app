import type { Marina } from "../../../../data/marinas";

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

export default function EmergencyNumbers({
  marina,
  embedded = false,
}: {
  marina: Marina;
  embedded?: boolean;
}) {
  const { phones, vhf } = marina.emergency;
  const body = (
    <>
      <h3 className="type-heading type-h3 text-ink">
        Emergency &amp; key numbers
      </h3>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <ul className="space-y-3">
          {phones.map((phone) => (
            <li
              key={phone.label}
              className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 text-sm"
            >
              <span className="text-ink/75">{phone.label}</span>
              <a
                href={telHref(phone.number)}
                className="font-medium text-ink underline underline-offset-4"
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
              className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 text-sm"
            >
              <span className="text-ink/75">
                {channel.label}
              </span>
              <span className="font-medium text-ink">
                VHF channel {channel.channel}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (embedded) return <div className="mt-12">{body}</div>;
  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">{body}</div>
    </section>
  );
}
