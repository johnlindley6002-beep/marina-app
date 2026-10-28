"use client";

import { useEffect, useRef, useState } from "react";
import { watchArrivals } from "@/lib/data";
import { useStaffText } from "./StaffLanguageProvider";

// Listens for changes to the marina's arrivals and relet offers (Supabase
// Realtime) for as long as a staff member is signed in. Each change refreshes
// every staff screen, so a new request shows up on the arrivals board and in
// Enquiries without a reload. A new request is also announced to screen
// readers; the board marks it with the New badge. Renders nothing visible.
export default function StaffRealtime() {
  const { s } = useStaffText();
  const [announcement, setAnnouncement] = useState("");
  const textRef = useRef(s);

  useEffect(() => {
    textRef.current = s;
  });

  useEffect(() => {
    return watchArrivals((change) => {
      if (change.table === "arrivals" && change.kind === "INSERT") {
        const t = textRef.current;
        setAnnouncement(t.requests.liveAnnounce(change.boatName || t.common.unnamedBoat));
      }
    });
  }, []);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {announcement}
    </p>
  );
}
