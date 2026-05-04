import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Keyboard Navigation", () => {
  test("pressing Enter on the compound name field submits the form", async ({
    page,
    compoundInput,
  }) => {
    // focus on compound input and type a compound
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");
    await compoundInput.focus();

    // press Enter
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    // form should be submitted (audio player visible)
    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();
  });

  test("pressing Enter while focused on textarea does NOT submit the form", async ({
    page,
  }) => {
    // switch to custom mode
    const customTab = page.getByRole("button", { name: "Custom" });
    await customTab.click();

    const spectrumTextarea = page.locator("textarea");
    await spectrumTextarea.fill("73.04 100\n150.05 50\n200.1 75");
    await spectrumTextarea.focus();

    // press Enter (should NOT submit since we're in a textarea)
    await spectrumTextarea.press("Enter");

    // form should NOT be submitted
    await expect(page.getByText("Success!")).not.toBeVisible();

    // textarea should still have focus and contain newline
    await expect(spectrumTextarea).toBeFocused();
  });

  test("the Enter key shortcut works end-to-end", async ({
    page,
    compoundInput,
  }) => {
    // fill compound, press Enter, get audio
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");

    // press Enter to submit
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    // success, spectrum data, and audio should be visible
    await expect(page.getByText("Success!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audio Transformation Data" })
    ).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();

    // compound details should show
    await expect(page.getByText("Compound: Caffeine")).toBeVisible();
    await expect(page.getByText(/Accession:/)).toBeVisible();
  });

  test("pressing ArrowDown then Enter selects a suggestion and submits", async ({
    page,
    compoundInput,
  }) => {
    // type partial compound name to trigger suggestions
    await compoundInput.fill("caff");
    await expect(compoundInput).toHaveValue("caff");

    // wait for suggestions to appear
    const suggestionList = page.getByTestId("suggestion-list");
    await expect(suggestionList).toBeVisible();

    await compoundInput.press("ArrowDown");
    await expect(suggestionList.locator("li").first()).toHaveClass(/bg-blue-100/);

    // Enter now selects the highlighted suggestion (calls e.preventDefault, closes list)
    await compoundInput.press("Enter");

    // suggestions should be dismissed and the input populated
    await expect(suggestionList).not.toBeVisible();
    await expect(compoundInput).toHaveValue("Caffearin");

    // press Enter again (global handler) to submit the form
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    // the form should submit with the selected suggestion
    await expect(page.getByText("Success!")).toBeVisible();
  });
});
