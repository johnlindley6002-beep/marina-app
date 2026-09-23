"use client";

import { useEffect, useState } from "react";
import type { Marina } from "../../../../data/marinas";
import { loadBoats } from "../../../../lib/boatProfile";
import type { StayPlan } from "../../../../lib/stayPlan";

type Props = {
  marina: Marina;
  plan: StayPlan;
  selectedBerthId?: string | null;
};

const dash = (value: string) => (value.trim() ? value : "—");

export default function ArrivalActions({ marina, plan, selectedBerthId }: Props) {
  const [boatName, setBoatName] = useState("");
  const [boatType, setBoatType] = useState("");
  const [flag, setFlag] = useState("");
  const [homePort, setHomePort] = useState("");

  useEffect(() => {
    const store = loadBoats();
    const active = store.boats.find((b) => b.id === store.activeId);
    if (active) {
      setBoatName(active.name);
      setBoatType(active.type);
      setFlag(active.flag);
      setHomePort(active.homePort);
    }
  }, []);

  function openMail(subject: string, lines: string[]) {
    window.location.href = `mailto:${marina.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(lines.join("\n"))}`;
  }

  function boatLines(): string[] {
    return [
      `Boat: ${dash(boatName)}${boatType ? ` (${boatType})` : ""}`,
      `Length overall: ${dash(plan.loa)} m`,
      `Beam: ${dash(plan.beam)} m`,
      `Draft: ${dash(plan.draft)} m`,
      `Flag: ${dash(flag)}`,
      `Home port: ${dash(homePort)}`,
      `Berth: ${selectedBerthId ?? "not yet assigned"}`,
    ];
  }

  function arrivingNow() {
    const now = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    openMail(`Arriving now — ${boatName.trim() || "visiting vessel"}`, [
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
    openMail(`Digital check-in — ${boatName.trim() || "visiting vessel"}`, [
      `DIGITAL CHECK-IN — ${marina.name.toUpperCase()}`,
      "",
      `Arrival: ${plan.arrival || "(to confirm)"}`,
      `ETA: ${plan.eta || "(to confirm)"}`,
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
      <h3 className="text-sm font-normal text-navy">Arriving today?</h3>
      <p className="mt-2 text-sm font-light text-neutral-600">
        Both open a pre-filled email to {marina.name} with your boat, plan and
        selected berth. Digital check-in uses the ETA from the enquiry form
        above. Nothing is sent until you press send.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={arrivingNow}
          className="border border-navy/30 px-6 py-3 text-sm font-normal tracking-wide text-navy hover:border-navy"
        >
          I&apos;m arriving now
        </button>
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
