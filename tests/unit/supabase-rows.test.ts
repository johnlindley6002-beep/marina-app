import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { getAllBerths } from "@/data/berths";
import { decideEnquiry, seedEnquiry, type EnquiryStore } from "@/data/mock/enquiries";
import { buildSeedRelettingStore } from "@/data/mock/reletting";
import { runOnSnapshot, type StaffSnapshot } from "@/data/mock/snapshot";
import {
  enquiryFromRow,
  enquiryToRow,
  indexBerths,
  metresFromColumn,
  metresToColumn,
  outOfServiceFromRow,
  reletFromRow,
  reletToRow,
  timeFromColumn,
  timeToColumn,
} from "@/data/supabase/rows";
import { buildSeedSql } from "@/data/supabase/seedSql";

const P2 = "11111111-1111-4111-8111-111111111111";
const G14 = "22222222-2222-4222-8222-222222222222";
const index = indexBerths([
  { id: P2, code: "P-2" },
  { id: G14, code: "G-14" },
]);

describe("column conversions", () => {
  it("stores lengths as numbers and reads them back as the app's strings", () => {
    expect(metresToColumn("9.2")).toBe(9.2);
    expect(metresToColumn("")).toBeNull();
    expect(metresToColumn("about nine")).toBeNull();
    // Postgres numeric can arrive as a string with trailing zeros.
    expect(metresFromColumn("9.20")).toBe("9.2");
    expect(metresFromColumn(13.5)).toBe("13.5");
    expect(metresFromColumn(null)).toBe("");
    // "9.0" comes back as "9": the same length, written without the zero.
    expect(metresFromColumn(metresToColumn("9.0"))).toBe("9");
  });

  it("stores times as hours and minutes", () => {
    expect(timeToColumn("11:00")).toBe("11:00");
    expect(timeToColumn("")).toBeNull();
    expect(timeFromColumn("11:00:00")).toBe("11:00");
    expect(timeFromColumn(null)).toBe("");
  });
});

describe("arrivals", () => {
  const enquiry = seedEnquiry({
    id: "a1",
    status: "approved",
    assignedBerthId: "P-2",
    arrival: "2026-11-02",
    departure: "2026-11-05",
    loa: "9.2",
    beam: "3.2",
    draft: "1.6",
    boatName: "Kestrel",
    flagNote: "needs a tow",
  });

  it("points the assigned berth at its database id", () => {
    const row = enquiryToRow(enquiry, index);
    expect(row.berth_id).toBe(P2);
    expect(row.expected_arrival).toBe("2026-11-02");
    expect(row.length_m).toBe(9.2);
    expect(row.flag_note).toBe("needs a tow");
  });

  it("reads back exactly what was written", () => {
    expect(enquiryFromRow(enquiryToRow(enquiry, index), index)).toEqual(enquiry);
  });

  it("keeps an open-ended stay without a departure", () => {
    const open = { ...enquiry, openEnded: true, departure: "" };
    const row = enquiryToRow(open, index);
    expect(row.departure).toBeNull();
    expect(enquiryFromRow(row, index).departure).toBe("");
  });

  it("refuses a berth the database does not have", () => {
    expect(() => enquiryToRow({ ...enquiry, assignedBerthId: "Z-99" }, index)).toThrow(
      "Berth Z-99 is not in the database."
    );
  });
});

describe("relet offers", () => {
  const request = buildSeedRelettingStore().requests[0]!;

  it("stores money in whole cents and reads it back in euros", () => {
    const row = reletToRow({ ...request, grossEur: 73.4, netEur: 32.67 }, index, "Jordan Reyes");
    // 73.40 EUR is 7340 cents, 32.67 EUR is 3267 cents
    expect(row.gross_cents).toBe(7340);
    expect(row.net_cents).toBe(3267);
    expect(row.berth_id).toBe(G14);
    expect(row.berth_holder).toBe("Jordan Reyes");
    expect(row.berth_holder_ref).toBe("u-owner");
  });

  it("reads back exactly what was written", () => {
    expect(reletFromRow(reletToRow(request, index, "Jordan Reyes"), index)).toEqual(request);
  });
});

describe("out of service", () => {
  it("only an out-of-service berth makes a mark", () => {
    const row = {
      id: P2,
      marina_id: "cascais",
      code: "P-2",
      status_reason: "pontoon repair",
      status_set_at: "2026-10-27T10:00:00.000Z",
    };
    expect(outOfServiceFromRow({ ...row, status: "in_service" })).toBeNull();
    expect(outOfServiceFromRow({ ...row, status: "out_of_service" })).toEqual({
      berthId: "P-2",
      marinaId: "cascais",
      reason: "pontoon repair",
      setAt: "2026-10-27T10:00:00.000Z",
    });
  });
});

describe("staff rules on loaded data", () => {
  const store = (): EnquiryStore => ({
    enquiries: [seedEnquiry({ id: "e1", status: "new", arrival: "2026-11-02" })],
  });
  const snapshot = (marinaIds: string[]): StaffSnapshot => ({
    enquiries: store(),
    relet: { requests: [], notifications: [] },
    oos: { marks: [] },
    staffMarinaIds: marinaIds,
  });

  beforeEach(() => window.localStorage.clear());

  it("staff of the marina can decide, and only the loaded data changes", () => {
    const loaded = snapshot(["cascais"]);
    const result = runOnSnapshot(loaded, () =>
      decideEnquiry("any-supabase-user", "e1", "decline", { reason: "Full" })
    );
    expect(result.ok).toBe(true);
    expect(loaded.enquiries.enquiries[0]!.status).toBe("declined");
    expect(loaded.enquiries.enquiries[0]!.decisionNote).toBe("Full");
    expect(window.localStorage.length).toBe(0);
  });

  it("someone who is not staff of the marina cannot", () => {
    const loaded = snapshot([]);
    const result = runOnSnapshot(loaded, () => decideEnquiry("any-supabase-user", "e1", "decline"));
    expect(result).toEqual({ ok: false, error: "Only staff of this marina can decide." });
    expect(loaded.enquiries.enquiries[0]!.status).toBe("new");
  });
});

describe("the seed", () => {
  const sql = buildSeedSql();

  it("matches supabase/seed.sql (run npm run db:seed:build after changing the data)", () => {
    const file = readFileSync(resolve(__dirname, "../../supabase/seed.sql"), "utf8");
    expect(file).toBe(sql);
  });

  it("holds every berth on the map exactly once", () => {
    for (const berth of getAllBerths()) {
      const line = `('cascais', '${berth.id}', '${berth.pontoonId}', '${berth.sizeClass}',`;
      expect(sql.split(line).length - 1).toBe(1);
    }
  });
});
