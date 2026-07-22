import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Keyboard Navigation", () => {
  test("pressing Enter on the compound name field submits the form", async ({
    page,
    compoundInput,
  }) => {
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");
    await compoundInput.focus();

    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();
  });

  test("pressing Enter while focused on textarea does NOT submit the form", async ({
    page,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    await customTab.click();

    const spectrumTextarea = page.locator("textarea");
    await spectrumTextarea.fill("73.04 100\n150.05 50\n200.1 75");
    await spectrumTextarea.focus();

    await spectrumTextarea.press("Enter");

    await expect(page.getByText("Success!")).not.toBeVisible();

    await expect(spectrumTextarea).toBeFocused();
  });

  test("the Enter key shortcut works end-to-end", async ({
    page,
    compoundInput,
  }) => {
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");

    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    await expect(page.getByText("Success!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audio Transformation Data" })
    ).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();

    await expect(page.getByText("Compound: Caffeine")).toBeVisible();
    await expect(page.getByText(/Accession:/)).toBeVisible();
  });

  test("pressing r with body focus fills a random compound", async ({
    page,
    compoundInput,
  }) => {
    await page.keyboard.press("r");

    await expect(compoundInput).not.toHaveValue("");
  });

  test("typing r in the compound input does NOT trigger a random compound", async ({
    compoundInput,
  }) => {
    await compoundInput.press("r");

    await expect(compoundInput).toHaveValue("r");
  });

  test("pressing ArrowDown then Enter selects a suggestion and submits", async ({
    page,
    compoundInput,
  }) => {
    // type partial compound name to trigger suggestions
    await compoundInput.fill("caff");
    await expect(compoundInput).toHaveValue("caff");

    const suggestionList = page.getByTestId("suggestion-list");
    await expect(suggestionList).toBeVisible();

    await compoundInput.press("ArrowDown");
    await expect(suggestionList.locator("li").first()).toHaveClass(/bg-blue-100/);

    // Enter now selects the highlighted suggestion (calls e.preventDefault, closes list)
    await compoundInput.press("Enter");

    await expect(suggestionList).not.toBeVisible();
    await expect(compoundInput).toHaveValue("Caffearin");

    // press Enter again (global handler) to submit the form
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    await expect(page.getByText("Success!")).toBeVisible();
  });
});
