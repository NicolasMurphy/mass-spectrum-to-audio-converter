import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Custom Spectrum Mode", () => {
  test("switching to custom mode shows textarea and hides compound search", async ({
    page,
    compoundInput,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });

    // verify compound search is visible by default
    await expect(compoundInput).toBeVisible();

    // switch to custom mode
    await customTab.click();

    // compound search should be hidden
    await expect(compoundInput).not.toBeVisible();

    // spectrum data textarea should be visible
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

    // leave textarea empty and submit
    await generateButton.click();

    // error message should be visible
    await expect(page.getByText("Please enter spectrum data.")).toBeVisible();
  });

  test("entering valid m/z intensity pairs generates audio successfully", async ({
    page,
    generateButton,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const spectrumTextarea = page.locator("textarea");

    await customTab.click();

    // enter valid spectrum data
    const validData = "73.04 100\n150.05 50\n200.1 75";
    await spectrumTextarea.fill(validData);
    await waitForGenerate(page, () => generateButton.click());

    // success message and tables should be visible
    await expect(page.getByText("Success!")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Audio Transformation Data" })
    ).toBeVisible();

    // audio player should be visible
    await expect(page.locator("audio")).toBeVisible();
  });

  test("malformed input with odd number of values shows an error", async ({
    page,
    generateButton,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const spectrumTextarea = page.locator("textarea");

    await customTab.click();

    // enter malformed data (odd number of values)
    const malformedData = "100\n200\n300";
    await spectrumTextarea.fill(malformedData);
    await generateButton.click();

    // error message should be visible
    await expect(page.getByText(/Error:/)).toBeVisible();
  });

  test("switching back to massbank mode shows compound search again", async ({
    page,
    compoundInput,
  }) => {
    const customTab = page.getByRole("button", { name: "Custom" });
    const massbankTab = page.getByRole("button", { name: "MassBank" });
    const spectrumTextarea = page.locator("textarea");

    // switch to custom
    await customTab.click();
    await expect(spectrumTextarea).toBeVisible();

    // switch back to massbank
    await massbankTab.click();

    // compound search should be visible again
    await expect(compoundInput).toBeVisible();
    await expect(spectrumTextarea).not.toBeVisible();
  });
});
