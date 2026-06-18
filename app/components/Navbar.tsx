"use client";

import { useEffect, useState } from "react";

const mainLinks = [
  { href: "#marinas", label: "Marinas" },
  { href: "#about", label: "About us" },
];

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="8.5" cy="8.5" r="5.5" />
      <path d="M13 13l4 4" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-navy text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 md:h-14 md:px-8">
          <a
            href="#"
            onClick={closeMenu}
            className="text-sm font-normal lowercase tracking-[0.15em] text-white md:text-[15px]"
          >
            aldock
          </a>

          <div className="hidden items-center gap-6 text-[13px] font-normal md:flex">
            <a href="#" className="text-white/80 hover:text-white">
              Home
            </a>
            <a href="#contact" className="text-white/80 hover:text-white">
              Contact
            </a>
            <button
              type="button"
              aria-label="Search"
              className="text-white/70 hover:text-white"
            >
              <SearchIcon />
            </button>
            <span className="flex items-center gap-1.5 text-white/50">
              <span className="text-white">EN</span>
              <span>/</span>
              <span>PT</span>
            </span>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center md:hidden"
          >
            <span className="sr-only">Menu</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span
                className={`block h-px w-full bg-white transition-transform duration-200 ${
                  menuOpen ? "translate-y-[7px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-full bg-white transition-opacity duration-200 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`block h-px w-full bg-white transition-transform duration-200 ${
                  menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div className="hidden border-b border-white/10 md:block">
        <nav className="mx-auto flex max-w-6xl gap-10 px-8 py-4">
          {mainLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-lg font-normal tracking-wide text-white/90 hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {menuOpen ? (
        <div className="border-b border-white/10 px-4 py-6 md:hidden">
          <nav className="flex flex-col gap-5">
            {mainLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className="text-lg font-normal text-white/90 hover:text-white"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-white/10" />
            <a
              href="#"
              onClick={closeMenu}
              className="text-sm text-white/80 hover:text-white"
            >
              Home
            </a>
            <a
              href="#contact"
              onClick={closeMenu}
              className="text-sm text-white/80 hover:text-white"
            >
              Contact
            </a>
            <div className="flex items-center gap-4 pt-1">
              <button
                type="button"
                aria-label="Search"
                className="text-white/70 hover:text-white"
              >
                <SearchIcon />
              </button>
              <span className="flex items-center gap-1.5 text-sm text-white/50">
                <span className="text-white">EN</span>
                <span>/</span>
                <span>PT</span>
              </span>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
