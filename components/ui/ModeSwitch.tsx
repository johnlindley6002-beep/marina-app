"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Mode } from "@/lib/data";
import { useLanguage } from "@/components/providers/LanguageProvider";
import SegmentedControl from "./SegmentedControl";

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
  const { t } = useLanguage();
  const options: { value: Mode; label: string }[] = [
    { value: "guest", label: t.chrome.mode.guest },
    { value: "owner", label: t.chrome.mode.owner },
  ];

  if (!canSwitchMode) return null;

  function choose(next: Mode) {
    if (next === mode) return;
    if (!setMode(next)) return;
    router.push(next === "owner" ? "/owner" : "/");
    onSwitched?.();
  }

  return (
    <SegmentedControl
      label={t.chrome.mode.label}
      options={options}
      value={mode}
      onChange={choose}
      className={className}
      tone={tone}
    />
  );
}
