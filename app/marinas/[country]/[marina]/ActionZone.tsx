"use client";

import type { Marina } from "../../../../data/marinas";
import type { StayPlan } from "../../../../lib/stayPlan";
import ArrivalActions from "./ArrivalActions";
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
  return (
    <section className="section px-5 md:px-8">
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

        <div className="hairline-top mt-10 pt-6">
          <a
            href="#contact-details"
            className="inline-flex min-h-11 items-center text-ink underline underline-offset-4 hover:text-ink-2"
          >
            General question? See the contact details
          </a>
        </div>
      </div>
    </section>
  );
}
