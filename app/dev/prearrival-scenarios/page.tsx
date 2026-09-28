"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { savePreArrivalDraft } from "../../../lib/mockData";
import {
  DRAFT_SCENARIOS,
  seedHolderAwayReletTenNights,
  seedHolderReturnsEarlyWhileLet,
} from "../../../lib/prearrival/seedScenarios";

// Hidden test harness, not linked from the site's own navigation: loads any
// of the eight edge-case scenarios from the brief in one click, instead of
// retyping the wizard by hand each time. Visit the URL directly to use it.
export default function PreArrivalScenariosPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  function loadDraft(key: string) {
    const scenario = DRAFT_SCENARIOS.find((s) => s.key === key);
    if (!scenario) return;
    savePreArrivalDraft("cascais", scenario.build());
    router.push("/marinas/portugal/cascais/pre-arrival");
  }

  function runReletScenario(kind: "away-relet" | "early-return") {
    const result = kind === "away-relet" ? seedHolderAwayReletTenNights() : seedHolderReturnsEarlyWhileLet();
    setMessage(
      result
        ? `Created reletting request ${result.id}, status ${result.status}. See /owner or /staff/reletting.`
        : "Could not create the scenario, it may already exist for this owner."
    );
  }

  return (
    <div className="section">
      <div className="page-column page-reading">
        <h1 className="type-title text-ink">Pre-arrival test scenarios</h1>
        <p className="measure mt-4 text-ink/75">
          Dev only. Loads a scenario into the mock data layer, the same as if a
          boater or berth holder had entered it by hand.
        </p>

        <section className="chapter">
          <h2 className="type-heading type-h2 text-ink">Wizard drafts</h2>
          <p className="mt-1 text-sm text-ink/70">
            Saves the scenario as the Cascais draft, then opens the wizard on it.
          </p>
          <ul className="mt-4 space-y-2">
            {DRAFT_SCENARIOS.map((s) => (
              <li key={s.key}>
                <button type="button" onClick={() => loadDraft(s.key)} className="btn-secondary">
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="chapter">
          <h2 className="type-heading type-h2 text-ink">Reletting scenarios</h2>
          <p className="mt-1 text-sm text-ink/70">
            Creates and, where relevant, approves a reletting request for the
            seed owner's berth (G-14).
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <button
                type="button"
                onClick={() => runReletScenario("away-relet")}
                className="btn-secondary"
              >
                7. Holder away 3 weeks in August, relet 10 nights
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => runReletScenario("early-return")}
                className="btn-secondary"
              >
                8. Holder returns early while berth is let
              </button>
            </li>
          </ul>
          {message ? (
            <p role="status" className="mt-4 text-sm text-ink">
              {message}
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}
