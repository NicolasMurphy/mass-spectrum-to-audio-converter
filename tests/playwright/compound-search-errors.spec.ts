import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Compound Search Errors", () => {
  test("handles invalid compound searches", async ({
    page,
    compoundInput,
    generateButton,
  }) => {
    // blank search does not generate
    await generateButton.click();
    await expect(page.getByText("No spectrum data yet")).toBeVisible();

    await compoundInput.click();
    await compoundInput.fill(" ");
    await expect(compoundInput).toHaveValue(" ");
    await generateButton.click();
    await expect(
      page.getByText("Please enter a compound name.")
    ).toBeVisible();

    await compoundInput.click();
    await compoundInput.fill("invalid");
    await expect(compoundInput).toHaveValue("invalid");
    await generateButton.click();
    await expect(page.getByText("Error: No records found")).toBeVisible();
  });

  test("clears previous spectrum when replacement search fails", async ({
    page,
    compoundInput,
    generateButton,
  }) => {
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");
    await waitForGenerate(page, () => generateButton.click());

    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();

    await compoundInput.click();
    await compoundInput.press("ControlOrMeta+A");
    await compoundInput.pressSequentially("invalid");
    await expect(compoundInput).toHaveValue("invalid");
    await generateButton.click();

    await expect(page.getByText("Error: No records found")).toBeVisible();
    await expect(page.getByText("No spectrum data yet")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).not.toBeVisible();
  });
});
