"use client";

import { useState } from "react";
import type { Marina } from "../../../../data/marinas";
import type { StayPlan } from "../../../../lib/stayPlan";
import ArrivalActions from "./ArrivalActions";
import { ContactList } from "./ContactDock";
import RequestBerthForm from "./RequestBerthForm";

type Props = {
  marina: Marina;
  plan: StayPlan;
  onPlanChange: (patch: Partial<StayPlan>) => void;
  selectedBerthId: string | null;
  rebookToken: number;
};

export default function ActionZone({
  marina,
  plan,
  onPlanChange,
  selectedBerthId,
  rebookToken,
}: Props) {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-5xl">
        <RequestBerthForm
          marina={marina}
          plan={plan}
          onPlanChange={onPlanChange}
          selectedBerthId={selectedBerthId}
          rebookToken={rebookToken}
        />

        <ArrivalActions
          marina={marina}
          plan={plan}
          selectedBerthId={selectedBerthId}
        />

        <div className="mt-10 border-t border-neutral-200 pt-8">
          <button
            type="button"
            aria-expanded={contactOpen}
            aria-controls="general-contact"
            onClick={() => setContactOpen((v) => !v)}
            className="text-sm font-normal text-navy underline underline-offset-4 hover:text-navy-accent"
          >
            General question? Contact the marina
          </button>
          {contactOpen ? (
            <div
              id="general-contact"
              className="mt-4 max-w-sm border border-neutral-200 bg-white"
            >
              <ContactList marina={marina} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
