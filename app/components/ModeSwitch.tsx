"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Mode } from "../../lib/mockData";

const OPTIONS: { value: Mode; label: string }[] = [
  { value: "guest", label: "Guest" },
  { value: "owner", label: "Owner" },
];

// The Guest / Owner switch. It renders only for a user who holds the owner
// role, so a plain voyager never sees it.
export default function ModeSwitch({
  className = "",
  tone = "dark",
  onSwitched,
}: {
  className?: string;
  tone?: "dark" | "light";
  onSwitched?: () => void;
}) {
  const { canSwitchMode, mode, setMode } = useAuth();
  const router = useRouter();

  if (!canSwitchMode) return null;

  function choose(next: Mode) {
    if (next === mode) return;
    if (!setMode(next)) return;
    router.push(next === "owner" ? "/owner" : "/");
    onSwitched?.();
  }

  return (
    <div
      role="group"
      aria-label="Mode"
      className={`inline-flex rounded-full border p-0.5 text-sm ${
        tone === "light" ? "border-ink/30" : "border-stone/40"
      } ${className}`}
    >
      {OPTIONS.map((option) => {
        const active = mode === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => choose(option.value)}
            className={`min-h-11 rounded-full px-4 transition-colors md:min-h-9 ${
              active
                ? "bg-brass font-medium text-ink"
                : tone === "light"
                  ? "text-ink/75 hover:text-ink"
                  : "text-stone hover:text-paper"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
