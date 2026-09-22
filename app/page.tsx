import Image from "next/image";
import Link from "next/link";

function ChevronIcon() {
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
      <path d="M7.5 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const exploreCards = [
  {
    title: "Marinas",
    description: "Browse marinas by country and find your next berth.",
    href: "/marinas",
  },
  {
    title: "About us",
    description: "What aldock is, and why we're building it.",
    href: "/#about",
  },
  {
    title: "Contact",
    description: "Questions about bookings or partnerships? Reach out.",
    href: "/#contact",
  },
];

export default function Home() {
  return (
    <main>
      <section className="bg-navy px-6 py-20 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-[clamp(3rem,10vw,6rem)] font-light lowercase leading-none tracking-[0.06em] text-white">
            aldock
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base font-light tracking-wide text-white/60 md:mt-8 md:text-lg">
            Marina bookings, simplified.
          </p>
          <Link
            href="/marinas"
            className="mt-10 inline-block bg-navy-accent px-8 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75] md:mt-12"
          >
            Explore marinas
          </Link>
        </div>
      </section>

      <section
        id="about"
        className="defer-paint scroll-mt-28 bg-white px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
            About us
          </p>
          <h2 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
            A marina experience, reimagined
          </h2>
          <p className="mt-8 text-base leading-relaxed font-light text-neutral-500 md:text-lg">
            aldock brings clarity to marina management — from berth
            reservations to guest communications. We believe booking a slip
            should feel as calm as a morning on the water.
          </p>
        </div>
      </section>

      <section
        id="explore"
        className="defer-paint scroll-mt-28 bg-neutral-50 px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
              Explore
            </p>
            <h2 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
              Find your way around
            </h2>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            {exploreCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group relative block aspect-[4/5] overflow-hidden rounded-sm"
              >
                <Image
                  src="/images/card-placeholder.svg"
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  aria-hidden
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <p className="text-sm font-light text-white/70">
                    {card.description}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-lg font-normal text-white">
                    {card.title}
                    <ChevronIcon />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="defer-paint scroll-mt-28 bg-navy px-6 py-24 md:py-32"
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-normal tracking-[0.25em] text-white/40 uppercase">
            Contact
          </p>
          <h2 className="mt-4 text-3xl font-normal tracking-tight text-white md:text-4xl">
            Get in touch
          </h2>
          <p className="mt-8 text-base font-light leading-relaxed text-white/60">
            Questions about berths, bookings, or partnerships? We&apos;d love
            to hear from you.
          </p>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-12">
            <a
              href="mailto:hello@aldock.com"
              className="text-sm font-normal tracking-wide text-white/80 hover:text-white"
            >
              hello@aldock.com
            </a>
            <span className="hidden h-4 w-px bg-white/20 sm:block" />
            <a
              href="tel:+15551234567"
              className="text-sm font-normal tracking-wide text-white/80 hover:text-white"
            >
              +1 (555) 123-4567
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
