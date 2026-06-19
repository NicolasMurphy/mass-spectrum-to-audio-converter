import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Random Compound", () => {
  test("random compound button generates audio successfully", async ({
    page,
    generateButton,
  }) => {
    const randomButton = page.getByRole("button", { name: "🎲" });

    await randomButton.click();
    await waitForGenerate(page, () => generateButton.click());

    await expect(
      page.getByRole("heading", { name: "Mass Spectrum Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audio Transformation Data" })
    ).toBeVisible();

    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.getByText("Compound: ")).toBeVisible();
    await expect(page.getByText("Accession: ")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Download WAV" })
    ).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();

    const compoundName: string = await page
      .getByRole("textbox", { name: "Compound Name" })
      .inputValue();
    await expect(
      page.getByTestId("recently-generated-list").getByText(compoundName)
    ).toBeVisible();

    // piano keys are visible (lowest and highest)
    await expect(page.getByTestId("container")).toContainText("a");
    await expect(page.getByTestId("container")).toContainText("k");
  });
});
