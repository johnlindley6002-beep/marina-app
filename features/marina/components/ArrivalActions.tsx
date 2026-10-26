"use client";

import Link from "next/link";
import type { Marina } from "@/data/marinas";
import { useBoats } from "@/components/providers/BoatProvider";
import { useLanguage } from "@/components/providers/LanguageProvider";
import type { StayPlan } from "@/features/marina/lib/stayPlan";
import { mailText } from "@/lib/i18n/mail";
import { useFormat } from "@/components/providers/useFormat";

type Props = {
  marina: Marina;
  plan: StayPlan;
  selectedBerthId?: string | null;
};

const dash = (value: string) => (value.trim() ? value : "-");

export default function ArrivalActions({ marina, plan, selectedBerthId }: Props) {
  const { t, locale } = useLanguage();
  const { time } = useFormat();
  const m = mailText(locale);
  const copy = t.stay.arrival;
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
      m.boat.boat(dash(boatName), boatType),
      m.boat.length(dash(plan.loa)),
      m.boat.beam(dash(plan.beam)),
      m.boat.draft(dash(plan.draft)),
      m.boat.flag(dash(flag)),
      m.boat.homePort(dash(homePort)),
      m.boat.berth(selectedBerthId ?? m.boat.berthNotAssigned),
    ];
  }

  function arrivingNow() {
    const a = m.arrivingNow;
    openMail(a.subject(boatName.trim() || a.visitingVessel), [
      a.title(marina.name.toUpperCase()),
      "",
      a.eta(time(new Date())),
      ...boatLines(),
      a.skipperPhone,
      "",
      marina.outsideHoursInstructions,
    ]);
  }

  function digitalCheckIn() {
    const c = m.digitalCheckIn;
    openMail(c.subject(boatName.trim() || m.arrivingNow.visitingVessel), [
      c.title(marina.name.toUpperCase()),
      "",
      c.arrival(plan.arrival || c.toConfirm),
      c.eta(plan.eta || c.toConfirm),
      ...boatLines(),
      "",
      c.skipper,
      c.fullName,
      c.phone,
      c.people,
      "",
      c.crewList,
      c.crewListFormat,
      "",
      c.bring,
    ]);
  }

  return (
    <div className="mt-10 border-t border-hairline pt-8">
      <h3 className="type-heading type-h3 text-ink">{copy.heading}</h3>
      <p className="mt-2 text-sm text-ink-soft">{copy.intro(marina.name)}</p>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button type="button" onClick={arrivingNow} className="btn-secondary">
          {copy.arrivingNow}
        </button>
        <button type="button" onClick={digitalCheckIn} className="btn-secondary">
          {copy.digitalCheckIn}
        </button>
        <Link
          href={`/marinas/${marina.countrySlug}/${marina.id}/pre-arrival`}
          className="btn-primary"
        >
          {t.preArrival.cta.arrivalActions}
        </Link>
      </div>
    </div>
  );
}
