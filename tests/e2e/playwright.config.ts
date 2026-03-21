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
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },

    { name: "mobile-safari", use: { ...devices["iPhone 15"] } },
    { name: "mobile-chrome", use: { ...devices["Galaxy S24"] } },

    { name: "tablet", use: { ...devices["iPad Pro 11"] } },
  ],
});
