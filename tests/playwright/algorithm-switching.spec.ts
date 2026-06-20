import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Algorithm Switching", () => {
  test("user can switch between algorithms and get different results", async ({
    page,
  }) => {
    const inverseRadio = page.getByRole("radio", {
      name: "Inverse: scale / (mz + shift)",
    });
    const moduloRadio = page.getByRole("radio", {
      name: "Modulo: ((mz * factor) % modulus) + base",
    });

    await page.getByText("Choline").first().click();
    await waitForGenerate(page, () => page.locator("body").press("Enter"));
    await expect(page.getByRole("cell", { name: "404.1000" })).toBeVisible();

    await inverseRadio.check();
    await waitForGenerate(page, () => inverseRadio.press("Enter"));
    await expect(page.getByRole("cell", { name: "951.4748" })).toBeVisible();

    await moduloRadio.check();
    await waitForGenerate(page, () => moduloRadio.press("Enter"));
    await expect(page.getByRole("cell", { name: "141.0000" })).toBeVisible();
  });
});
