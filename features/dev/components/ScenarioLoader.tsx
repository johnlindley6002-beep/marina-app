"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { savePreArrivalDraft } from "@/lib/data";
import {
  DRAFT_SCENARIOS,
  seedHolderAwayReletTenNights,
  seedHolderReturnsEarlyWhileLet,
} from "@/features/prearrival/lib/seedScenarios";

// Test harness for the edge-case scenarios: loads one in a click instead of
// retyping the wizard by hand. Reached only through /dev/prearrival-scenarios,
// which exists only when dev tools are enabled (see lib/devTools.ts).
export default function ScenarioLoader() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  function loadDraft(key: string) {
    const scenario = DRAFT_SCENARIOS.find((s) => s.key === key);
    if (!scenario) return;
    savePreArrivalDraft("cascais", scenario.build());
    router.push("/marinas/portugal/cascais/pre-arrival");
  }

  function runReletScenario(kind: "away-relet" | "early-return") {
    const result =
      kind === "away-relet" ? seedHolderAwayReletTenNights() : seedHolderReturnsEarlyWhileLet();
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
        <p className="measure mt-4 text-ink-soft">
          Dev only. Loads a scenario into the mock data layer, the same as if a guest or berth
          holder had entered it by hand.
        </p>

        <section className="chapter">
          <h2 className="type-heading type-h2 text-ink">Wizard drafts</h2>
          <p className="mt-1 text-sm text-ink-muted">
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
          <p className="mt-1 text-sm text-ink-muted">
            Creates and, where relevant, approves a reletting request for the seed berth
            holder&apos;s berth (G-14).
          </p>
          <ul className="mt-4 space-y-2">
            <li>
              <button
                type="button"
                onClick={() => runReletScenario("away-relet")}
                className="btn-secondary"
              >
                7. Berth holder away 3 weeks in August, relet 10 nights
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => runReletScenario("early-return")}
                className="btn-secondary"
              >
                8. Berth holder returns early while berth is let
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
