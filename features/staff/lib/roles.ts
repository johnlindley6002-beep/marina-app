// The staff roles, their capabilities as the database grants them
// (supabase/migrations/20261030100000_staff_roles.sql), each role's home
// screen and which navigation items a capability opens. The database is what
// enforces access; this only decides what the screens offer.

export type StaffRole = "director" | "dockmaster" | "reception" | "marinheiro" | "night_watch";

export const STAFF_ROLES: StaffRole[] = [
  "director",
  "dockmaster",
  "reception",
  "marinheiro",
  "night_watch",
];

export type Capability =
  | "assign_berths"
  | "confirm_arrivals"
  | "check_in"
  | "approve_relets"
  | "link_berth_holders"
  | "view_customers"
  | "view_documents"
  | "plan_day"
  | "assign_jobs"
  | "claim_jobs"
  | "create_jobs"
  | "manage_shifts"
  | "manage_dock_team"
  | "view_staffing"
  | "radio_log"
  | "incident_report"
  | "late_check_in"
  | "view_own_shifts"
  | "manage_team"
  | "view_audit_log"
  | "view_overview";

export const ALL_CAPABILITIES: Capability[] = [
  "assign_berths",
  "confirm_arrivals",
  "check_in",
  "approve_relets",
  "link_berth_holders",
  "view_customers",
  "view_documents",
  "plan_day",
  "assign_jobs",
  "claim_jobs",
  "create_jobs",
  "manage_shifts",
  "manage_dock_team",
  "view_staffing",
  "radio_log",
  "incident_report",
  "late_check_in",
  "view_own_shifts",
  "manage_team",
  "view_audit_log",
  "view_overview",
];

// Where each role lands after signing in.
export const ROLE_HOME: Record<StaffRole, string> = {
  director: "/staff/overview",
  dockmaster: "/staff/day",
  reception: "/staff/arrivals",
  marinheiro: "/staff/my-job",
  night_watch: "/staff/tonight",
};

export type NavKey =
  | "overview"
  | "day"
  | "arrivals"
  | "reception"
  | "planner"
  | "berths"
  | "enquiries"
  | "reletting"
  | "customers"
  | "tasks"
  | "myJob"
  | "myDay"
  | "myShifts"
  | "tonight"
  | "shifts"
  | "staffing"
  | "radio"
  | "incidents"
  | "team";

// Each navigation item and the capabilities that open it (any one is enough).
export const NAV_ITEMS: { key: NavKey; href: string; needs: Capability[] }[] = [
  { key: "overview", href: "/staff/overview", needs: ["view_overview"] },
  { key: "day", href: "/staff/day", needs: ["plan_day"] },
  { key: "myJob", href: "/staff/my-job", needs: ["claim_jobs"] },
  { key: "myDay", href: "/staff/my-day", needs: ["claim_jobs"] },
  { key: "tonight", href: "/staff/tonight", needs: ["late_check_in"] },
  { key: "arrivals", href: "/staff/arrivals", needs: ["confirm_arrivals"] },
  { key: "reception", href: "/staff/reception", needs: ["check_in"] },
  { key: "planner", href: "/staff/planner", needs: ["assign_berths"] },
  { key: "berths", href: "/staff/berths", needs: ["assign_berths"] },
  { key: "enquiries", href: "/staff/enquiries", needs: ["confirm_arrivals"] },
  { key: "reletting", href: "/staff/reletting", needs: ["approve_relets"] },
  { key: "customers", href: "/staff/customers", needs: ["view_customers"] },
  { key: "tasks", href: "/staff/tasks", needs: ["create_jobs", "plan_day", "assign_jobs"] },
  { key: "shifts", href: "/staff/shifts", needs: ["manage_shifts"] },
  { key: "myShifts", href: "/staff/my-shifts", needs: ["view_own_shifts"] },
  { key: "staffing", href: "/staff/staffing", needs: ["view_staffing"] },
  { key: "radio", href: "/staff/radio", needs: ["radio_log"] },
  { key: "incidents", href: "/staff/incidents", needs: ["incident_report"] },
  { key: "team", href: "/staff/team", needs: ["manage_team", "manage_dock_team"] },
];

export function can(capabilities: readonly string[], needs: readonly Capability[]): boolean {
  return needs.some((c) => capabilities.includes(c));
}

export function navFor(capabilities: readonly string[]) {
  return NAV_ITEMS.filter((item) => can(capabilities, item.needs));
}

// The roles the signed-in person may hand out: a director any, a dockmaster
// the dock team's only. Matches may_manage_role in the database.
export function assignableRoles(capabilities: readonly string[]): StaffRole[] {
  if (capabilities.includes("manage_team")) return STAFF_ROLES;
  if (capabilities.includes("manage_dock_team")) return ["marinheiro", "night_watch"];
  return [];
}
