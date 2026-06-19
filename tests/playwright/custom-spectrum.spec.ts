import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Custom Spectrum Mode", () => {
  test("switching to custom mode shows textarea and hides compound search", async ({
    page,
    compoundInput,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });

    await expect(compoundInput).toBeVisible();

    await customTab.click();

    await expect(compoundInput).not.toBeVisible();

    const spectrumTextarea = page.locator("textarea");
    await expect(spectrumTextarea).toBeVisible();
    await expect(spectrumTextarea).toHaveAttribute(
      "placeholder",
      /Enter spectrum data/
    );
  });

  test("submitting empty custom mode shows an error", async ({
    page,
    generateButton,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });

    await customTab.click();

    await generateButton.click();

    await expect(page.getByText("Please enter spectrum data.")).toBeVisible();
  });

  test("entering valid m/z intensity pairs generates audio successfully", async ({
    page,
    generateButton,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const spectrumTextarea = page.locator("textarea");

    await customTab.click();

    const validData = "73.04 100\n150.05 50\n200.1 75";
    await spectrumTextarea.fill(validData);
    await waitForGenerate(page, () => generateButton.click());

    await expect(page.getByText("Success!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audio Transformation Data" })
    ).toBeVisible();

    await expect(page.locator("audio")).toBeVisible();
  });

  test("malformed input with odd number of values shows an error", async ({
    page,
    generateButton,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const spectrumTextarea = page.locator("textarea");

    await customTab.click();

    const malformedData = "100\n200\n300";
    await spectrumTextarea.fill(malformedData);
    await generateButton.click();

    await expect(page.getByText(/Error:/)).toBeVisible();
  });

  test("switching back to massbank mode shows compound search again", async ({
    page,
    compoundInput,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const massbankTab = page.getByRole("button", { name: "MassBank" });
    const spectrumTextarea = page.locator("textarea");

    await customTab.click();
    await expect(spectrumTextarea).toBeVisible();

    await massbankTab.click();

    await expect(compoundInput).toBeVisible();
    await expect(spectrumTextarea).not.toBeVisible();
  });
});
