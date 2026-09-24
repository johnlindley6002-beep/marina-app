"use client";

import { useEffect, useRef, useState } from "react";
import { inputToMetres, metresToInput } from "../../lib/units";
import { useUnits } from "./UnitsProvider";

type Props = {
  // Always metres, as a string, the same shape the rest of the app stores.
  valueM: string;
  onChangeM: (metres: string) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  invalid?: boolean;
  describedBy?: string;
};

export default function LengthInput({
  valueM,
  onChangeM,
  className,
  placeholder,
  ariaLabel,
  invalid,
  describedBy,
}: Props) {
  const { units } = useUnits();
  const [text, setText] = useState(() => metresToInput(valueM, units));
  const synced = useRef({ m: valueM, u: units });

  // Re-derive the visible text only when the value changed from outside
  // (saved boat, storage load) or the unit changed, not while typing.
  useEffect(() => {
    if (synced.current.m !== valueM || synced.current.u !== units) {
      setText(metresToInput(valueM, units));
      synced.current = { m: valueM, u: units };
    }
  }, [valueM, units]);

  return (
    <input
      type="number"
      min="0"
      step="0.1"
      value={text}
      placeholder={placeholder}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={className}
      onChange={(e) => {
        const next = e.target.value;
        const metres = inputToMetres(next, units);
        setText(next);
        synced.current = { m: metres, u: units };
        onChangeM(metres);
      }}
    />
  );
}
