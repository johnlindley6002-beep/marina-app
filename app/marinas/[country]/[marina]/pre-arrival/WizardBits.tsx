"use client";

import type { ReactNode } from "react";

// A calm, non-blocking information panel, shown only when the situation it
// describes actually applies (an outside-Schengen leg, a non-EU flag, and so
// on). Never an error: it always uses the same quiet ink treatment, whatever
// it says, so the wizard never looks alarming.
export function InfoPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 max-w-xl border-l-2 border-ink/30 py-1 pl-4">
      <p className="font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-ink/75">{children}</p>
    </div>
  );
}

// A softer variant for a warning that still never blocks anything: same
// shape as InfoPanel, but the accent line is the error colour so it reads as
// worth a look without shouting.
export function WarningPanel({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 max-w-xl border-l-2 border-error/60 py-1 pl-4">
      <p className="text-sm text-ink/80">{children}</p>
    </div>
  );
}

export type PersonStatus = "complete" | "missing" | "check-dates";

export function StatusPill({
  status,
  labels,
}: {
  status: PersonStatus;
  labels: Record<PersonStatus, string>;
}) {
  const cls =
    status === "complete"
      ? "border-ink bg-ink text-paper"
      : status === "missing"
        ? "border-error/50 text-error"
        : "border-ink/40 text-ink/75";
  return (
    <span className={`chip ${cls}`}>{labels[status]}</span>
  );
}

// A field with a label and an error line, matching every other form in the
// app (field / field-label / field-error), so the wizard's inputs look and
// behave exactly like the enquiry form, the boat editor and the rest.
export function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-sm">
      <span className="field-label">
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </span>
      {children}
      {error ? (
        <p id={`${htmlFor}-err`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </label>
  );
}
