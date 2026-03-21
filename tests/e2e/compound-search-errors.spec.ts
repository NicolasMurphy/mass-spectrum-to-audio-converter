import { test, expect, type Page } from "@playwright/test";

test.describe("Compound Search Errors", () => {
  let compoundInput: ReturnType<Page["getByRole"]>;
  let generateButton: ReturnType<Page["getByRole"]>;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
    compoundInput = page.getByRole("textbox", { name: "Compound Name" });
    generateButton = page.getByRole("button", { name: "Generate Audio" });
  });

  test("handles invalid compound searches", async ({ page }: { page: Page }) => {
    // blank search does not generate
    await generateButton.click();
  await expect(page.getByText("No spectrum data yet")).toBeVisible();

  // empty space search displays expected error message
  await compoundInput.click();
  await compoundInput.fill(" ");
  await generateButton.click();
  await expect(page.getByText("Please enter a compound name.")).toBeVisible();

  // invalid search displays expected error message
  await compoundInput.click();
  await compoundInput.fill("invalid");
  await generateButton.click();
  await expect(page.getByText("Error: No records found")).toBeVisible();
  });
});
