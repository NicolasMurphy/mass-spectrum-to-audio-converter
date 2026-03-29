import { test as base, expect, type Locator } from "@playwright/test";

export const test = base.extend<{
  appReady: void;
  compoundInput: Locator;
  generateButton: Locator;
}>({
  appReady: [
    async ({ page }, use) => {
      await page.goto("/");
      await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
      await use();
    },
    { auto: true },
  ],

  compoundInput: async ({ page }, use) => {
    await use(page.getByRole("textbox", { name: "Compound Name" }));
  },

  generateButton: async ({ page }, use) => {
    await use(page.getByRole("button", { name: "Generate Audio" }));
  },
});

export { expect };
