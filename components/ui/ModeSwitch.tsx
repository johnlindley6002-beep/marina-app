"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Mode } from "@/lib/data";
import SegmentedControl from "./SegmentedControl";

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
    <SegmentedControl
      label="Mode"
      options={OPTIONS}
      value={mode}
      onChange={choose}
      className={className}
      tone={tone}
    />
  );
}
