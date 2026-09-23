"use client";

import { useEffect, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import {
  loadBoatProfile,
  loadBoats,
  type SavedBoat,
} from "../../../../lib/boatProfile";

const inputClass =
  "mt-2 w-full border border-neutral-200 px-3 py-2 text-sm text-navy focus:border-navy/40 focus:outline-none";
const labelClass = "text-xs font-normal tracking-wide text-navy/60 uppercase";

type Props = { marina: Marina; selectedBerthId?: string | null };

const dash = (value: string) => (value.trim() ? value : "—");

export default function ArrivalActions({ marina, selectedBerthId }: Props) {
  const [boat, setBoat] = useState<Omit<SavedBoat, "id">>({
    name: "",
    type: "",
    loa: "",
    beam: "",
    draft: "",
    flag: "",
    homePort: "",
  });
  const [eta, setEta] = useState("");

  useEffect(() => {
    const store = loadBoats();
    const active = store.boats.find((b) => b.id === store.activeId);
    if (active) {
      setBoat(active);
      return;
    }
    const profile = loadBoatProfile();
    setBoat((b) => ({ ...b, ...profile }));
  }, []);

  function openMail(subject: string, lines: string[]) {
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  function boatLines(): string[] {
    return [
      `Boat: ${dash(boat.name)}${boat.type ? ` (${boat.type})` : ""}`,
      `Length overall: ${dash(boat.loa)} m`,
      `Beam: ${dash(boat.beam)} m`,
      `Draft: ${dash(boat.draft)} m`,
      `Flag: ${dash(boat.flag)}`,
      `Home port: ${dash(boat.homePort)}`,
      `Berth: ${selectedBerthId ?? "not yet assigned"}`,
    ];
  }

  function arrivingNow() {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    openMail(`Arriving now — ${boat.name.trim() || "visiting vessel"}`, [
      `ARRIVING NOW — ${marina.name.toUpperCase()}`,
      "",
      `ETA: now (sent at ${now} local time)`,
      ...boatLines(),
      "Skipper phone: (please add)",
      "",
      marina.outsideHoursInstructions,
    ]);
  }

  function digitalCheckIn() {
    openMail(`Digital check-in — ${boat.name.trim() || "visiting vessel"}`, [
      `DIGITAL CHECK-IN — ${marina.name.toUpperCase()}`,
      "",
      `ETA: ${eta || "(to confirm)"}`,
      ...boatLines(),
      "",
      "SKIPPER",
      "Full name: (please add)",
      "Phone: (please add)",
      "People on board: (please add)",
      "",
      "CREW LIST (one per line)",
      "1. Full name — date of birth — nationality — passport number — role",
      "",
      "I will bring boat registration, third-party insurance certificate and the skipper's certificate of competence.",
    ]);
  }

  return (
    <div className="mt-10 border-t border-neutral-200 pt-8">
      <p className="text-xs font-normal tracking-wide text-navy/40 uppercase">
        Arriving soon?
      </p>
      <p className="mt-2 text-sm font-light text-neutral-500">
        Both buttons open a pre-filled email to {marina.name} using your saved
        boat and any berth you selected. Nothing is sent until you press send.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <button
          type="button"
          onClick={arrivingNow}
          className="bg-navy px-6 py-3 text-sm font-normal tracking-wide text-white hover:bg-navy-accent"
        >
          I&apos;m arriving now
        </button>
        <label className="block text-sm">
          <span className={labelClass}>ETA for check-in (optional)</span>
          <input
            type="time"
            value={eta}
            onChange={(e) => setEta(e.target.value)}
            className={`${inputClass} max-w-[160px]`}
          />
        </label>
        <button
          type="button"
          onClick={digitalCheckIn}
          className="border border-navy/30 px-6 py-3 text-sm font-normal tracking-wide text-navy hover:border-navy"
        >
          Digital check-in
        </button>
      </div>
    </div>
  );
}
