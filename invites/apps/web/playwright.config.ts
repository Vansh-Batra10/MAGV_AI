import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 90_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: process.env.BASE_URL ?? "http://localhost:3000", trace: "off" },
  projects: [{ name: "mobile-chromium", use: { ...devices["Pixel 7"] } }],
  webServer: {
    command: process.env.CI ? "pnpm start" : "pnpm dev",
    url: "http://localhost:3000/dev/playground",
    reuseExistingServer: true,
    timeout: 180_000,
    env: { DATA_FILE: ".data/e2e-db.json", ENABLE_PLAYGROUND: "true" },
  },
});
