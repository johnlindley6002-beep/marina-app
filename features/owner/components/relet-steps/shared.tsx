import { siteConfig } from "@/data/site";

export const copy = siteConfig.relet;
export const inputClass = "field";
export const labelClass = "field-label";
export const errorClass = "field-error";

export function Check({
  checked,
  onChange,
  children,
  invalid,
  describedBy,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: React.ReactNode;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="mt-1"
      />
      <span>{children}</span>
    </label>
  );
}
