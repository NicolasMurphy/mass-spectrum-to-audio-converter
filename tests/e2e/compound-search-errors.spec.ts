import { test, expect } from "./fixtures";

test.describe("Compound Search Errors", () => {
  test("handles invalid compound searches", async ({
    page,
    compoundInput,
    generateButton,
  }) => {
    // blank search does not generate
    await generateButton.click();
    await expect(page.getByText("No spectrum data yet")).toBeVisible();

    // empty space search displays expected error message
    await compoundInput.click();
    await compoundInput.fill(" ");
    await generateButton.click();
    await expect(
      page.getByText("Please enter a compound name.")
    ).toBeVisible();

    // invalid search displays expected error message
    await compoundInput.click();
    await compoundInput.fill("invalid");
    await generateButton.click();
    await expect(page.getByText("Error: No records found")).toBeVisible();
  });
});
