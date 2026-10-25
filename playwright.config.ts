import { defineConfig } from "@playwright/test";

const PORT = 3100;

// Locally this drives the Edge that is already installed; in CI it uses the
// Chromium that `npx playwright install --with-deps chromium` provides.
const channel = process.env.CI ? undefined : "msedge";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, channel, trace: "retain-on-failure" },
  projects: [
    {
      name: "mobile",
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
    { name: "desktop", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: {
    // The dev tools flag lets the scenario page and persona switcher exist in
    // the production build the tests run against.
    command: `npx next build && npx next start -p ${PORT}`,
    env: { NEXT_PUBLIC_ENABLE_DEV_TOOLS: "1" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
