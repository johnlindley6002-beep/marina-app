"use client";

import type { Marina } from "../../../../data/marinas";
import { useBoats } from "../../../components/BoatProvider";
import type { StayPlan } from "../../../../lib/stayPlan";

type Props = {
  marina: Marina;
  plan: StayPlan;
  selectedBerthId?: string | null;
};

const dash = (value: string) => (value.trim() ? value : "-");

export default function ArrivalActions({ marina, plan, selectedBerthId }: Props) {
  const { activeBoat } = useBoats();
  const boatName = activeBoat?.name ?? "";
  const boatType = activeBoat?.type ?? "";
  const flag = activeBoat?.flag ?? "";
  const homePort = activeBoat?.homePort ?? "";

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
    openMail(`Arriving now - ${boatName.trim() || "visiting vessel"}`, [
      `ARRIVING NOW - ${marina.name.toUpperCase()}`,
      "",
      `ETA: now (sent at ${now} local time)`,
      ...boatLines(),
      "Skipper phone: (please add)",
      "",
      marina.outsideHoursInstructions,
    ]);
  }

  function digitalCheckIn() {
    openMail(`Digital check-in - ${boatName.trim() || "visiting vessel"}`, [
      `DIGITAL CHECK-IN - ${marina.name.toUpperCase()}`,
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
      "1. Full name, date of birth, nationality, passport number, role",
      "",
      "I will bring boat registration, third-party insurance certificate and the skipper's certificate of competence.",
    ]);
  }

  return (
    <div className="mt-10 border-t border-hairline pt-8">
      <h3 className="type-heading type-h3 text-ink">Arriving today?</h3>
      <p className="mt-2 text-sm text-ink/75">
        Each opens a pre-filled email to {marina.name}. Nothing is sent until
        you press send.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={arrivingNow}
          className="btn-secondary"
        >
          I&apos;m arriving now
        </button>
        <button
          type="button"
          onClick={digitalCheckIn}
          className="btn-secondary"
        >
          Digital check-in
        </button>
      </div>
    </div>
  );
}
