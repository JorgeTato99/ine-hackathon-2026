import { defineConfig, devices } from "@playwright/test";
import { workersFor } from "./scripts/execution-profile.ts";

const externalUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalUrl ?? "http://127.0.0.1:4173";
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: "./playwright-tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: workersFor("e2e"),
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    testIdAttribute: "data-pw",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],
  ...(externalUrl
    ? {}
    : {
        webServer: {
          command: "npm run serve",
          url: baseURL,
          reuseExistingServer: false,
          timeout: 60_000,
        },
      }),
});
