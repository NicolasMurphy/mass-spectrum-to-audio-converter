import { type Page } from "@playwright/test";

/**
 * Registers a waitForResponse listener for the audio generation endpoint,
 * executes the trigger action, then awaits the response. This decouples
 * the network wait from DOM assertions.
 *
 * With workers: 1, tests run serially so the Flask backend is never
 * contended — requests complete in ~1s (cached) or a few seconds
 * (uncached). 15s timeout covers the worst case (cold start + heavy
 * audio like duration=30) with headroom to spare.
 *
 * Only use this for tests that expect a SUCCESSFUL generate (HTTP 200).
 * Tests that expect validation errors don't need it — those are either
 * client-side or very fast API responses.
 */
export async function waitForGenerate(
  page: Page,
  trigger: () => Promise<void>
): Promise<void> {
  const responsePromise = page.waitForResponse(
    (response) =>
      (response.url().includes("/massbank/") ||
        response.url().includes("/custom/")) &&
      response.status() === 200,
    { timeout: 5000 }
  );
  await trigger();
  await responsePromise;
}
