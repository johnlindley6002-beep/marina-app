import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { marinas } from "@/data/marinas";
import { LanguageProvider, useLanguage } from "@/components/providers/LanguageProvider";
import Field from "@/components/ui/Field";
import ProgressSteps from "@/components/ui/ProgressSteps";
import SegmentedControl from "@/components/ui/SegmentedControl";
import Toggle from "@/components/ui/Toggle";
import StepCrew from "@/features/prearrival/components/StepCrew";
import type { PreArrivalDraft } from "@/features/prearrival/lib/schema";
import { validDraft } from "../helpers/drafts";

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

// The crew step, driven by real state the way the wizard drives it.
function CrewStep({ initial }: { initial: PreArrivalDraft }) {
  const [draft, setDraft] = useState(initial);
  return <StepCrew marina={marinas[0]!} draft={draft} setDraft={setDraft} errors={{}} />;
}

// One expand button per person card.
const personCards = () =>
  document.querySelectorAll('button[aria-expanded][aria-controls^="person-"]');

const renderCrew = (draft: PreArrivalDraft) =>
  render(
    <LanguageProvider>
      <CrewStep initial={draft} />
    </LanguageProvider>
  );

describe("the crew step", () => {
  it("adds and removes person cards with the stepper", () => {
    renderCrew(validDraft());
    expect(personCards()).toHaveLength(1);

    const count = screen.getByLabelText("How many people on board?");
    fireEvent.change(count, { target: { value: "3" } });
    expect(personCards()).toHaveLength(3);

    fireEvent.change(count, { target: { value: "2" } });
    expect(personCards()).toHaveLength(2);
  });

  it("shows the full crew list chip only on a route that crosses an external border", () => {
    const home = validDraft();
    const { unmount } = renderCrew(home);
    expect(screen.queryByText("Full crew list required for this route")).toBeNull();
    unmount();

    renderCrew(
      validDraft({
        voyage: { ...home.voyage, lastPortName: "Gibraltar", lastPortCountry: "Gibraltar" },
      })
    );
    expect(screen.getByText("Full crew list required for this route")).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("keeps the error out of the label and points the control at it", () => {
    render(
      <Field label="Boat name" htmlFor="name" error="Enter the boat's name.">
        <input id="name" />
      </Field>
    );
    const input = screen.getByLabelText("Boat name");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "name-err");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter the boat's name.");
  });

  it("marks nothing invalid when there is no error", () => {
    render(
      <Field label="Boat name" htmlFor="name">
        <input id="name" />
      </Field>
    );
    expect(screen.getByLabelText("Boat name")).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("SegmentedControl", () => {
  it("reports the pressed option and calls back with its value", () => {
    const seen: string[] = [];
    render(
      <SegmentedControl
        label="Units"
        value="metric"
        options={[
          { value: "metric", label: "Metres" },
          { value: "imperial", label: "Feet" },
        ]}
        onChange={(v) => seen.push(v)}
      />
    );
    expect(screen.getByRole("button", { name: "Metres" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Feet" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("button", { name: "Feet" }));
    expect(seen).toEqual(["imperial"]);
  });
});

describe("Toggle and ProgressSteps", () => {
  it("a switch exposes its state and flips on click", () => {
    const seen: boolean[] = [];
    render(
      <>
        <p id="label">Allow reletting</p>
        <Toggle checked={false} onChange={(v) => seen.push(v)} labelledBy="label" />
      </>
    );
    const toggle = screen.getByRole("switch", { name: "Allow reletting" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(seen).toEqual([true]);
  });

  it("announces the step in words", () => {
    render(<ProgressSteps total={5} current={2} label="Step 2 of 5: Authorize" />);
    expect(screen.getByText("Step 2 of 5: Authorize")).toHaveAttribute("aria-live", "polite");
  });
});

function Heading() {
  const { t, locale } = useLanguage();
  return (
    <p>
      {locale}: {t.nav.myBoat}
    </p>
  );
}

describe("language", () => {
  it("starts in English and loads Portuguese from the saved choice", async () => {
    window.localStorage.setItem("aldock-locale", "pt");
    render(
      <LanguageProvider>
        <Heading />
      </LanguageProvider>
    );
    await waitFor(() => expect(screen.getByText("pt: O meu barco")).toBeInTheDocument());
    expect(document.documentElement.lang).toBe("pt");
  });
});
