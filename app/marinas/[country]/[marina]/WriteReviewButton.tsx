"use client";

import {
  REVIEW_CATEGORY_LABELS,
  type Marina,
  type ReviewCategory,
} from "../../../../data/marinas";

type Props = {
  marina: Marina;
  label?: string;
  intro?: string;
};

// Reviews can't be published without a backend, so this is honest about
// what it does: it emails the marina a review; nothing appears on the page.
export default function WriteReviewButton({
  marina,
  label = "Write a review",
  intro,
}: Props) {
  function openMail() {
    const categories = Object.keys(REVIEW_CATEGORY_LABELS) as ReviewCategory[];
    const body = [
      `REVIEW - ${marina.name.toUpperCase()}`,
      "",
      "Overall rating (1–5): ",
      ...categories.map((c) => `${REVIEW_CATEGORY_LABELS[c]} (1–5): `),
      "",
      "Your review:",
      "",
      "",
      "Boat name (optional): ",
      "Date of stay (optional): ",
    ].join("\n");
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      `Review - ${marina.name}`
    )}&body=${encodeURIComponent(body)}`;
  }

  return (
    <div>
      {intro ? (
        <p className="mb-3 text-sm text-ink/75">{intro}</p>
      ) : null}
      <button
        type="button"
        onClick={openMail}
        className="border border-ink/30 px-6 py-3 text-sm font-medium text-ink hover:border-ink"
      >
        {label}
      </button>
      <p className="mt-2 text-xs text-ink/70">
        Opens an email to the marina. Reviews are not published on this page
        automatically.
      </p>
    </div>
  );
}
