import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Reletting terms - aldock",
  description: "The terms for reletting a berth while its holder is away.",
};

// PLACEHOLDER. TODO (legal): replace this page with the real terms, supplied by
// the marina and reviewed by counsel. No clauses are invented here.
export default function ReletingTermsPage() {
  return (
    <div className="section px-5 md:px-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="type-display [font-size:clamp(2rem,1.2rem+3vw,3.2rem)] text-ink">
          Reletting terms
        </h1>
        <p className="measure mt-6 text-lg text-ink/75">
          The full terms for reletting a berth are provided by the marina. This
          is a placeholder page for the mockup, and it contains no legal text.
        </p>
        <Link
          href="/owner"
          className="mt-8 inline-flex min-h-11 items-center text-ink underline decoration-current/50 decoration-1 underline-offset-[6px]"
        >
          Back to My berth
        </Link>
      </div>
    </div>
  );
}
