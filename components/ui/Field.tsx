import type { ReactNode } from "react";

// A form field: label above the control, an optional required mark, and an
// error line announced as an alert. htmlFor must match the control's id; the
// error gets the id `${htmlFor}-err` so the control can point at it with
// aria-describedby. Every form in the app uses this look (field, field-label,
// field-error).
export default function Field({
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
