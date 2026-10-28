"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { todayIso } from "@/lib/dates";
import {
  markAlertsRead,
  STAFF_DATA_SOURCE,
  subscribeToDock,
  unreadAlerts,
  refreshStaffData,
  useStaffData,
  type StaffAlert,
} from "@/lib/data";
import { understaffedSoon } from "../../lib/jobs";
import { useStaffSession } from "../StaffSessionProvider";
import { useStaffText } from "../StaffLanguageProvider";
import { useDayJobs } from "./useDock";

const NONE: StaffAlert[] = [];

// Shows a notification through the service worker when the person allowed
// it; otherwise the alert stays in the app only.
async function notify(title: string, body: string, url: string) {
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(title, { body, data: { url }, tag: url });
    else new Notification(title, { body });
  } catch {
    // Notifications unavailable: the in-app banner still shows.
  }
}

// Live updates for the dock team: any change to jobs, who is on them or my
// alerts re-reads every staff screen, and a new alert shows as a banner and,
// where allowed, a notification. For those who take jobs, a job that starts
// within 30 minutes and still needs people notifies once.
export default function DockLive() {
  const { session } = useStaffSession();
  const { s } = useStaffText();
  const m = s.myJob;
  const live = STAFF_DATA_SOURCE === "supabase" && session !== null;
  const takesJobs = session?.capabilities.includes("claim_jobs") ?? false;
  const { value: alerts } = useStaffData(
    () => (live ? unreadAlerts() : Promise.resolve(NONE)),
    NONE,
    String(live)
  );
  const seen = useRef(new Set<string>());
  const warned = useRef(new Set<string>());
  const [now, setNow] = useState(() => Date.now());
  const { jobs } = useDayJobs(todayIso());

  useEffect(() => {
    if (!live) return;
    let pending: ReturnType<typeof setTimeout> | null = null;
    const stop = subscribeToDock(() => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        refreshStaffData();
      }, 300);
    });
    const tick = setInterval(() => setNow(Date.now()), 60_000);
    return () => {
      stop();
      clearInterval(tick);
      if (pending) clearTimeout(pending);
    };
  }, [live]);

  useEffect(() => {
    for (const alert of alerts) {
      if (seen.current.has(alert.id)) continue;
      seen.current.add(alert.id);
      void notify(alert.kind === "help" ? m.alertHelp : m.alertAssigned, "", "/staff/my-job");
    }
  }, [alerts, m]);

  useEffect(() => {
    if (!live || !takesJobs) return;
    for (const job of jobs) {
      if (warned.current.has(job.id) || !understaffedSoon(job, new Date(now))) continue;
      warned.current.add(job.id);
      void notify(m.soon, job.boatName, "/staff/my-job");
    }
  }, [jobs, now, live, takesJobs, m]);

  if (!live || alerts.length === 0) return null;
  return (
    <div role="status" className="staff-panel mb-4 border-brass">
      <p className="font-medium text-ink">{m.alerts}</p>
      <ul className="mt-1 text-base text-ink">
        {alerts.slice(0, 5).map((alert) => (
          <li key={alert.id}>
            <Link href="/staff/my-job" className="underline">
              {alert.kind === "help" ? m.alertHelp : m.alertAssigned}
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => void markAlertsRead(alerts.map((a) => a.id))}
        className="staff-btn mt-2 min-h-11"
      >
        {m.dismiss}
      </button>
    </div>
  );
}
