import { test, expect, type Page } from "@playwright/test";
import { waitForGenerate } from "./test-helpers";

test.describe("History and Popular Compounds", () => {
  let compoundInput: ReturnType<Page["getByRole"]>;
  let generateButton: ReturnType<Page["getByRole"]>;

  test.beforeEach(async ({ page }: { page: Page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "🎲" })).toBeEnabled();
    compoundInput = page.getByRole("textbox", { name: "Compound Name" });
    generateButton = page.getByRole("button", { name: "Generate Audio" });
  });

  test("clicking a compound in Most Generated list populates the search field", async ({
    page,
  }: {
    page: Page;
  }) => {
    // scope to the card-body containing the Most Generated heading
    const mostGeneratedCard = page.locator(".card-body").filter({
      has: page.getByRole("heading", { name: "Most Generated" }),
    });

    // items are div.badge elements, not buttons — wait for /popular API
    const firstBadge = mostGeneratedCard.locator(".badge").first();
    await expect(firstBadge).toBeVisible();
    const compoundName = await firstBadge.textContent();

    await firstBadge.click();

    await expect(compoundInput).toHaveValue(compoundName?.trim() ?? "");
  });

  test("after generating audio, the compound appears in Recently Generated", async ({
    page,
  }: {
    page: Page;
  }) => {
    await compoundInput.fill("caffeine");
    await waitForGenerate(page, () => generateButton.click());
    await expect(page.getByText("Success!")).toBeVisible();

    // use the existing data-testid on the recently-generated list
    const recentlyGeneratedList = page.getByTestId("recently-generated-list");
    await expect(recentlyGeneratedList.getByText(/caffeine/i)).toBeVisible();
  });

  test("clicking a compound in Recently Generated populates the search field and switches to massbank mode", async ({
    page,
  }: {
    page: Page;
  }) => {
    // generate audio for caffeine to populate recently generated
    await compoundInput.fill("caffeine");
    await waitForGenerate(page, () => generateButton.click());
    await expect(page.getByText("Success!")).toBeVisible();

    // switch to custom mode so we can verify it switches back
    await page.getByRole("button", { name: "Custom" }).click();
    const spectrumTextarea = page.locator("textarea");
    await expect(spectrumTextarea).toBeVisible();

    // click caffeine in Recently Generated
    const recentlyGeneratedList = page.getByTestId("recently-generated-list");
    await recentlyGeneratedList
      .locator("div")
      .filter({ hasText: /^caffeine$/i })
      .first()
      .click();

    // input should be populated and we should be back in massbank mode
    await expect(compoundInput).toHaveValue(/caffeine/i);
    await expect(spectrumTextarea).not.toBeVisible();
    await expect(compoundInput).toBeVisible();
  });

  test("most generated compounds are displayed on page load", async ({
    page,
  }: {
    page: Page;
  }) => {
    const mostGeneratedCard = page.locator(".card-body").filter({
      has: page.getByRole("heading", { name: "Most Generated" }),
    });

    // Wait for at least one badge to appear — the /popular API call is async
    // and .count() doesn't retry, so we must wait for visibility first.
    const firstBadge = mostGeneratedCard.locator(".badge").first();
    await expect(firstBadge).toBeVisible();

    const count = await mostGeneratedCard.locator(".badge").count();
    expect(count).toBeGreaterThan(0);
  });

  test("recently generated section is present on page load", async ({
    page,
  }: {
    page: Page;
  }) => {
    await expect(
      page.getByRole("heading", { name: "Recently Generated" })
    ).toBeVisible();

    // the list container always renders (even if empty)
    await expect(page.getByTestId("recently-generated-list")).toBeVisible();
  });
});
