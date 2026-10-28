import { describe, expect, it } from "vitest";
import {
  busyHours,
  capacityAt,
  loadBySlot,
  nextJob,
  peopleForLength,
  pontoonDistance,
  slotOf,
  slotState,
  staffingByHour,
  understaffedSoon,
  type Job,
  type Shift,
} from "@/features/staff/lib/jobs";

const job = (over: Partial<Job> & Pick<Job, "id">): Job => ({
  type: "arrival",
  status: "to_do",
  dueAt: "2026-11-02T10:00:00.000Z",
  berthCode: "P-2",
  boatName: "Kestrel",
  lengthM: 9,
  beamM: 3,
  peopleNeeded: 1,
  sortOrder: null,
  doneAt: null,
  members: [],
  ...over,
});

describe("people needed", () => {
  it("follows the length rule", () => {
    expect(peopleForLength(9.2)).toBe(1);
    expect(peopleForLength(11.99)).toBe(1);
    expect(peopleForLength(12)).toBe(2);
    expect(peopleForLength(20)).toBe(2);
    expect(peopleForLength(20.5)).toBe(3);
    expect(peopleForLength(null)).toBe(1);
  });
});

describe("slots and capacity", () => {
  // 2 November 2026: Lisbon is on UTC, so 09:00 there is 09:00Z.
  const shifts: Shift[] = [
    { memberId: "m1", day: "2026-11-02", startsAt: "08:00", endsAt: "16:00" },
    { memberId: "m2", day: "2026-11-02", startsAt: "10:00", endsAt: "18:00" },
    { memberId: "m3", day: "2026-11-02", startsAt: "10:15", endsAt: "14:00" },
  ];

  it("puts a moment in its 30-minute slot", () => {
    expect(slotOf("2026-11-02T10:29:00.000Z")).toBe("2026-11-02T10:00:00.000Z");
    expect(slotOf("2026-11-02T10:30:00.000Z")).toBe("2026-11-02T10:30:00.000Z");
  });

  it("counts marinheiros on shift for the whole slot", () => {
    expect(capacityAt("2026-11-02T09:00:00.000Z", shifts)).toBe(1);
    // m3 starts at 10:15, so the 10:00 slot has only m1 and m2.
    expect(capacityAt("2026-11-02T10:00:00.000Z", shifts)).toBe(2);
    expect(capacityAt("2026-11-02T10:30:00.000Z", shifts)).toBe(3);
    // m1 ends at 16:00: the 15:30 slot still has m1, the 16:00 slot does not.
    expect(capacityAt("2026-11-02T15:30:00.000Z", shifts)).toBe(2);
    expect(capacityAt("2026-11-02T16:00:00.000Z", shifts)).toBe(1);
  });

  it("handles a shift past midnight", () => {
    const night: Shift[] = [
      { memberId: "n1", day: "2026-11-02", startsAt: "22:00", endsAt: "06:00" },
    ];
    expect(capacityAt("2026-11-03T02:00:00.000Z", night)).toBe(1);
    expect(capacityAt("2026-11-03T06:00:00.000Z", night)).toBe(0);
  });

  it("adds up people per slot, counting a 3-person job as 3", () => {
    const load = loadBySlot([
      job({ id: "a", dueAt: "2026-11-02T10:05:00.000Z", peopleNeeded: 3 }),
      job({ id: "b", dueAt: "2026-11-02T10:20:00.000Z", peopleNeeded: 1 }),
      job({ id: "c", dueAt: "2026-11-02T10:40:00.000Z", status: "done", peopleNeeded: 2 }),
    ]);
    expect(load.get("2026-11-02T10:00:00.000Z")).toBe(4);
    expect(load.get("2026-11-02T10:30:00.000Z")).toBeUndefined();
  });

  it("calls a slot full at capacity and over beyond it", () => {
    expect(slotState(0, 0)).toBe("free");
    expect(slotState(1, 2)).toBe("free");
    expect(slotState(2, 2)).toBe("full");
    expect(slotState(3, 2)).toBe("over");
    expect(slotState(1, 0)).toBe("over");
  });
});

