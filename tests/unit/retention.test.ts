import { describe, expect, it } from "vitest";
import { pruneCheckIns } from "@/features/prearrival/lib/retention";
import { validDraft } from "../helpers/drafts";

const leaving = (day: string) => {
  const base = validDraft();
  return { draft: { ...base, voyage: { ...base.voyage, departureDateTime: `${day}T10:00` } } };
};

describe("pruning old check-ins", () => {
  const today = "2026-09-01";

  it("keeps a stay that ended 30 days ago and drops one that ended 31 days ago", () => {
    expect(pruneCheckIns([leaving("2026-08-02")], today)).toHaveLength(1);
    expect(pruneCheckIns([leaving("2026-08-01")], today)).toHaveLength(0);
  });

  it("keeps a stay that has not ended", () => {
    expect(pruneCheckIns([leaving("2026-09-10")], today)).toHaveLength(1);
  });

  it("keeps a check-in with no departure date", () => {
    const base = validDraft();
    const open = {
      draft: {
        ...base,
        voyage: { ...base.voyage, departureDateTime: "" },
        stay: { ...base.stay, requestedDeparture: "" },
      },
    };
    expect(pruneCheckIns([open], today)).toHaveLength(1);
  });
});
