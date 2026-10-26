// Measures the JavaScript each route loads on first view (gzip, as sent over the
// wire) against a running production server.
// Usage: npx next build && npx next start -p 3100, then
//        node scripts/measure-js.mjs [baseUrl]
import { chromium } from "@playwright/test";

const base = process.argv[2] ?? "http://localhost:3100";
const routes = [
  "/",
  "/marinas",
  "/marinas/portugal",
  "/marinas/portugal/cascais",
  "/marinas/portugal/cascais/pre-arrival",
  "/my-boat",
  "/account",
  "/owner",
  "/staff",
];

const browser = await chromium.launch({ channel: "msedge" });
try {
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    const scripts = new Map();
    cdp.on("Network.responseReceived", (e) => {
      if (e.type === "Script") scripts.set(e.requestId, e.response.url);
    });
    const sizes = new Map();
    cdp.on("Network.loadingFinished", (e) => {
      if (scripts.has(e.requestId)) sizes.set(e.requestId, e.encodedDataLength);
    });
    await page.goto(base + route, { waitUntil: "networkidle" });
    const total = [...sizes.values()].reduce((a, b) => a + b, 0);
    console.log(`${String(Math.round(total / 1024)).padStart(4)} KB  ${route}`);
    await context.close();
  }
} finally {
  await browser.close();
}
