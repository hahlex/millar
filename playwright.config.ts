import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    channel: "chrome",
    trace: "off",
  },
  webServer: {
    command: "node e2e/serve-portal.mjs",
    url: "http://127.0.0.1:4173/millar/",
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
});
