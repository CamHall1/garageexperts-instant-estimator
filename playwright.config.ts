import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // WebKit's macOS build is frozen on older host OS versions (as on the
    // machine this project was built on), which makes the `iPhone 13`
    // WebKit device fail to even launch a page. Mobile Chrome emulation
    // gives real mobile-viewport + touch coverage without that dependency;
    // run WebKit locally too (`npx playwright test --project=mobile-safari`
    // after adding a `devices["iPhone 13"]` project) on a host with a
    // current macOS/Safari before shipping a change that touches iOS-
    // specific behavior.
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