describe("staffing by hour", () => {
  it("marks under- and over-staffed hours", () => {
    const shifts: Shift[] = [
      { memberId: "m1", day: "2026-11-02", startsAt: "08:00", endsAt: "12:00" },
      { memberId: "m2", day: "2026-11-02", startsAt: "08:00", endsAt: "12:00" },
      { memberId: "m3", day: "2026-11-02", startsAt: "08:00", endsAt: "10:00" },
    ];
    const jobs = [
      job({ id: "a", dueAt: "2026-11-02T10:10:00.000Z", peopleNeeded: 3 }),
      job({ id: "b", dueAt: "2026-11-02T08:30:00.000Z", peopleNeeded: 1 }),
    ];
    const rows = staffingByHour("2026-11-02", jobs, shifts);
    const at = (h: string) => rows.find((r) => r.hourIso === `2026-11-02T${h}:00:00.000Z`)!;
    // 08:00: 1 needed, 3 on: two spare, over-staffed.
    expect(at("08")).toMatchObject({ needed: 1, onShift: 3, state: "over" });
    // 10:00: 3 needed, 2 on: under-staffed.
    expect(at("10")).toMatchObject({ needed: 3, onShift: 2, state: "under" });
    // 11:00: nothing needed, 2 on: over-staffed.
    expect(at("11")).toMatchObject({ needed: 0, onShift: 2, state: "over" });
    // 12:00: nothing needed, nobody on.
    expect(at("12")).toMatchObject({ needed: 0, onShift: 0, state: "ok" });
  });
});

describe("busy hours over the season", () => {
  it("adds up finished jobs by weekday and Lisbon hour", () => {
    const { grid, max } = busyHours([
      // Monday 2 November, 10:00 Lisbon.
      job({ id: "a", status: "done", dueAt: "2026-11-02T10:05:00.000Z", peopleNeeded: 2 }),
      job({ id: "b", status: "done", dueAt: "2026-11-09T10:40:00.000Z", peopleNeeded: 1 }),
      // Saturday 4 July, 15:00 Lisbon (14:00 UTC in summer).
      job({ id: "c", status: "done", dueAt: "2026-07-04T14:00:00.000Z", peopleNeeded: 1 }),
      job({ id: "d", status: "to_do", dueAt: "2026-11-02T10:05:00.000Z", peopleNeeded: 5 }),
    ]);
    expect(grid[0]![10]).toBe(3);
    expect(grid[5]![15]).toBe(1);
    expect(max).toBe(3);
  });
});

describe("next job", () => {
  it("skips jobs I am on and jobs already fully staffed", () => {
    const jobs = [
      job({ id: "mine", members: ["me"], dueAt: "2026-11-02T09:00:00.000Z" }),
      job({ id: "full", members: ["x"], peopleNeeded: 1, dueAt: "2026-11-02T09:10:00.000Z" }),
      job({ id: "open", dueAt: "2026-11-02T11:00:00.000Z" }),
    ];
    expect(nextJob(jobs, "me", null)?.id).toBe("open");
  });

  it("prefers the nearest pontoon among jobs due close together", () => {
    const jobs = [
      job({ id: "far", berthCode: "A-3", dueAt: "2026-11-02T10:00:00.000Z" }),
      job({ id: "near", berthCode: "G-14", dueAt: "2026-11-02T10:20:00.000Z" }),
      job({ id: "later", berthCode: "G-2", dueAt: "2026-11-02T11:00:00.000Z" }),
    ];
    // Just finished on pontoon G: G-14 is 20 minutes after the earliest, so it wins.
    expect(nextJob(jobs, "me", "G")?.id).toBe("near");
    // With nothing to go by, the earliest.
    expect(nextJob(jobs, "me", null)?.id).toBe("far");
  });

  it("follows the dockmaster's order first", () => {
    const jobs = [
      job({ id: "early", dueAt: "2026-11-02T09:00:00.000Z" }),
      job({ id: "picked", dueAt: "2026-11-02T15:00:00.000Z", sortOrder: 1 }),
    ];
    expect(nextJob(jobs, "me", null)?.id).toBe("picked");
  });

  it("has nothing when every job is taken", () => {
    expect(nextJob([job({ id: "x", status: "done" })], "me", null)).toBeNull();
  });

  it("measures pontoon distance by letter", () => {
    expect(pontoonDistance("G", "G")).toBe(0);
    expect(pontoonDistance("G", "P")).toBe(9);
    expect(pontoonDistance(null, "P")).toBe(99);
  });
});

describe("understaffed soon", () => {
  it("is a job still short of people starting within 30 minutes", () => {
    const now = new Date("2026-11-02T10:00:00.000Z");
    expect(understaffedSoon(job({ id: "a", dueAt: "2026-11-02T10:25:00.000Z" }), now)).toBe(true);
    expect(understaffedSoon(job({ id: "b", dueAt: "2026-11-02T10:45:00.000Z" }), now)).toBe(false);
    expect(
      understaffedSoon(job({ id: "c", dueAt: "2026-11-02T10:25:00.000Z", members: ["x"] }), now)
    ).toBe(false);
  });
});
