import { expect, test, type Page } from "@playwright/test";

// The main journeys, on a phone and on a desktop. The mock data lives in
// localStorage, so each test starts from the seed data and signs in by writing
// the session the dev switcher would write.
async function signInAs(page: Page, userId: string) {
  await page.addInitScript((id) => {
    // Only the first page load signs in, so a test can switch person later.
    if (!window.localStorage.getItem("aldock-mock-session")) {
      window.localStorage.setItem("aldock-mock-session", JSON.stringify({ userId: id }));
    }
  }, userId);
}

test("home to Cascais to the start of the pre-arrival check-in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Marina bookings");

  await page.getByRole("link", { name: "Marinas", exact: true }).first().click();
  await expect(page).toHaveURL(/\/marinas$/);
  await page.getByRole("link", { name: "Marina de Cascais" }).first().click();
  await expect(page).toHaveURL(/\/marinas\/portugal\/cascais$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Marina de Cascais");

  // Plan the stay: the estimate appears once the dates and length are in.
  const plan = page.locator("#plan-your-stay");
  const dates = plan.locator('input[type="date"]');
  await dates.nth(0).fill("2027-02-10");
  await dates.nth(1).fill("2027-02-13");
  const sizes = plan.locator('input[type="number"]');
  await sizes.nth(0).fill("9.5");
  await sizes.nth(1).fill("3.5");
  await sizes.nth(2).fill("1.6");
  const estimate = page.locator("#price-estimate");
  // 3 low-season nights of class III (21.50), 64.50 before VAT
  await expect(estimate).toContainText("Class III berth");
  await expect(estimate).toContainText("64.50");

  await page.getByRole("link", { name: "Complete pre-arrival check-in" }).click();
  await expect(page).toHaveURL(/pre-arrival$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Pre-arrival check-in");
  await expect(page.getByText("Step 1 of 6").first()).toBeVisible();
  await expect(page.getByLabel("Boat name")).toBeVisible();
});

test("the language switch changes the page and survives a reload", async ({ page, isMobile }) => {
  test.skip(isMobile, "The language picker is in the open desktop navbar here");
  await page.goto("/");
  await page.getByLabel("Language").selectOption("pt");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Reservas de postos de amarração"
  );
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Reservas de postos de amarração"
  );
  await expect(page.locator("html")).toHaveAttribute("lang", "pt");
});

const SCENARIOS = [
  { label: "1. Solo sailor", people: 1 },
  { label: "2. Twelve people", people: 12 },
  { label: "3. Minor on board", people: 2 },
  { label: "4. Non-EU flagged boat, EU crew", people: null },
  { label: "5. EU boat from Gibraltar, UK skipper", people: null },
  { label: "6. Multihull crossing the season boundary", people: null },
];

for (const scenario of SCENARIOS) {
  test(`scenario "${scenario.label}" loads and reaches the review step`, async ({ page }) => {
    await page.goto("/dev/prearrival-scenarios");
    await page.getByRole("button", { name: scenario.label }).click();
    await expect(page).toHaveURL(/pre-arrival$/);
    await expect(page.getByText("Continuing where you left off.")).toBeVisible();

    await page.goto("/marinas/portugal/cascais/pre-arrival?step=6");
    await expect(page.getByText("Step 6 of 6").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Review and send" })).toBeVisible();
    if (scenario.people !== null) {
      const noun = scenario.people === 1 ? "person" : "people";
      await expect(page.getByText(`${scenario.people} ${noun}`).first()).toBeVisible();
    }
  });
}

test("the staff arrivals board shows the right badges", async ({ page }) => {
  await signInAs(page, "u-staff");
  await page.goto("/staff/arrivals");
  await expect(page.getByRole("heading", { level: 1, name: "Arrivals" })).toBeVisible();
  // Aurora has arrived, Kestrel and Meridian asked for help mooring.
  const board = page.locator("main");
  await expect(board.getByText("Arriving").first()).toBeVisible();
  await expect(board.getByText("Needs mooring help").first()).toBeVisible();
  await expect(board.getByText("On site").first()).toBeVisible();
});

test("an owner's reletting request reaches the staff queue", async ({ page }) => {
  await signInAs(page, "u-owner");
  await page.goto("/owner/relet");

  // 1. Absence
  const start = new Date();
  start.setDate(start.getDate() + 30);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  const dates = page.locator('input[type="date"]');
  await dates.nth(0).fill(iso(start));
  await dates.nth(1).fill(iso(end));
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Continue" }).click();

  // 2. Authorize
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await page.getByRole("switch").click();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();

  // 3. Terms
  await expect(page.getByText("Step 3 of 5")).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Continue" }).click();

  // 4. Readiness
  await expect(page.getByText("Step 4 of 5")).toBeVisible();
  for (const box of await page.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Continue" }).click();

  // 5. Send
  await expect(page.getByText("Step 5 of 5")).toBeVisible();
  await page.getByRole("button", { name: "Send request to the marina" }).click();
  await expect(page.getByText("Pending marina approval")).toBeVisible();

  // The staff member sees it in the queue, with the berth class and holder.
  await page.evaluate(() => {
    window.localStorage.setItem("aldock-mock-session", JSON.stringify({ userId: "u-staff" }));
  });
  await page.goto("/staff/reletting");
  await expect(page.getByRole("heading", { level: 1, name: "Reletting approvals" })).toBeVisible();
  await expect(page.getByText("Berth G-14").first()).toBeVisible();
});
