import { test, expect, type Page } from "@playwright/test";
import { waitForGenerate } from "./test-helpers";

test.describe("Keyboard Navigation", () => {
  let compoundInput: ReturnType<Page["getByRole"]>;
  let generateButton: ReturnType<Page["getByRole"]>;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
    // The random button is disabled while compounds.length === 0 — becoming
    // enabled means compounds.json has loaded and React state is updated,
    // which is required before the suggestion list can appear.
    await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
    compoundInput = page.getByRole("textbox", { name: "Compound Name" });
    generateButton = page.getByRole("button", { name: "Generate Audio" });
  });

  test("pressing Enter on the compound name field submits the form", async ({
    page,
  }: {
    page: Page;
  }) => {
    // focus on compound input and type a compound
    await compoundInput.fill("caffeine");
    await compoundInput.focus();

    // press Enter
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    // form should be submitted (audio player visible)
    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();
  });

  test("pressing Enter while focused on textarea does NOT submit the form", async ({
    page,
  }: {
    page: Page;
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
  }: {
    page: Page;
  }) => {
    // fill compound, press Enter, get audio
    await compoundInput.fill("caffeine");

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
  }: {
    page: Page;
  }) => {
    // type partial compound name to trigger suggestions
    await compoundInput.fill("caff");

    // wait for suggestions to appear
    const suggestionList = page.locator(".suggestion-list");
    await expect(suggestionList).toBeVisible();

    // ArrowDown to highlight the first suggestion (selectedIndex goes from -1 to 0).
    // Then wait for bg-blue-100 to appear before pressing Enter — ArrowDown triggers
    // setSelectedIndex(0) which is an async React state update. If Enter fires before
    // the re-render commits, selectedIndex is still -1 and handleSuggestionClick is
    // never called, causing the form to submit with the raw typed text instead.
    await compoundInput.press("ArrowDown");
    await expect(suggestionList.locator("li").first()).toHaveClass(/bg-blue-100/);

    // Enter now selects the highlighted suggestion (calls e.preventDefault, closes list)
    await compoundInput.press("Enter");

    // suggestions should be dismissed and the input populated
    await expect(suggestionList).not.toBeVisible();

    // press Enter again (global handler) to submit the form
    await waitForGenerate(page, () => page.keyboard.press("Enter"));

    // the form should submit with the selected suggestion
    await expect(page.getByText("Success!")).toBeVisible();
  });
});
