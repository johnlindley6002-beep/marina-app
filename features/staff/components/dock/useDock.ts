"use client";

import { getPrimaryMarina } from "@/data/marinas";
import { addDaysIso } from "@/lib/dates";
import { listJobs, teamDirectory, useStaffData, type DockJob, type TeamPerson } from "@/lib/data";
import { lisbonToIso } from "../../lib/format";
import { useStaffSession } from "../StaffSessionProvider";

const NO_JOBS: DockJob[] = [];
const NO_PEOPLE: TeamPerson[] = [];

// The signed-in member: their marina, member id and what they may do.
export function useStaffContext() {
  const { session } = useStaffSession();
  return {
    marinaId: session?.marinaIds[0] ?? getPrimaryMarina().id,
    memberId: session?.memberId ?? null,
    role: session?.role ?? null,
    capabilities: session?.capabilities ?? [],
    displayName: session?.displayName ?? "",
  };
}

// The Lisbon day's bounds as moments.
export function dayBounds(day: string): { from: string; to: string } {
  return { from: lisbonToIso(day, "00:00"), to: lisbonToIso(addDaysIso(day, 1), "00:00") };
}

// Jobs due on a Lisbon day. Re-read on every change (live updates call it too).
export function useDayJobs(day: string): { jobs: DockJob[]; ready: boolean } {
  const { from, to } = dayBounds(day);
  const { value, ready } = useStaffData(
    async () => (await listJobs(from, to)) ?? NO_JOBS,
    NO_JOBS,
    day
  );
  return { jobs: value, ready };
}

export function useTeam(marinaId: string): TeamPerson[] {
  return useStaffData(() => teamDirectory(marinaId), NO_PEOPLE, marinaId).value;
}

// "Rui, Ana" for the members on a job; unnamed members keep a placeholder.
export function namesOf(ids: string[], team: TeamPerson[], unnamed: string): string[] {
  return ids.map((id) => team.find((p) => p.id === id)?.name || unnamed);
}
