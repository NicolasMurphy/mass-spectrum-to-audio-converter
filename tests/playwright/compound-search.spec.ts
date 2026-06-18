import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Compound Search", () => {
  test("user can search for caffeine and generate audio", async ({
    page,
    compoundInput,
    generateButton,
  }) => {
    await test.step("search and generate", async () => {
      await compoundInput.click();
      await compoundInput.fill("caffeine");
      await expect(compoundInput).toHaveValue("caffeine");
      await waitForGenerate(page, () => generateButton.click());
    });

    await test.step("spectrum and transformation tables", async () => {
      await expect(
        page.getByRole("heading", { name: "Mass Spectrum Data (9 peaks)" })
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Audio Transformation Data" })
      ).toBeVisible();
    });

    await test.step("first/last peaks from both tables", async () => {
      await expect(
        page.getByRole("cell", { name: "56.0498", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "5,501,836", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "195.0877", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "529,785,088", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "356.0498", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "-39.6718", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "495.0877", exact: true })
      ).toBeVisible();
      await expect(
        page.getByRole("cell", { name: "0.0000", exact: true })
      ).toBeVisible();
    });

    await test.step("result metadata and audio player", async () => {
      await expect(page.getByText("Success!")).toBeVisible();
      await expect(page.getByText("Compound: Caffeine")).toBeVisible();
      await expect(
        page.getByText("Accession: MSBNK-ACES_SU-AS000088")
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
