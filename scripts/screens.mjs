// Captures every route at 375, 768 and 1280 wide into docs/audit/screens/<label>.
// Usage: node scripts/screens.mjs <label> [baseUrl]
// Needs a running server (npm run dev) with dev tools on so the owner and staff
// pages can be reached by signing in as a sample persona.
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";

const label = process.argv[2] ?? "after";
const base = process.argv[3] ?? "http://localhost:3000";
const out = `docs/audit/screens/${label}`;
mkdirSync(out, { recursive: true });

const sizes = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1280", width: 1280, height: 800 },
];

const routes = [
  { name: "home", path: "/" },
  { name: "marinas", path: "/marinas" },
  { name: "marinas-portugal", path: "/marinas/portugal" },
  { name: "marina-cascais", path: "/marinas/portugal/cascais" },
  { name: "pre-arrival", path: "/marinas/portugal/cascais/pre-arrival" },
  { name: "account", path: "/account", user: "u-voyager" },
  { name: "my-boat", path: "/my-boat", user: "u-voyager" },
  { name: "owner", path: "/owner", user: "u-owner" },
  { name: "owner-relet", path: "/owner/relet", user: "u-owner" },
  { name: "reletting-terms", path: "/legal/reletting-terms" },
  { name: "staff", path: "/staff", user: "u-staff" },
  { name: "staff-arrivals", path: "/staff/arrivals", user: "u-staff" },
  { name: "staff-berths", path: "/staff/berths", user: "u-staff" },
  { name: "staff-checkin", path: "/staff/checkin", user: "u-staff" },
  { name: "staff-enquiries", path: "/staff/enquiries", user: "u-staff" },
  { name: "staff-records", path: "/staff/records", user: "u-staff" },
  { name: "staff-reletting", path: "/staff/reletting", user: "u-staff" },
];

const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const size of sizes) {
    for (const route of routes) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        reducedMotion: "reduce",
      });
      if (route.user) {
        await context.addInitScript((id) => {
          window.localStorage.setItem("aldock-mock-session", JSON.stringify({ userId: id }));
        }, route.user);
      }
      const page = await context.newPage();
      await page.goto(base + route.path, { waitUntil: "networkidle" });
      // Deferred sections skip painting off screen; show them for the full-page shot.
      await page.addStyleTag({
        content: ".defer-paint { content-visibility: visible !important; }",
      });
      // Scroll through once so lazy images load.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 600) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 40));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
      );
      await page.screenshot({ path: `${out}/${route.name}-${size.name}.png`, fullPage: true });
      console.log(`${route.name} @${size.name}${overflow ? "  HORIZONTAL OVERFLOW" : ""}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
