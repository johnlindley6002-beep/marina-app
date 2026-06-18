import dynamic from "next/dynamic";
import Image from "next/image";

const Navbar = dynamic(() => import("./components/Navbar"));

const facilities = [
  {
    title: "Berths & Moorings",
    description: "Secure slips and moorings for vessels of all sizes.",
    icon: "/images/berth.svg",
  },
  {
    title: "Fuel & Provisions",
    description: "On-site fuel dock and essential supplies for your voyage.",
    icon: "/images/fuel.svg",
  },
  {
    title: "Showers & Laundry",
    description: "Clean, modern facilities for you and your crew.",
    icon: "/images/shower.svg",
  },
  {
    title: "Secure Storage",
    description: "Locked storage for gear, equipment, and seasonal items.",
    icon: "/images/storage.svg",
  },
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="bg-navy px-6 py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-[clamp(3rem,10vw,6rem)] font-light lowercase leading-none tracking-[0.06em] text-white">
              aldock
            </h1>
            <p className="mx-auto mt-6 max-w-md text-base font-light tracking-wide text-white/60 md:mt-8 md:text-lg">
              Marina bookings, simplified.
            </p>
            <a
              href="#marinas"
              className="mt-10 inline-block bg-navy-accent px-8 py-3 text-sm font-normal tracking-wide text-white hover:bg-[#254a75] md:mt-12"
            >
              Explore marinas
            </a>
          </div>
        </section>

        <section
          id="marinas"
          className="defer-paint scroll-mt-28 bg-neutral-50 px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
                Marinas
              </p>
              <h2 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
                Everything you need
              </h2>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:gap-8">
              {facilities.map((facility) => (
                <div
                  key={facility.title}
                  className="rounded-sm border border-neutral-200/80 bg-white p-8 md:p-10"
                >
                  <Image
                    src={facility.icon}
                    alt=""
                    width={40}
                    height={40}
                    sizes="40px"
                    loading="lazy"
                    fetchPriority="low"
                    className="opacity-70"
                    aria-hidden
                  />
                  <h3 className="mt-4 text-lg font-normal tracking-tight text-navy">
                    {facility.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed font-light text-neutral-500">
                    {facility.description}
                  </p>
                </div>
              ))}
            </div>
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
              aldock brings clarity to marina management — from berth reservations
              to guest communications. We believe booking a slip should feel as
              calm as a morning on the water.
            </p>
          </div>
        </section>

        <section
          id="location"
          className="defer-paint scroll-mt-28 bg-white px-6 py-24 md:py-32"
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-xs font-normal tracking-[0.25em] text-navy/40 uppercase">
                Location
              </p>
              <h2 className="mt-4 text-3xl font-normal tracking-tight text-navy md:text-4xl">
                Find us on the waterfront
              </h2>
              <p className="mx-auto mt-6 max-w-lg text-base font-light text-neutral-500">
                Harbour Lane, Marina District
              </p>
            </div>

            <div className="relative mt-12 aspect-[16/9] max-h-[420px] overflow-hidden rounded-sm border border-neutral-200 md:mt-16">
              <Image
                src="/images/map-placeholder.svg"
                alt="Map placeholder for Harbour Lane, Marina District"
                fill
                sizes="(max-width: 768px) 100vw, 1024px"
                loading="lazy"
                fetchPriority="low"
                className="object-cover"
              />
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
    </>
  );
}
