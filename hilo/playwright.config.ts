import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "off",
    launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] },
  },
  projects: [
    { name: "mobile", use: { ...devices["Pixel 7"], permissions: ["camera", "microphone"] } },
  ],
  webServer: {
    // Production server (Turbopack dev HMR restarts pages under mobile emulation). Run `npm run build` first.
    command: `rm -rf node_modules/.cache/hilo-e2e && HILO_OPEN_TOOLS=1 HILO_DATA_DIR=node_modules/.cache/hilo-e2e npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
