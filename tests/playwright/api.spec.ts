import { test, expect } from "@playwright/test";


test.describe("API", () => {
  test("MassBank linear response contract", async ({ request }) => {
    const response = await request.post("/massbank/linear", {
      data: { compound: "caffeine", duration: 3 },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();

    // top-level keys exist
    expect(data).toHaveProperty("audio_base64");
    expect(data).toHaveProperty("compound");
    expect(data).toHaveProperty("accession");
    expect(data).toHaveProperty("algorithm");
    expect(data).toHaveProperty("spectrum");
    expect(data).toHaveProperty("parameters");
    expect(data).toHaveProperty("audio_settings");

    // value checks
    expect(data.compound.toLowerCase()).toContain("caffeine");
    expect(data.algorithm).toBe("linear");
    expect(data.parameters).toHaveProperty("offset");
    expect(data.audio_settings.duration).toBe(3);
    expect(data.audio_settings.sample_rate).toBe(44100);

    // spectrum array shape
    expect(Array.isArray(data.spectrum)).toBe(true);
    expect(data.spectrum.length).toBeGreaterThan(0);

    for (const item of data.spectrum) {
      expect(item).toHaveProperty("mz");
      expect(item).toHaveProperty("frequency");
      expect(item).toHaveProperty("intensity");
      expect(item).toHaveProperty("amplitude_linear");
      expect(item).toHaveProperty("amplitude_db");
    }
  });

  test("audio base64 decodes to valid WAV", async ({ request }) => {
    const response = await request.post("/massbank/linear", {
      data: { compound: "caffeine", duration: 3 },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    const buffer = Buffer.from(data.audio_base64, "base64");

    expect(buffer.length).toBeGreaterThan(44);
    expect(buffer.subarray(0, 4).toString()).toBe("RIFF");
  });
});
