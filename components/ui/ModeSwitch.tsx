"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Mode } from "@/lib/data";
import { useLanguage } from "@/components/providers/LanguageProvider";
import SegmentedControl from "./SegmentedControl";

// The Guest / Berth holder switch, drawn as a pill. It renders only for a
// signed-in user who has at least one linked berth (the berth holder role), so
// a plain guest never sees it. It lives in the floating dock, not the header.
export default function ModeSwitch() {
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
  }

  return (
    <SegmentedControl
      label={t.chrome.mode.label}
      options={options}
      value={mode}
      onChange={choose}
      tone="pill"
    />
  );
}
