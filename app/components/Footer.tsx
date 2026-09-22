"use client";

import Image from "next/image";
import { marinas } from "../../data/marinas";
import { useLanguage } from "./LanguageProvider";

function InstagramIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8" cy="8.5" r="0.75" fill="currentColor" stroke="none" />
      <path d="M8 11v6M12 17v-3.5c0-1.4 1-2.5 2.25-2.5S16.5 12.1 16.5 13.5V17" />
    </svg>
  );
}

export default function Footer() {
  const marina = marinas[0];
  const { t } = useLanguage();

  const companyLinks = [
    { href: "/#about", label: t.footer.aboutUs },
    { href: "/#contact", label: t.footer.contact },
  ];
  const productLinks = [{ href: "/marinas", label: t.footer.marinas }];

  return (
    <footer className="bg-navy text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3 md:px-8">
        <div>
          <Image
            src="/images/aldock-logo.png"
            alt="aldock"
            width={407}
            height={108}
            className="h-5 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm font-light leading-relaxed text-white/60">
            {t.footer.tagline}
          </p>
          <div className="mt-6 flex items-center gap-4 text-white/60">
            <a href="#" aria-label="Instagram" className="hover:text-white">
              <InstagramIcon />
            </a>
            <a href="#" aria-label="LinkedIn" className="hover:text-white">
              <LinkedInIcon />
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs font-normal tracking-[0.25em] text-white/40 uppercase">
            {t.footer.company}
          </p>
          <ul className="mt-4 space-y-3">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-light text-white/70 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-normal tracking-[0.25em] text-white/40 uppercase">
            {t.footer.product}
          </p>
          <ul className="mt-4 space-y-3">
            {productLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-light text-white/70 hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs font-normal tracking-[0.25em] text-white/40 uppercase">
            {t.footer.contact}
          </p>
          {marina ? (
            <div className="mt-4 space-y-1 text-sm font-light text-white/70">
              <p>{marina.address}</p>
              <a
                href={`tel:${marina.phone.replace(/\s+/g, "")}`}
                className="block hover:text-white"
              >
                {marina.phone}
              </a>
              <a
                href={`mailto:${marina.email}`}
                className="block hover:text-white"
              >
                {marina.email}
              </a>
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 md:px-8">
        <p className="mx-auto max-w-6xl text-xs font-light text-white/40">
          {t.footer.copyright(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
