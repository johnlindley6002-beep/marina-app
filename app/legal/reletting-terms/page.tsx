import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";

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
        <PageHeader title="Reletting terms">
          The full terms for reletting a berth are provided by the marina. This is a placeholder
          page for the mockup, and it contains no legal text.
        </PageHeader>
        <Link href="/owner" className="btn-quiet mt-8">
          Back to My berth
        </Link>
      </div>
    </div>
  );
}
