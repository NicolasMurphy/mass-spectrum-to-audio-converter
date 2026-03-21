import { test, expect, type Page } from "@playwright/test";
import { waitForGenerate } from "./test-helpers";

test.describe("Audio Settings Validation", () => {
  let compoundInput: ReturnType<Page["getByRole"]>;
  let generateButton: ReturnType<Page["getByRole"]>;
  let durationInput: ReturnType<Page["getByRole"]>;
  let sampleRateInput: ReturnType<Page["getByRole"]>;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
    compoundInput = page.getByRole("textbox", { name: "Compound Name" });
    generateButton = page.getByRole("button", { name: "Generate Audio" });
    durationInput = page.getByRole("spinbutton", { name: "Duration" });
    sampleRateInput = page.getByRole("spinbutton", { name: "Sample Rate (Hz)" });

    // fill in a valid compound first
    await compoundInput.fill("caffeine");
  });

  test("submitting with duration below 0.01 shows an error", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Webkit (and tablet/iPad) reject sub-step decimal values via .fill() on
    // type="number" inputs with default step=1, so the React onChange never
    // fires and the value stays at the default. Use the native setter instead.
    await durationInput.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(el, "0.005");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    // React 18 batches state updates asynchronously. Wait for the controlled
    // input to stabilise at the new value before submitting — otherwise the
    // click can race ahead while React still holds the old duration state.
    await expect(durationInput).toHaveValue("0.005");
    await generateButton.click();

    // error message should be visible
    await expect(
      page.getByText("Duration must be between 0.01 and 30.")
    ).toBeVisible();
  });

  test("submitting with duration above 30 shows an error", async ({
    page,
  }: {
    page: Page;
  }) => {
    // set duration above 30
    await durationInput.fill("31");
    await generateButton.click();

    // error message should be visible
    await expect(
      page.getByText("Duration must be between 0.01 and 30.")
    ).toBeVisible();
  });

  test("submitting with sample rate below 3500 shows an error", async ({
    page,
  }: {
    page: Page;
  }) => {
    // The sample rate input has HTML min/max attributes which trigger browser-native
    // form validation before React's handler fires. We bypass this by dispatching
    // the submit event directly so React's own validation runs.
    await sampleRateInput.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(el, "3000");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(sampleRateInput).toHaveValue("3000");

    await page.evaluate(() => {
      document
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
    });

    await expect(
      page.getByText("Sample rate must be between 3500 and 192000.")
    ).toBeVisible();
  });

  test("submitting with sample rate above 192000 shows an error", async ({
    page,
  }: {
    page: Page;
  }) => {
    await sampleRateInput.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(el, "200000");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(sampleRateInput).toHaveValue("200000");

    await page.evaluate(() => {
      document
        .querySelector("form")
        ?.dispatchEvent(
          new Event("submit", { bubbles: true, cancelable: true })
        );
    });

    await expect(
      page.getByText("Sample rate must be between 3500 and 192000.")
    ).toBeVisible();
  });

  test("submitting with valid non-default audio settings works", async ({
    page,
  }: {
    page: Page;
  }) => {
    // set valid non-default values
    await durationInput.fill("2");
    await sampleRateInput.fill("22050");
    await waitForGenerate(page, () => generateButton.click());

    // success and audio player should be visible
    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();

    // verify the settings were applied (table should show data)
    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
  });

  test("edge case: duration exactly 0.01 works", async ({
    page,
  }: {
    page: Page;
  }) => {
    // Use native setter — webkit/tablet treat 0.01 as an invalid step value
    // for type="number" with default step=1, causing .fill() to be silently ignored.
    await durationInput.evaluate((el: HTMLInputElement) => {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      )?.set;
      nativeSetter?.call(el, "0.01");
      el.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await expect(durationInput).toHaveValue("0.01");
    await waitForGenerate(page, () => generateButton.click());

    // should succeed
    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: duration exactly 30 works", async ({
    page,
  }: {
    page: Page;
  }) => {
    // set duration to exactly 30 — waitForGenerate handles the network wait
    await durationInput.fill("30");
    await waitForGenerate(page, () => generateButton.click());

    // should succeed
    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: sample rate exactly 3500 works", async ({
    page,
  }: {
    page: Page;
  }) => {
    // set sample rate to exactly 3500
    await sampleRateInput.fill("3500");
    await waitForGenerate(page, () => generateButton.click());

    // should succeed
    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: sample rate exactly 192000 works", async ({
    page,
  }: {
    page: Page;
  }) => {
    // set sample rate to exactly 192000
    await sampleRateInput.fill("192000");
    await waitForGenerate(page, () => generateButton.click());

    // should succeed
    await expect(page.getByText("Success!")).toBeVisible();
  });
});
