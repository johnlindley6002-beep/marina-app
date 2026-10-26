import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

// A form field: label above the control, an optional required mark, and an
// error line announced as an alert. htmlFor must match the control's id. When
// the field has an error, the control is marked invalid and points at the
// message with aria-describedby (the message id is `${htmlFor}-err`). The
// error sits outside the label so the control's name stays just the label.
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
  const control =
    error && isValidElement(children) && typeof children.type === "string"
      ? cloneElement(children as ReactElement<Record<string, unknown>>, {
          "aria-invalid": true,
          "aria-describedby": `${htmlFor}-err`,
        })
      : children;

  return (
    <div className="text-sm">
      <label htmlFor={htmlFor} className="block">
        <span className="field-label">
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </span>
        {control}
      </label>
      {error ? (
        <p id={`${htmlFor}-err`} role="alert" className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
