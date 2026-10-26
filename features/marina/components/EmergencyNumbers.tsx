"use client";

import type { Marina } from "@/data/marinas";
import { useLanguage } from "@/components/providers/LanguageProvider";

export const telHref = (number: string) => `tel:${number.replace(/[^\d+]/g, "")}`;

export default function EmergencyNumbers({
  marina,
  embedded = false,
}: {
  marina: Marina;
  embedded?: boolean;
}) {
  const { t } = useLanguage();
  const { phones, vhf } = marina.emergency;
  const body = (
    <>
      <h3 className="type-heading type-h3 text-ink">{t.marinaPage.emergency.heading}</h3>
      <div className="mt-6 grid gap-8 sm:grid-cols-2">
        <ul className="space-y-3">
          {phones.map((phone) => (
            <li
              key={phone.label}
              className="flex items-baseline justify-between gap-4 border-b border-hairline pb-3 text-sm"
            >
              <span className="text-ink-soft">{phone.label}</span>
              <a
                href={telHref(phone.number)}
                className="inline-flex min-h-11 items-center font-medium text-ink underline underline-offset-4"
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
              <span className="text-ink-soft">{channel.label}</span>
              <span className="font-medium text-ink">
                {t.marinaPage.emergency.vhfChannel(channel.channel)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="stack-lg">
        <hr className="mb-10 border-hairline" />
        {body}
      </div>
    );
  }
  return (
    <section className="section">
      <div className="page-column">{body}</div>
    </section>
  );
}
