import { test, expect } from "./fixtures";

test.describe("Page Initialization", () => {
  test("page initializes with correct default state", async ({ page }) => {
    // empty tables
    await expect(page.getByText("No spectrum data yet")).toBeVisible();
    await expect(
      page.getByText(
        "Enter a compound name to generate audio and see the data transformation"
      )
    ).toBeVisible();

    // title, random
    await expect(
      page.getByRole("heading", { name: "Mass Spectrum to Audio" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "🎲" })).toBeVisible();

    // search
    await expect(
      page.getByRole("textbox", { name: "Compound Name" })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Compound Name" })
    ).toBeEmpty();

    // generate
    await expect(
      page.getByRole("button", { name: "Generate Audio" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Generate Audio" })
    ).toBeEnabled();

    // algorithms
    await expect(
      page.getByRole("radio", { name: "Linear: mz + offset" })
    ).toBeChecked();
    await expect(
      page.getByRole("radio", { name: "Inverse: scale / (mz + shift)" })
    ).toBeVisible();
    await expect(
      page.getByRole("radio", {
        name: "Modulo: ((mz * factor) % modulus) + base",
      })
    ).toBeVisible();

    // fields, defaults
    await expect(
      page.getByRole("spinbutton", { name: "Offset (m/z) (Linear only)" })
    ).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: "Offset (m/z) (Linear only)" })
    ).toHaveValue("300");

    await expect(
      page.getByRole("spinbutton", { name: "Duration" })
    ).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: "Duration" })
    ).toHaveValue("5");

    await expect(
      page.getByRole("spinbutton", { name: "Sample Rate (Hz)" })
    ).toBeVisible();
    await expect(
      page.getByRole("spinbutton", { name: "Sample Rate (Hz)" })
    ).toHaveValue("44100");

    // popular and history
    await expect(
      page.getByRole("heading", { name: "Most Generated" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Recently Generated" })
    ).toBeVisible();

    // modal
    await page.getByRole("button", { name: "How to use this app" }).click();
    await expect(
      page.getByRole("heading", { name: "How to Use This App" })
    ).toBeVisible();
    await page.getByRole("button", { name: "✕" }).click();
    await expect(
      page.getByRole("heading", { name: "How to Use This App" })
    ).not.toBeVisible();
  });
});
