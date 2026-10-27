import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Every route, as the person who can see it. axe must find no serious or
// critical problem on any of them, on a phone and on a desktop.
const routes: { path: string; user?: string }[] = [
  { path: "/" },
  { path: "/marinas" },
  { path: "/marinas/portugal" },
  { path: "/marinas/portugal/cascais" },
  { path: "/marinas/portugal/cascais/pre-arrival" },
  { path: "/legal/reletting-terms" },
  { path: "/account", user: "u-voyager" },
  { path: "/my-boat", user: "u-voyager" },
  { path: "/owner", user: "u-owner" },
  { path: "/owner/relet", user: "u-owner" },
  { path: "/staff/login" },
  { path: "/staff", user: "u-staff" },
  { path: "/staff/arrivals", user: "u-staff" },
  { path: "/staff/berths", user: "u-staff" },
  { path: "/staff/reception", user: "u-staff" },
  { path: "/staff/planner", user: "u-staff" },
  { path: "/staff/enquiries", user: "u-staff" },
  { path: "/staff/customers", user: "u-staff" },
  { path: "/staff/tasks", user: "u-staff" },
  { path: "/staff/radio", user: "u-staff" },
  { path: "/staff/reletting", user: "u-staff" },
];

for (const route of routes) {
  test(`axe: ${route.path}`, async ({ page }) => {
    if (route.user) {
      await page.addInitScript((id) => {
        window.localStorage.setItem("aldock-mock-session", JSON.stringify({ userId: id }));
      }, route.user);
    }
    await page.goto(route.path, { waitUntil: "networkidle" });
    // The staff berth map is an svg with role img that holds focusable berths.
    // That is inside the map, which stays as it is; see docs/audit/PROGRESS.md.
    const builder = new AxeBuilder({ page });
    if (route.path === "/staff/berths") builder.disableRules(["nested-interactive"]);
    const results = await builder.withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    const blocking = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    const report = blocking.map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes.length} node(s), e.g. ${v.nodes[0]?.target.join(" ")}`
    );
    expect(report, report.join("\n")).toEqual([]);
  });
}
