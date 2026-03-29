import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  workers: 1,
  retries: 1,
  // Default 5s is too tight for API calls (audio generation) on slower browser
  // engines. 10s gives webkit/mobile headroom without masking real failures.
  expect: { timeout: 10000 },
  use: {
    baseURL: "http://localhost:5173",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  outputDir: "test-results/",
  reporter: [["list"], ["html", { outputFolder: "playwright-report" }]],

  projects: [
    { name: "chromium", testIgnore: "api*.spec.ts", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", testIgnore: "api*.spec.ts", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", testIgnore: "api*.spec.ts", use: { ...devices["Desktop Safari"] } },

    { name: "mobile-safari", testIgnore: "api*.spec.ts", use: { ...devices["iPhone 15"] } },
    { name: "mobile-chrome", testIgnore: "api*.spec.ts", use: { ...devices["Galaxy S24"] } },

    { name: "tablet", testIgnore: "api*.spec.ts", use: { ...devices["iPad Pro 11"] } },

    { name: "api", testMatch: "api*.spec.ts", use: { baseURL: "http://localhost:5001" } },
  ],
});
