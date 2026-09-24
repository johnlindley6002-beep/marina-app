"use client";

import Image from "next/image";
import Link from "next/link";
import { marinas } from "../../data/marinas";
import { useLanguage } from "./LanguageProvider";

export default function Footer() {
  const marina = marinas[0];
  const { t } = useLanguage();

  const links = [
    { href: "/marinas", label: t.footer.marinas },
    { href: "/#about", label: t.footer.aboutUs },
    { href: "/#contact", label: t.footer.contact },
  ];

  return (
    <footer className="bg-ink text-paper">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1.2fr] md:px-8 md:py-20">
        <div>
          <Image
            src="/images/aldock-wordmark.png"
            alt="aldock"
            width={407}
            height={108}
            className="h-5 w-auto"
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-stone">
            {t.footer.tagline}
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-sm font-medium text-paper">{t.footer.product}</p>
          <ul className="mt-4 space-y-3">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-stone transition-colors hover:text-paper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {marina ? (
          <div>
            <p className="text-sm font-medium text-paper">{t.footer.contact}</p>
            <div className="mt-4 space-y-2 text-sm text-stone">
              <p>{marina.address}</p>
              <a
                href={`tel:${marina.phone.replace(/\s+/g, "")}`}
                className="block transition-colors hover:text-paper"
              >
                {marina.phone}
              </a>
              <a
                href={`mailto:${marina.email}`}
                className="block transition-colors hover:text-paper"
              >
                {marina.email}
              </a>
            </div>
          </div>
        ) : null}
      </div>

      <div className="border-t border-paper/10 px-5 py-6 md:px-8">
        <p className="mx-auto max-w-6xl text-xs text-stone">
          {t.footer.copyright(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
