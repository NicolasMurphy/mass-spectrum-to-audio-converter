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
