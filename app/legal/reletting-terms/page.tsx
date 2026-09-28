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
    <div className="section">
      <div className="page-column page-reading">
        <h1 className="type-title text-ink">
          Reletting terms
        </h1>
        <p className="measure mt-6 text-lg text-ink/75">
          The full terms for reletting a berth are provided by the marina. This
          is a placeholder page for the mockup, and it contains no legal text.
        </p>
        <Link
          href="/owner"
          className="mt-8 btn-quiet"
        >
          Back to My berth
        </Link>
      </div>
    </div>
  );
}
