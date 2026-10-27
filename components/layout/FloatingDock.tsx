"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/data/site";
import { DEV_TOOLS_ENABLED } from "@/lib/devTools";
import DevPersonaSwitcher from "@/features/dev/components/DevPersonaSwitcher";
import ModeSwitch from "@/components/ui/ModeSwitch";
import { useAuth } from "@/components/providers/AuthProvider";

// The floating pills in the bottom-left corner: the dev "Mock" pill (only while
// dev tools are on) and, to its right, the Guest / Berth holder switch (only for
// a signed-in user with a linked berth). In production the switch is alone.
// While any pill shows, the page gets bottom space (see data-dock in
// globals.css) so nothing is covered, and on the pre-arrival page the pills sit
// above the fixed summary bar on phones.
export default function FloatingDock() {
  const { ready, user, canSwitchMode } = useAuth();
  const pathname = usePathname();
  const devPill = DEV_TOOLS_ENABLED && siteConfig.mockMode;
  const modePill = ready && !!user && canSwitchMode;
  const visible = devPill || modePill;

  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.setAttribute("data-dock", devPill && modePill ? "both" : "one");
    else root.removeAttribute("data-dock");
    return () => root.removeAttribute("data-dock");
  }, [visible, devPill, modePill]);

  if (!visible) return null;

  const aboveBar = pathname.endsWith("/pre-arrival");

  return (
    <div
      className={`on-ink fixed left-3 z-[60] flex max-w-[calc(100vw-1.5rem)] flex-wrap items-end gap-2 text-sm ${
        aboveBar
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))] lg:bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
          : "bottom-[max(0.75rem,env(safe-area-inset-bottom))]"
      }`}
    >
      <DevPersonaSwitcher />
      <ModeSwitch />
    </div>
  );
}
