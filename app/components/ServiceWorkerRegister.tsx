"use client";

import { useEffect } from "react";

// Production only: a service worker in dev would fight hot reloading.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is an enhancement; the site works without it.
    });
  }, []);
  return null;
}
