import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

/**
 * End-to-end tests against a production build (`npm run build` first) and a
 * local Supabase (`npx supabase start`). See e2e/README.md.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start --port ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
