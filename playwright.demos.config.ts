import { defineConfig } from "@playwright/test";

/**
 * Playwright config for demo recordings.
 */
export default defineConfig({
  testDir: "./demos/generated",
  testMatch: "**/*.spec.ts",

  // Run serially so videos don't interfere
  workers: 1,
  fullyParallel: false,

  // No retries for demos — we want a clean single take
  retries: 0,

  // Long timeout — demos include deliberate pauses and visible typing.
  // Increase for longer demos (e.g. 2_700_000 for ~45 min full-platform demos).
  timeout: 300_000,

  reporter: [["list"]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
  },

  webServer: {
    command: "npx serve app -l 3000",
    port: 3000,
    reuseExistingServer: true,
  },
});
