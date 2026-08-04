import { defineConfig, devices } from "@playwright/test";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "5173";
const playwrightBaseUrl = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  // Wandering encounters mean a scripted walk now fights its way through, so a path that
  // used to be pure movement can include several rounds of combat playback.
  timeout: 90_000,
  // A browser walk over authored floors is inherently timing/RNG-sensitive: a wandering
  // encounter can miss, a view can paint a frame late. On CI, retry so an occasional flake
  // does not red the whole gate — a genuinely broken spec still fails all three attempts.
  // (`trace: "on-first-retry"` below already assumes this.)
  retries: process.env.CI ? 2 : 0,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: playwrightBaseUrl,
    trace: "on-first-retry"
  },
  webServer: {
    command: `npm run dev -- --port ${playwrightPort}`,
    url: playwrightBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
