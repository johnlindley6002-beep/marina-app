"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AccountMenu from "./AccountMenu";
import { useAuth } from "./AuthProvider";
import LanguageSelect from "./LanguageSelect";
import ModeSwitch from "./ModeSwitch";
import { useLanguage } from "./LanguageProvider";
import UnitSegmented from "./UnitSegmented";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { user, mode } = useAuth();

  // Owner mode has its own navigation, the way a host mode does elsewhere.
  const ownerMode = !!user && mode === "owner";
  const links = ownerMode
    ? [{ href: "/owner", label: "My berth" }]
    : [
        { href: "/marinas", label: t.nav.marinas },
        { href: "/my-boat", label: t.nav.myBoat },
        { href: "/#about", label: t.nav.aboutUs },
        { href: "/#contact", label: t.nav.contact },
      ];

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-paper/10 bg-ink text-paper">
      <div className="page-column flex h-16 items-center gap-10">
        <Link href="/" onClick={closeMenu} aria-label="aldock" className="flex min-h-11 items-center">
          <Image
            src="/images/aldock-wordmark.png"
            alt="aldock"
            width={407}
            height={108}
            loading="eager"
            className="h-5 w-auto"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-medium text-stone transition-colors hover:text-paper"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="hidden lg:block">
            <ModeSwitch />
          </div>
          <UnitSegmented />
          <LanguageSelect />
          <AccountMenu />
        </div>

        <button
          type="button"
          aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="ml-auto flex h-11 w-11 items-center justify-center md:hidden"
        >
          <span className="flex w-5 flex-col gap-1.5" aria-hidden="true">
            <span
              className={`block h-px w-full bg-paper transition-transform duration-200 ${
                menuOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`block h-px w-full bg-paper transition-opacity duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block h-px w-full bg-paper transition-transform duration-200 ${
                menuOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen ? (
        <div className="border-t border-paper/10 md:hidden">
          <div className="page-column py-8">
          <nav className="flex flex-col gap-6" aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="type-heading flex min-h-11 items-center text-2xl text-paper"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <UnitSegmented />
            <LanguageSelect />
          </div>
          <AccountMenu variant="inline" onNavigate={closeMenu} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
