import { test, expect, type Page } from "@playwright/test";
import { waitForGenerate } from "./test-helpers";

test.describe("Algorithm Switching", () => {
  let linearRadio: ReturnType<Page["getByRole"]>;
  let inverseRadio: ReturnType<Page["getByRole"]>;
  let moduloRadio: ReturnType<Page["getByRole"]>;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
    linearRadio = page.getByRole("radio", { name: "Linear: mz + offset" });
    inverseRadio = page.getByRole("radio", {
      name: "Inverse: scale / (mz + shift)",
    });
    moduloRadio = page.getByRole("radio", {
      name: "Modulo: ((mz * factor) % modulus) + base",
    });
  });

  test("user can switch between algorithms and get different results", async ({
    page,
  }: {
    page: Page;
  }) => {
    // search for biotin (default linear) (clicking on most generated tag), search with enter key, verify first hz value
    await page.getByText("BIOTIN").first().click();
    await waitForGenerate(page, () => page.locator("body").press("Enter"));
    await expect(page.getByRole("cell", { name: "355.0534" })).toBeVisible();

    // switch to inverse, verify first hz value
    await inverseRadio.check();
    await waitForGenerate(page, () => inverseRadio.press("Enter"));
    await expect(page.getByRole("cell", { name: "406.3458" })).toBeVisible();

    // switch to modulo, verify first hz value
    await moduloRadio.check();
    await waitForGenerate(page, () => moduloRadio.press("Enter"));
    await expect(page.getByRole("cell", { name: "100.1820" })).toBeVisible();
  });
});
