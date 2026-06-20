import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Compound Search", () => {
  test("user can search for 3-Man2GlcNAc and generate audio", async ({
    page,
    compoundInput,
    generateButton,
  }) => {
    await test.step("search and generate", async () => {
      await compoundInput.click();
      await compoundInput.fill("3-Man2GlcNAc");
      await expect(compoundInput).toHaveValue("3-Man2GlcNAc");
      await waitForGenerate(page, () => generateButton.click());
    });

    await test.step("spectrum and transformation tables", async () => {
      await expect(
        page.getByRole("heading", { name: "Mass Spectrum Data (11 peaks)" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Audio Transformation Data" })
      ).toBeVisible();
    });

    await test.step("first row of each table", async () => {
      const spectrumCells = page
        .getByRole("table")
        .first()
        .locator("tbody tr")
        .first()
        .locator("td");
      await expect(spectrumCells.nth(0)).toHaveText("324.8000");
      await expect(spectrumCells.nth(1)).toHaveText("50,160");

      const audioCells = page
        .getByRole("table")
        .nth(1)
        .locator("tbody tr")
        .first()
        .locator("td");
      await expect(audioCells.nth(0)).toHaveText("670.8000");
      await expect(audioCells.nth(1)).toHaveText("0.0000");
    });

    await test.step("result metadata and audio player", async () => {
      await expect(page.getByText("Success!")).toBeVisible();
      await expect(page.getByText("Compound: 3-Man2GlcNAc")).toBeVisible();
      await expect(
        page.getByText("MSBNK-Fukuyama_Univ-FU000005")
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Download WAV" })
      ).toBeVisible();
      await expect(page.locator("audio")).toBeVisible();
    });

    await test.step("lowest and highest piano keys", async () => {
      await expect(page.getByTestId("container")).toContainText("a");
      await expect(page.getByTestId("container")).toContainText("k");
    });
  });
});
