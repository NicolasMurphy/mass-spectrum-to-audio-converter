import { test, expect } from "./fixtures";
import { waitForGenerate } from "./test-helpers";

test.describe("Audio Settings Validation", () => {
  test.beforeEach(async ({ compoundInput }) => {
    // fill in a valid compound first; assert the value lands in React state
    // before tests proceed (Playwright fill -> React onChange has a small race
    // window in webkit that can otherwise leak into downstream submit assertions).
    await compoundInput.fill("caffeine");
    await expect(compoundInput).toHaveValue("caffeine");
  });

  test("submitting with duration below 0.01 shows an error", async ({
    page,
    generateButton,
  }) => {
    const durationInput = page.getByRole("spinbutton", { name: "Duration" });

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

    await expect(
      page.getByText("Duration must be between 0.01 and 30.")
    ).toBeVisible();
  });

  test("submitting with duration above 30 shows an error", async ({
    page,
    generateButton,
  }) => {
    const durationInput = page.getByRole("spinbutton", { name: "Duration" });

    await durationInput.fill("31");
    await generateButton.click();

    await expect(
      page.getByText("Duration must be between 0.01 and 30.")
    ).toBeVisible();
  });

  test("submitting with sample rate below 3500 shows an error", async ({
    page,
  }) => {
    const sampleRateInput = page.getByRole("spinbutton", {
      name: "Sample Rate (Hz)",
    });

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
  }) => {
    const sampleRateInput = page.getByRole("spinbutton", {
      name: "Sample Rate (Hz)",
    });

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
    generateButton,
  }) => {
    const durationInput = page.getByRole("spinbutton", { name: "Duration" });
    const sampleRateInput = page.getByRole("spinbutton", {
      name: "Sample Rate (Hz)",
    });

    await durationInput.fill("2");
    await sampleRateInput.fill("22050");
    await waitForGenerate(page, () => generateButton.click());

    await expect(page.getByText("Success!")).toBeVisible();
    await expect(page.locator("audio")).toBeVisible();

    await expect(
      page.getByRole("heading", { name: /Mass Spectrum Data/ })
    ).toBeVisible();
  });

  test("edge case: duration exactly 0.01 works", async ({
    page,
    generateButton,
  }) => {
    const durationInput = page.getByRole("spinbutton", { name: "Duration" });

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

    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: duration exactly 30 works", async ({
    page,
    generateButton,
  }) => {
    const durationInput = page.getByRole("spinbutton", { name: "Duration" });

    await durationInput.fill("30");
    await waitForGenerate(page, () => generateButton.click());

    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: sample rate exactly 3500 works", async ({
    page,
    generateButton,
  }) => {
    const sampleRateInput = page.getByRole("spinbutton", {
      name: "Sample Rate (Hz)",
    });

    await sampleRateInput.fill("3500");
    await waitForGenerate(page, () => generateButton.click());

    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("edge case: sample rate exactly 192000 works", async ({
    page,
    generateButton,
  }) => {
    const sampleRateInput = page.getByRole("spinbutton", {
      name: "Sample Rate (Hz)",
    });

    await sampleRateInput.fill("192000");
    await waitForGenerate(page, () => generateButton.click());

    await expect(page.getByText("Success!")).toBeVisible();
  });

  test("HQ toggle off: response echoes hq=false", async ({
    page,
    generateButton,
  }) => {
    const responsePromise = page.waitForResponse(
      (r) =>
        (r.url().includes("/massbank/") || r.url().includes("/custom/")) &&
        r.status() === 200,
      { timeout: 10000 }
    );
    await generateButton.click();
    const response = await responsePromise;
    const data = await response.json();
    expect(data.audio_settings.hq).toBe(false);
  });

  test("HQ toggle on: request sends hq=true and response echoes it", async ({
    page,
    generateButton,
  }) => {
    const hqCheckbox = page.getByRole("checkbox", { name: "HQ" });
    await hqCheckbox.check();
    await expect(hqCheckbox).toBeChecked();

    const requestPromise = page.waitForRequest(
      (r) => r.url().includes("/massbank/") && r.method() === "POST",
      { timeout: 10000 }
    );
    const responsePromise = page.waitForResponse(
      (r) =>
        (r.url().includes("/massbank/") || r.url().includes("/custom/")) &&
        r.status() === 200,
      { timeout: 10000 }
    );
    await generateButton.click();

    const request = await requestPromise;
    expect(request.postDataJSON().hq).toBe(true);

    const response = await responsePromise;
    const data = await response.json();
    expect(data.audio_settings.hq).toBe(true);
  });
});
